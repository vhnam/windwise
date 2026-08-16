import { chat, chatParamsFromRequest, toServerSentEventsResponse } from '@tanstack/ai';

import {
  createConsultationAdapter,
  createConsultationTools,
  SYSTEM_PROMPT_V1,
  templatedRephrase,
  validateAssistantText,
} from '@windwise/ai';
import { getDb } from '@windwise/db';

export async function handleConsultChat(request: Request): Promise<Response> {
  const db = getDb();
  const adapter = createConsultationAdapter();
  const params = await chatParamsFromRequest(request);
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId') ?? undefined;
  const tools = createConsultationTools(db, sessionId);

  const stream = chat({
    adapter,
    ...params,
    systemPrompts: [SYSTEM_PROMPT_V1],
    tools,
  });

  const guarded = (async function* () {
    let text = '';
    const toolResults: unknown[] = [];
    for await (const chunk of stream) {
      if (chunk.type === 'TEXT_MESSAGE_CONTENT' && chunk.delta) {
        text += chunk.delta;
      }
      if (chunk.type === 'TOOL_CALL_RESULT') {
        toolResults.push(chunk.content ?? chunk);
      }
      yield chunk;
    }

    if (text) {
      const outcome = validateAssistantText(text, toolResults);
      if (!outcome.ok) {
        yield {
          type: 'TEXT_MESSAGE_CONTENT',
          delta: `\n\n${templatedRephrase(toolResults)}`,
        };
      }
    }
  })();

  return toServerSentEventsResponse(guarded as never);
}
