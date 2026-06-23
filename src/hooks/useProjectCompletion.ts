import { useState, useCallback, useMemo } from 'react';
import {
  ProjectType,
  StageId,
  StageProgress,
  StageWeights,
  CompletionResult,
  PROJECT_WEIGHTS,
  STAGE_ORDER,
  calculateOverallProgress,
  validateWeights,
} from '../utils/projectCompletion';

// ─── الحالة الداخلية ──────────────────────────────────────────────────────────

interface State {
  projectType:   ProjectType;
  stageProgress: StageProgress[];
  customWeights: StageWeights | null; // null = استخدام الأوزان الافتراضية
}

// ─── الواجهة المعادة ─────────────────────────────────────────────────────────

export interface UseProjectCompletionReturn {
  /** نوع المشروع الحالي */
  projectType: ProjectType;
  /** نسب إنجاز البنود الخمسة */
  stageProgress: StageProgress[];
  /** الأوزان المستخدمة حالياً (مخصصة أو افتراضية) */
  currentWeights: StageWeights;
  /** هل الأوزان مخصصة أم افتراضية */
  isCustomWeights: boolean;
  /** نتيجة الحساب — null إذا كانت الأوزان غير صحيحة */
  result: CompletionResult | null;
  /** رسالة خطأ التحقق — null إذا كان كل شيء صحيحاً */
  validationError: string | null;

  /** تغيير نوع المشروع — يُعيد الأوزان للافتراضي تلقائياً */
  setProjectType: (type: ProjectType) => void;
  /** تحديث نسبة إنجاز بند محدد */
  updateStageCompletion: (stageId: StageId, completion: number) => void;
  /** تحديث وزن بند محدد يدوياً */
  updateWeight: (stageId: StageId, weight: number) => void;
  /** إعادة الأوزان للقيم الافتراضية */
  resetWeights: () => void;
  /** إعادة ضبط نسب الإنجاز كلها إلى 0 */
  resetProgress: () => void;
}

// ─── دالة بناء نسب الإنجاز الابتدائية ───────────────────────────────────────

function buildDefaultProgress(): StageProgress[] {
  return STAGE_ORDER.map(stageId => ({ stageId, completion: 0 }));
}

// ─── الـ Hook ─────────────────────────────────────────────────────────────────

/**
 * Hook لحساب نسبة إنجاز مشاريع ذات النوع الواحد.
 *
 * الميزات:
 * - تغيير نوع المشروع مع إعادة الأوزان للافتراضي تلقائياً
 * - تعديل أوزان البنود يدوياً مع التحقق أن مجموعها = 100%
 * - إعادة حساب الإنجاز تلقائياً عند أي تغيير
 * - مدخلات من Supabase: مرّر initialProgress للبيانات القادمة من قاعدة البيانات
 *
 * @param initialType      نوع المشروع الابتدائي
 * @param initialProgress  نسب الإنجاز الابتدائية (اختياري — افتراضي: كلها صفر)
 */
export function useProjectCompletion(
  initialType: ProjectType = 'residential',
  initialProgress?: StageProgress[],
): UseProjectCompletionReturn {
  const [state, setState] = useState<State>({
    projectType:   initialType,
    stageProgress: initialProgress ?? buildDefaultProgress(),
    customWeights: null,
  });

  // الأوزان المستخدمة حالياً
  const currentWeights: StageWeights =
    state.customWeights ?? PROJECT_WEIGHTS[state.projectType];

  // التحقق من صحة الأوزان
  const validation = useMemo(
    () => validateWeights(currentWeights),
    [currentWeights],
  );

  // حساب النتيجة — يُعيد null إذا كانت الأوزان غير صحيحة
  const result = useMemo<CompletionResult | null>(() => {
    if (!validation.valid) return null;
    try {
      return calculateOverallProgress(
        state.projectType,
        state.stageProgress,
        state.customWeights ?? undefined,
      );
    } catch {
      return null;
    }
  }, [state.projectType, state.stageProgress, state.customWeights, validation.valid]);

  // تغيير نوع المشروع — يُعيد الأوزان للافتراضي
  const setProjectType = useCallback((type: ProjectType) => {
    setState(prev => ({ ...prev, projectType: type, customWeights: null }));
  }, []);

  // تحديث نسبة إنجاز بند محدد
  const updateStageCompletion = useCallback((stageId: StageId, completion: number) => {
    const clamped = Math.min(100, Math.max(0, completion));
    setState(prev => ({
      ...prev,
      stageProgress: prev.stageProgress.map(s =>
        s.stageId === stageId ? { ...s, completion: clamped } : s
      ),
    }));
  }, []);

  // تعديل وزن بند يدوياً — يُنشئ نسخة من الأوزان الافتراضية إن لم تكن مخصصة
  const updateWeight = useCallback((stageId: StageId, weight: number) => {
    setState(prev => {
      const base = prev.customWeights ?? PROJECT_WEIGHTS[prev.projectType];
      return {
        ...prev,
        customWeights: { ...base, [stageId]: Math.max(0, weight) },
      };
    });
  }, []);

  // إعادة الأوزان للافتراضي
  const resetWeights = useCallback(() => {
    setState(prev => ({ ...prev, customWeights: null }));
  }, []);

  // إعادة ضبط نسب الإنجاز
  const resetProgress = useCallback(() => {
    setState(prev => ({ ...prev, stageProgress: buildDefaultProgress() }));
  }, []);

  return {
    projectType:     state.projectType,
    stageProgress:   state.stageProgress,
    currentWeights,
    isCustomWeights: state.customWeights !== null,
    result,
    validationError: validation.valid ? null : (validation.error ?? null),
    setProjectType,
    updateStageCompletion,
    updateWeight,
    resetWeights,
    resetProgress,
  };
}
