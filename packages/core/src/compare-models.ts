import type {
  ComparisonAspect,
  ComparisonResult,
  InstrumentModel,
  ModelComparisonNote,
  PricePoint,
} from '@windwise/schemas';

const PRIORITY_HIGHLIGHTS: Record<ComparisonAspect, ComparisonAspect[]> = {
  tone: ['tone'],
  weight_response: ['weight_response'],
  projection: ['projection'],
  budget: ['budget'],
};

function selectPrice(modelId: string, prices: PricePoint[]): PricePoint | undefined {
  const forModel = prices.filter((price) => price.modelId === modelId && price.isCurrent);
  return forModel.find((price) => price.scope === 'vn_street') ?? forModel[0];
}

function noteTouchesPair(note: ModelComparisonNote, leftId: string, rightId: string): boolean {
  const [first, second] = leftId < rightId ? [leftId, rightId] : [rightId, leftId];
  return note.modelAId === first && note.modelBId === second;
}

export function compareModelsCore(
  models: InstrumentModel[],
  prices: PricePoint[],
  notes: ModelComparisonNote[],
  priority?: ComparisonAspect,
): ComparisonResult {
  const compared = models.map((model) => ({
    modelId: model.id,
    specs: {
      displayName: model.displayName,
      modelCode: model.modelCode,
      familyId: model.familyId,
      sourceUrl: model.sourceUrl,
    },
    tier: model.levelTier,
    price: selectPrice(model.id, prices),
  }));

  const publishedNotes = notes.filter((note) => note.publishedAt != null && note.publishedAt !== '');
  const pairNotes = publishedNotes.filter((note) => {
    for (let i = 0; i < models.length; i += 1) {
      for (let j = i + 1; j < models.length; j += 1) {
        const left = models[i];
        const right = models[j];
        if (left && right && noteTouchesPair(note, left.id, right.id)) {
          return true;
        }
      }
    }
    return false;
  });

  return {
    models: compared,
    notes: pairNotes.map((note) => ({
      aspect: note.aspect,
      noteVi: note.noteVi,
      noteEn: note.noteEn,
    })),
    highlightedAspects: priority ? PRIORITY_HIGHLIGHTS[priority] : [],
  };
}
