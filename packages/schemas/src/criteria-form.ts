import * as v from 'valibot';

import { criteriaPicklistOptions, isArrayCriteriaSchema, unwrapCriteriaSchema } from './criteria-inspect.ts';
import { CriteriaKeys, CriteriaSchema, isRequiredCriteriaKey, type Criteria } from './criteria.ts';

export type FormCriteriaQuestion = {
  name: keyof Criteria;
  required: boolean;
  multiple: boolean;
  prompt: string;
  description: string;
  choices: Array<{ value: string; label: string }>;
};

const CRITERIA_COPY_VI: Partial<
  Record<keyof Criteria, { prompt: string; description: string; choices?: Record<string, string> }>
> = {
  level: {
    prompt: 'Trình độ',
    description: 'Chọn trình độ hiện tại.',
    choices: {
      beginner: 'Mới bắt đầu',
      intermediate: '1–3 năm',
      advanced: 'Nâng cao',
      professional: 'Chuyên nghiệp',
    },
  },
  purpose: {
    prompt: 'Mục đích',
    description: 'Bạn chủ yếu chơi trong hoàn cảnh nào?',
    choices: {
      school: 'Học đường',
      concert_band: 'Concert band',
      jazz: 'Jazz',
      orchestra: 'Giao hưởng',
      marching: 'Diễu hành',
      personal: 'Cá nhân',
    },
  },
  budget: {
    prompt: 'Ngân sách',
    description: 'Khoảng chi phí dự kiến cho nhạc cụ.',
    choices: {
      under_20m: 'Dưới 20 triệu',
      '20_50m': '20–50 triệu',
      '50_100m': '50–100 triệu',
      over_100m: 'Trên 100 triệu',
    },
  },
  age: {
    prompt: 'Độ tuổi',
    description: 'Không bắt buộc. Bỏ qua nếu không muốn nêu.',
    choices: {
      under_8: 'Dưới 8 tuổi',
      '8_11': '8–11 tuổi',
      '12_14': '12–14 tuổi',
      '15_plus': '15 tuổi trở lên',
    },
  },
  sectionPreference: {
    prompt: 'Nhóm nhạc cụ',
    description: 'Không bắt buộc. Bỏ qua nếu chưa có thiên hướng.',
    choices: {
      undecided: 'Chưa quyết định',
      brass: 'Đồng',
      woodwind: 'Gỗ',
      trumpet: 'Trumpet',
      clarinet: 'Clarinet',
      flute: 'Flute',
      'alto-sax': 'Alto sax',
    },
  },
  physicalNotes: {
    prompt: 'Ghi chú thể chất',
    description: 'Chọn tất cả mục phù hợp, hoặc bỏ qua.',
    choices: {
      braces: 'Niềng răng',
      small_hands: 'Tay nhỏ',
      asthma: 'Hen suyễn',
    },
  },
};

export function formCriteriaQuestions(): FormCriteriaQuestion[] {
  return CriteriaKeys.flatMap((key) => {
    const schema = CriteriaSchema.entries[key];
    const options = criteriaPicklistOptions(schema);
    if (!options) {
      return [];
    }
    const copy = CRITERIA_COPY_VI[key];
    return [
      {
        name: key,
        required: isRequiredCriteriaKey(key),
        multiple: isArrayCriteriaSchema(schema),
        prompt: copy?.prompt ?? key,
        description: copy?.description ?? '',
        choices: options.map((value) => ({
          value,
          label: copy?.choices?.[value] ?? value,
        })),
      },
    ];
  });
}

export function parseStoredCriteriaValue(key: keyof Criteria, raw: string): unknown {
  const inner = unwrapCriteriaSchema(CriteriaSchema.entries[key]);
  if (inner.type === 'array') {
    return v.parse(
      inner as never,
      raw.split(',').filter((item) => item.length > 0),
    );
  }
  if (inner.type === 'number') {
    return v.parse(inner as never, Number(raw));
  }
  return v.parse(inner as never, raw);
}
