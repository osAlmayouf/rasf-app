import { useState, useCallback, useMemo } from 'react';
import { StageId, StageProgress, STAGE_ORDER } from '../utils/projectCompletion';
import {
  ComponentType,
  MixedUseComponent,
  MixedUseResult,
  calculateMixedUseProgress,
  validateMixedUseComponents,
} from '../utils/mixedUseCompletion';

// ─── الواجهة المعادة ──────────────────────────────────────────────────────────

export interface UseMixedUseCompletionReturn {
  /** مكونات المشروع الحالية */
  components: MixedUseComponent[];
  /** نتيجة الحساب — null إذا لم تكن المكونات صحيحة بعد */
  result: MixedUseResult | null;
  /** مجموع GFA% الحالي */
  totalGfa: number;
  /** هل مجموع GFA% = 100% (شرط الحساب) */
  isGfaValid: boolean;
  /** رسالة خطأ التحقق — null إذا كان كل شيء صحيحاً */
  validationError: string | null;

  /** إضافة مكوّن جديد */
  addComponent: (type: ComponentType, gfaPercent?: number) => void;
  /** حذف مكوّن */
  removeComponent: (type: ComponentType) => void;
  /** تحديث GFA% لمكوّن */
  updateGfa: (type: ComponentType, gfaPercent: number) => void;
  /** تحديث نسبة إنجاز بند محدد داخل مكوّن محدد */
  updateStageCompletion: (
    componentType: ComponentType,
    stageId: StageId,
    completion: number,
  ) => void;
  /** إعادة ضبط نسب إنجاز مكوّن بالكامل إلى صفر */
  resetComponentProgress: (type: ComponentType) => void;
  /** إعادة ضبط كل شيء */
  reset: () => void;
}

// ─── دالة بناء نسب الإنجاز الابتدائية ───────────────────────────────────────

function buildDefaultProgress(): StageProgress[] {
  return STAGE_ORDER.map(stageId => ({ stageId, completion: 0 }));
}

// ─── الـ Hook ─────────────────────────────────────────────────────────────────

/**
 * Hook لحساب نسبة إنجاز المشاريع متعددة الاستخدامات.
 *
 * الميزات:
 * - إضافة / حذف مكونات (سكني، مكاتب، تجاري، فندقي)
 * - تحديث GFA% لكل مكوّن مع التحقق أن المجموع = 100%
 * - تحديث نسبة إنجاز أي بند داخل أي مكوّن
 * - حساب تلقائي عند أي تغيير
 * - مدخلات من Supabase: مرّر initialComponents للبيانات القادمة من قاعدة البيانات
 *
 * @param initialComponents  مكونات ابتدائية (اختياري)
 */
export function useMixedUseCompletion(
  initialComponents: MixedUseComponent[] = [],
): UseMixedUseCompletionReturn {
  const [components, setComponents] = useState<MixedUseComponent[]>(initialComponents);

  // مجموع GFA% الحالي
  const totalGfa = useMemo(
    () => components.reduce((sum, c) => sum + c.gfaPercent, 0),
    [components],
  );

  // التحقق من صحة المكونات
  const validation = useMemo(
    () => validateMixedUseComponents(components),
    [components],
  );

  // حساب النتيجة
  const result = useMemo<MixedUseResult | null>(() => {
    if (!validation.valid || components.length === 0) return null;
    try {
      return calculateMixedUseProgress(components);
    } catch {
      return null;
    }
  }, [components, validation.valid]);

  // إضافة مكوّن — يرفض التكرار
  const addComponent = useCallback((type: ComponentType, gfaPercent = 0) => {
    setComponents(prev => {
      if (prev.some(c => c.type === type)) return prev;
      return [
        ...prev,
        {
          type,
          gfaPercent: Math.min(100, Math.max(0, gfaPercent)),
          stageProgress: buildDefaultProgress(),
        },
      ];
    });
  }, []);

  // حذف مكوّن
  const removeComponent = useCallback((type: ComponentType) => {
    setComponents(prev => prev.filter(c => c.type !== type));
  }, []);

  // تحديث GFA%
  const updateGfa = useCallback((type: ComponentType, gfaPercent: number) => {
    const clamped = Math.min(100, Math.max(0, gfaPercent));
    setComponents(prev =>
      prev.map(c => (c.type === type ? { ...c, gfaPercent: clamped } : c))
    );
  }, []);

  // تحديث نسبة إنجاز بند داخل مكوّن
  const updateStageCompletion = useCallback(
    (componentType: ComponentType, stageId: StageId, completion: number) => {
      const clamped = Math.min(100, Math.max(0, completion));
      setComponents(prev =>
        prev.map(c =>
          c.type === componentType
            ? {
                ...c,
                stageProgress: c.stageProgress.map(s =>
                  s.stageId === stageId ? { ...s, completion: clamped } : s
                ),
              }
            : c
        )
      );
    },
    [],
  );

  // إعادة ضبط نسب إنجاز مكوّن بالكامل
  const resetComponentProgress = useCallback((type: ComponentType) => {
    setComponents(prev =>
      prev.map(c =>
        c.type === type ? { ...c, stageProgress: buildDefaultProgress() } : c
      )
    );
  }, []);

  // إعادة ضبط كل شيء
  const reset = useCallback(() => {
    setComponents([]);
  }, []);

  return {
    components,
    result,
    totalGfa:       parseFloat(totalGfa.toFixed(2)),
    isGfaValid:     Math.abs(totalGfa - 100) <= 0.01,
    validationError: validation.valid ? null : (validation.error ?? null),
    addComponent,
    removeComponent,
    updateGfa,
    updateStageCompletion,
    resetComponentProgress,
    reset,
  };
}
