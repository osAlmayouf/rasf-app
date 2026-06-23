// ─── أنواع البيانات ───────────────────────────────────────────────────────────

/** معرّفات البنود الخمسة الثابتة في النظام */
export type StageId =
  | 'feasibility'    // دراسة الجدوى
  | 'design'         // التصاميم والترخيص
  | 'excavation'     // الحفر والأساسات
  | 'construction'   // التطوير والإنشاء
  | 'handover';      // التسليم والإشغال

/** أنواع المشاريع المدعومة */
export type ProjectType =
  | 'residential'     // سكني
  | 'commercial'      // تجاري
  | 'industrial'      // صناعي
  | 'infrastructure'; // بنية تحتية

/** الترتيب الثابت للبنود */
export const STAGE_ORDER: readonly StageId[] = [
  'feasibility',
  'design',
  'excavation',
  'construction',
  'handover',
] as const;

/** أسماء البنود بالعربية */
export const STAGE_LABELS: Record<StageId, string> = {
  feasibility:  'دراسة الجدوى',
  design:       'التصاميم والترخيص',
  excavation:   'الحفر والأساسات',
  construction: 'التطوير والإنشاء',
  handover:     'التسليم والإشغال',
};

/** أوزان البنود — مجموعها يجب أن يساوي 100 */
export type StageWeights = Record<StageId, number>;

/** نسبة إنجاز بند واحد (0–100) */
export interface StageProgress {
  stageId: StageId;
  completion: number; // 0-100
}

/** مساهمة بند واحد في الإنجاز الإجمالي */
export interface StageBreakdown {
  stageId: StageId;
  label: string;
  completion: number;   // نسبة إنجاز البند (0-100)
  weight: number;       // الوزن المخصص للبند
  contribution: number; // completion × weight / 100
}

/** النتيجة الكاملة لحساب الإنجاز */
export interface CompletionResult {
  total: number;               // الإنجاز الإجمالي (0-100)
  breakdown: StageBreakdown[]; // تفصيل كل بند
}

/** نتيجة التحقق من صحة البيانات */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ─── ثوابت الأوزان لكل نوع مشروع ────────────────────────────────────────────

export const PROJECT_WEIGHTS: Record<ProjectType, StageWeights> = {
  /** سكني: أبراج، فلل، شقق */
  residential: {
    feasibility:  5,
    design:       10,
    excavation:   20,
    construction: 55,
    handover:     10,
  },
  /** تجاري: مول، مكاتب */
  commercial: {
    feasibility:  5,
    design:       12,
    excavation:   18,
    construction: 55,
    handover:     10,
  },
  /** صناعي: مصنع، مستودعات */
  industrial: {
    feasibility:  8,
    design:       15,
    excavation:   25,
    construction: 42,
    handover:     10,
  },
  /** بنية تحتية: طرق، شبكات */
  infrastructure: {
    feasibility:  10,
    design:       20,
    excavation:   35,
    construction: 25,
    handover:     10,
  },
};

// ─── التحقق من صحة الأوزان ───────────────────────────────────────────────────

/**
 * يتحقق أن الأوزان صحيحة:
 * - كل قيمة بين 0 و 100
 * - المجموع يساوي 100 (هامش 0.01 لمعالجة الكسور العشرية)
 */
export function validateWeights(weights: StageWeights): ValidationResult {
  for (const stageId of STAGE_ORDER) {
    const w = weights[stageId];
    if (w < 0 || w > 100) {
      return {
        valid: false,
        error: `وزن البند "${STAGE_LABELS[stageId]}" (${w}) خارج النطاق المسموح (0–100)`,
      };
    }
  }

  const sum = STAGE_ORDER.reduce((acc, s) => acc + weights[s], 0);
  if (Math.abs(sum - 100) > 0.01) {
    return {
      valid: false,
      error: `مجموع الأوزان (${sum.toFixed(2)}%) يجب أن يساوي 100%`,
    };
  }

  return { valid: true };
}

// ─── الدالة الرئيسية ──────────────────────────────────────────────────────────

/**
 * يحسب نسبة الإنجاز الإجمالية لمشروع ذي نوع واحد.
 *
 * الصيغة: إنجاز المشروع = Σ (نسبة إنجاز البند × وزنه ÷ 100)
 *
 * @param projectType    نوع المشروع
 * @param stageProgress  نسب إنجاز البنود الخمسة
 * @param customWeights  أوزان مخصصة — إن لم تُمرَّر يُستخدم الافتراضي
 */
export function calculateOverallProgress(
  projectType: ProjectType,
  stageProgress: StageProgress[],
  customWeights?: Partial<StageWeights>,
): CompletionResult {
  // دمج الأوزان الافتراضية مع المخصصة
  const weights: StageWeights = {
    ...PROJECT_WEIGHTS[projectType],
    ...customWeights,
  };

  const validation = validateWeights(weights);
  if (!validation.valid) throw new Error(validation.error);

  const progressMap = new Map<StageId, number>(
    stageProgress.map(s => [s.stageId, Math.min(100, Math.max(0, s.completion))])
  );

  let total = 0;
  const breakdown: StageBreakdown[] = STAGE_ORDER.map(stageId => {
    const completion   = progressMap.get(stageId) ?? 0;
    const weight       = weights[stageId];
    const contribution = (completion * weight) / 100;
    total += contribution;
    return {
      stageId,
      label: STAGE_LABELS[stageId],
      completion,
      weight,
      contribution: parseFloat(contribution.toFixed(4)),
    };
  });

  return { total: parseFloat(total.toFixed(2)), breakdown };
}

// ─── اختبار مدمج (يُشغَّل يدوياً عند الحاجة) ────────────────────────────────

/**
 * اختبار الوحدة للمشروع السكني.
 *
 * المدخلات: الجدوى 100% | التصاميم 100% | الحفر 78% | الإنشاء 28% | التسليم 0%
 * النتيجة المتوقعة: 46.0%
 *   (100×5 + 100×10 + 78×20 + 28×55 + 0×10) / 100 = 46.0
 */
export function _testResidential(): void {
  const result = calculateOverallProgress('residential', [
    { stageId: 'feasibility',  completion: 100 },
    { stageId: 'design',       completion: 100 },
    { stageId: 'excavation',   completion: 78  },
    { stageId: 'construction', completion: 28  },
    { stageId: 'handover',     completion: 0   },
  ]);
  console.assert(result.total === 46.0, `expected 46.0 got ${result.total}`);
  console.table(result.breakdown.map(b => ({
    بند: b.label,
    إنجاز: `${b.completion}%`,
    وزن: `${b.weight}%`,
    مساهمة: `${b.contribution.toFixed(2)}%`,
  })));
  console.log('الإنجاز الإجمالي:', result.total + '%');
}
