import { ExternalLinkIcon, ShieldCheckIcon } from 'lucide-react';

import { Button } from '@windwise/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@windwise/ui/components/card';

const SOURCE_KIND_LABEL: Record<string, string> = {
  manufacturer: 'Nhà sản xuất',
  dealer: 'Đại lý',
  manual_pdf: 'Tài liệu hướng dẫn',
  editorial: 'Bài viết chuyên môn',
  expert_review: 'Đánh giá chuyên gia',
};

export type TrustSignalsProps = {
  lastVerifiedAt: string;
  source?: { kind: string; url: string; publisher: string } | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN');
}

function TrustSignals({ lastVerifiedAt, source }: TrustSignalsProps) {
  return (
    <Card className="bg-card/80 backdrop-blur-md">
      <CardHeader className="gap-2">
        <CardTitle className="text-base">Nguồn xác minh</CardTitle>
        <CardDescription className="flex items-start gap-2 text-sm leading-relaxed">
          <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Đã xác minh lần cuối: {formatDate(lastVerifiedAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-(--card-spacing)">
        {source ? (
          <Button
            nativeButton={false}
            variant="outline"
            className="h-11 min-h-11 max-w-full px-3 text-sm whitespace-normal"
            render={<a href={source.url} target="_blank" rel="noreferrer noopener" />}
          >
            <ExternalLinkIcon data-icon="inline-start" aria-hidden="true" />
            Nguồn: {source.publisher} ({SOURCE_KIND_LABEL[source.kind] ?? source.kind})
          </Button>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">Chưa có nguồn xác minh cho nhạc cụ này.</p>
        )}
      </CardContent>
    </Card>
  );
}

export { TrustSignals };
