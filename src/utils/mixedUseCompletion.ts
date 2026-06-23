import {
  StageId,
  StageWeights,
  StageProgress,
  StageBreakdown,
  STAGE_LABELS,
  STAGE_ORDER,
  ValidationResult,
} from './projectCompletion';

// ─── أنواع البيانات ───────────────────────────────────────────────────────────

/** أنواع مكونات المشاريع متعددة الاستخدامات */
export type ComponentType =
  | 'residential'  // سكني
  | 'office'       // مكاتب
  | 'commercial'   // تجاري
  | 'hotel';       // فندقي

/** أسماء المكونات بالعربية */
export const COMPONENT_LABELS: Record<ComponentType, string> = {
  residential: 'سكني',
  office:      'مكاتب',
  commercial:  'تجاري',
  hotel:       'فندقي',
};

/** بيانات مكوّن واحد في المشروع المتعدد الاستخدامات */
export interface MixedUseComponent {
  type: ComponentType;
  /** نسبة هذا المكوّن من إجمالي المساحة المبنية (0–100) */
  gfaPercent: number;
  /** نسب إنجاز البنود الخمسة لهذا المكوّن */
  stageProgress: StageProgress[];
}

/** نتيجة حساب إنجاز مكوّن واحد */
export interface ComponentResult {
  type: ComponentType;
  label: string;
  gfaPercent: number;
  /** إنجاز المكوّن منفرداً (0–100) */
  componentTotal: number;
  /** مساهمته في الإجمالي = componentTotal × gfaPercent / 100 */
  weightedContribution: number;
  breakdown: StageBreakdown[];
}

/** متوسط إنجاز مرحلة واحدة مرجّحاً بـ GFA% عبر جميع المكونات */
export interface WeightedStage {
  stageId: StageId;
  label: string;
  weightedCompletion: number;
}

/** النتيجة الكاملة لمشروع متعدد الاستخدامات */
export interface MixedUseResult {
  total: number;
  components: ComponentResult[];
  /** إنجاز كل مرحلة موزونة عبر المكونات — مفيد للعرض الجرافيكي */
  weightedStages: WeightedStage[];
}

// ─── ثوابت أوزان كل مكوّن ────────────────────────────────────────────────────

export const MIXED_USE_WEIGHTS: Record<ComponentType, StageWeights> = {
  /** سكني */
  residential: {
    feasibility:  5,
    design:       10,
    excavation:   20,
    construction: 55,
    handover:     10,
  },
  /** مكاتب */
  office: {
    feasibility:  5,
    design:       12,
    excavation:   18,
    construction: 55,
    handover:     10,
  },
  /** تجاري */
  commercial: {
    feasibility:  5,
    design:       15,
    excavation:   15,
    construction: 55,
    handover:     10,
  },
  /**
   * فندقي — التسليم أثقل لأنه يشمل التجهيز والتأثيث والتشغيل التجريبي
   */
  hotel: {
    feasibility:  8,
    design:       15,
    excavation:   17,
    construction: 45,
    handover:     15,
  },
};

// ─── التحقق من صحة المكونات ──────────────────────────────────────────────────

/**
 * يتحقق أن مكونات المشروع صحيحة:
 * - مكوّن واحد على الأقل
 * - لا تكرار لنفس النوع
 * - كل gfaPercent بين 0 و 100
 * - مجموع gfaPercent = 100%
 */
export function validateMixedUseComponents(
  components: MixedUseComponent[],
): ValidationResult {
  if (components.length === 0) {
    return { valid: false, error: 'يجب إضافة مكوّن واحد على الأقل' };
  }

  // منع تكرار المكونات
  const seen = new Set<ComponentType>();
  for (const comp of components) {
    if (seen.has(comp.type)) {
      return {
        valid: false,
        error: `المكوّن "${COMPONENT_LABELS[comp.type]}" مكرر — لا يُسمح بأكثر من مكوّن من نفس النوع`,
      };
    }
    seen.add(comp.type);
  }

  // التحقق من نطاق كل gfaPercent
  for (const comp of components) {
    if (comp.gfaPercent < 0 || comp.gfaPercent > 100) {
      return {
        valid: false,
        error: `نسبة GFA للمكوّن "${COMPONENT_LABELS[comp.type]}" (${comp.gfaPercent}%) خارج النطاق (0–100)`,
      };
    }
  }

  // التحقق أن مجموع GFA% = 100
  const totalGfa = components.reduce((sum, c) => sum + c.gfaPercent, 0);
  if (Math.abs(totalGfa - 100) > 0.01) {
    return {
      valid: false,
      error: `مجموع نسب GFA (${totalGfa.toFixed(2)}%) يجب أن يساوي 100%`,
    };
  }

  return { valid: true };
}

// ─── الدالة الرئيسية ──────────────────────────────────────────────────────────

/**
 * يحسب نسبة الإنجاز الإجمالية لمشروع متعدد الاستخدامات.
 *
 * الصيغة:
 *   إنجاز المكوّن  = Σ (نسبة إنجاز البند × وزنه ÷ 100)
 *   إنجاز المشروع  = Σ (إنجاز كل مكوّن × GFA% ÷ 100)
 *
 * @param components  مصفوفة المكونات مع GFA% ونسب إنجاز البنود
 */
export function calculateMixedUseProgress(
  components: MixedUseComponent[],
): MixedUseResult {
  const validation = validateMixedUseComponents(components);
  if (!validation.valid) throw new Error(validation.error);

  let total = 0;
  const componentResults: ComponentResult[] = [];

  for (const comp of components) {
    const weights = MIXED_USE_WEIGHTS[comp.type];
    const progressMap = new Map<StageId, number>(
      comp.stageProgress.map(s => [s.stageId, Math.min(100, Math.max(0, s.completion))])
    );

    let componentTotal = 0;
    const breakdown: StageBreakdown[] = STAGE_ORDER.map(stageId => {
      const completion   = progressMap.get(stageId) ?? 0;
      const weight       = weights[stageId];
      const contribution = (completion * weight) / 100;
      componentTotal += contribution;
      return {
        stageId,
        label:        STAGE_LABELS[stageId],
        completion,
        weight,
        contribution: parseFloat(contribution.toFixed(4)),
      };
    });

    const weightedContribution = (componentTotal * comp.gfaPercent) / 100;
    total += weightedContribution;

    componentResults.push({
      type:                 comp.type,
      label:                COMPONENT_LABELS[comp.type],
      gfaPercent:           comp.gfaPercent,
      componentTotal:       parseFloat(componentTotal.toFixed(2)),
      weightedContribution: parseFloat(weightedContribution.toFixed(4)),
      breakdown,
    });
  }

  // متوسط إنجاز كل مرحلة مرجّحاً بـ GFA% — للعرض الجرافيكي
  const weightedStages: WeightedStage[] = STAGE_ORDER.map(stageId => {
    const weightedCompletion = componentResults.reduce((sum, cr) => {
      const stage = cr.breakdown.find(b => b.stageId === stageId);
      return sum + ((stage?.completion ?? 0) * cr.gfaPercent) / 100;
    }, 0);
    return {
      stageId,
      label:               STAGE_LABELS[stageId],
      weightedCompletion:  parseFloat(weightedCompletion.toFixed(2)),
    };
  });

  return {
    total:          parseFloat(total.toFixed(2)),
    components:     componentResults,
    weightedStages,
  };
}

// ─── اختبار مدمج ─────────────────────────────────────────────────────────────

/**
 * اختبار المشروع متعدد الاستخدامات.
 *
 * سكني 40% | مكاتب 35% | تجاري 15% | فندقي 10%
 * جميع المكونات: الجدوى 100% | التصاميم 100% | الحفر 78% | الإنشاء 28% | التسليم 0%
 *
 * النتائج المتوقعة:
 *   سكني    = 46.00% → مساهمة = 18.400
 *   مكاتب   = 46.44% → مساهمة = 16.254
 *   تجاري   = 47.10% → مساهمة = 7.065
 *   فندقي   = 48.86% → مساهمة = 4.886
 *   الإجمالي ≈ 46.61%
 */
export function _testMixedUse(): void {
  const progress = [
    { stageId: 'feasibility'  as StageId, completion: 100 },
    { stageId: 'design'       as StageId, completion: 100 },
    { stageId: 'excavation'   as StageId, completion: 78  },
    { stageId: 'construction' as StageId, completion: 28  },
    { stageId: 'handover'     as StageId, completion: 0   },
  ];

  const result = calculateMixedUseProgress([
    { type: 'residential', gfaPercent: 40, stageProgress: progress },
    { type: 'office',      gfaPercent: 35, stageProgress: progress },
    { type: 'commercial',  gfaPercent: 15, stageProgress: progress },
    { type: 'hotel',       gfaPercent: 10, stageProgress: progress },
  ]);

  console.table(result.components.map(c => ({
    مكوّن:   c.label,
    'GFA%':  c.gfaPercent + '%',
    إنجاز:   c.componentTotal + '%',
    مساهمة: c.weightedContribution.toFixed(3) + '%',
  })));

  console.log('\nالمراحل الموزونة:');
  console.table(result.weightedStages.map(s => ({
    مرحلة: s.label,
    'إنجاز مرجّح': s.weightedCompletion + '%',
  })));

  console.log('الإنجاز الإجمالي:', result.total + '%');
}
