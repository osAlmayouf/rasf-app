// ─── بنود مراحل المشروع (بوابات: منجز / جارٍ / لم يبدأ) ──────────────────────
// مصدر واحد للبنود وحساب نسبة الإنجاز، يُستورد في النموذج واللوحة معاً.

/** البنود الخمسة بالترتيب */
export const PHASE_KEYS = ['ph1', 'ph2', 'ph3', 'ph4', 'ph5'];

/** وزن كل بند في نسبة الإنجاز — المجموع = 100 */
export const PHASE_WEIGHTS = {
  ph1: 12.5,  // دراسة الجدوى
  ph2: 42.5,  // التصميم
  ph3: 20,    // موافقات حكومية
  ph4: 20,    // موافقات بنكية/تمويلية
  ph5: 5,     // تحويل المشروع إلى قطاع العمليات
};

/** حالات البوابة */
export const PHASE_STATUS = { PENDING: 'pending', ACTIVE: 'active', DONE: 'done' };

/** نصيب الحالة من وزن البند (منجز=كامل، جارٍ=نصف، لم يبدأ=صفر) */
const STATUS_VALUE = { done: 1, active: 0.5, pending: 0 };

/** يطبّع مرحلة إلى حالة بوابة (يدعم البيانات القديمة المخزّنة كنسبة مئوية) */
export function phaseStatusOf(phase) {
  if (phase?.status) return phase.status;
  const p = phase?.progress ?? 0;
  if (p >= 100) return PHASE_STATUS.DONE;
  if (p > 0)    return PHASE_STATUS.ACTIVE;
  return PHASE_STATUS.PENDING;
}

/** نسبة الإنجاز الإجمالية = Σ (نصيب حالة البند × وزنه) */
export function progressFromPhases(phases) {
  if (!phases?.length) return null;
  const total = phases.reduce((s, ph) => {
    const value  = STATUS_VALUE[phaseStatusOf(ph)] ?? 0;
    const weight = PHASE_WEIGHTS[ph.key] ?? 0;
    return s + value * weight;
  }, 0);
  return parseFloat(total.toFixed(1));
}

/** بنود افتراضية (كلها "لم يبدأ") لمشروع قائم جديد */
export function defaultPhases() {
  return PHASE_KEYS.map(key => ({ key, status: PHASE_STATUS.PENDING }));
}
