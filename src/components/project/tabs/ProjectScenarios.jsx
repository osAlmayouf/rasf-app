import { useState, useRef } from 'react';
import { useApp } from '../../../contexts/useApp';
import { fmtPct } from '../../../utils/fmt';
import { parseStudyFile } from '../../../utils/studyParser';
import GlassCard from '../../common/GlassCard';
import SARNum from '../../common/SARNum';
import Tag from '../../common/Tag';
import { Plus, Pencil, Trash2, CheckCircle2, Layers, Ruler, TrendingUp, X, Star, FileSpreadsheet, Loader2, AlertCircle, ChevronDown, DollarSign } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
const num = (v) => (v === '' || v === null || v === undefined ? undefined : Number(v));
const fmtUnits = (v) => (v ? Number(v).toLocaleString('en-US') : '—');

// مقترح مكتمل مالياً = توجد أرقام مالية، وإلا فهو تقني فقط
function scenarioStage(s) {
  const hasFin = [s.totalCost, s.totalRevenue, s.irr, s.roi, s.financingRequired].some(v => num(v) != null);
  return hasFin ? 'complete' : 'technical';
}

const EMPTY_FORM = {
  name: '', useType: '',
  totalGBA: '', units: '', farValue: '',
  totalCost: '', totalRevenue: '', equityRequired: '', financingRequired: '',
  irr: '', roi: '', roeAnnual: '', paybackYears: '',
};

// يحوّل مخرجات parseStudyFile إلى مقترح جاهز للمراجعة (الأرقام المالية بالمليون)
function extractedToScenario(ex, fallbackName) {
  const n = (v) => (v === null || v === undefined ? '' : v);
  const compArr = ex.componentBreakdown
    ? Object.entries(ex.componentBreakdown).map(([key, d]) => ({ key, ...d }))
    : [];
  // نوع الاستخدام = أكبر مكوّن بالمساحة
  const top = [...compArr].sort((a, b) => (b.gba || b.area || 0) - (a.gba || a.area || 0))[0];
  return {
    name:              ex.projectName || fallbackName || 'مقترح مستورد',
    useType:           top?.nameAr || '',
    location:          ex.location || '',
    totalGBA:          ex.aboveGradeGBA || ex.totalGBA || '',
    units:             n(ex.units),
    farValue:          n(ex.farValue),
    totalCost:         n(ex.totalCost ?? ex.investmentM),
    totalRevenue:      n(ex.totalRevenue),
    equityRequired:    n(ex.totalEquity),
    financingRequired: n(ex.bankFinancingAmount),
    irr:               n(ex.irr),
    roi:               n(ex.roi),
    roeAnnual:         n(ex.roeAnnual),
    paybackYears:      n(ex.paybackYears),
    // بيانات غنية تُحفظ مع المقترح (تمر عبر النموذج دون تعديل)
    componentBreakdown: compArr,
    revenueBreakdown:   ex.revenueBreakdown || null,
    importedFrom:      fallbackName || null,
  };
}

// عدد الحقول التي نجح استخراجها — لإظهار جودة الاستيراد
function countExtracted(scn) {
  const keys = ['totalGBA', 'units', 'farValue', 'totalCost', 'totalRevenue', 'equityRequired', 'financingRequired', 'irr', 'roi', 'roeAnnual', 'paybackYears'];
  return keys.filter(k => scn[k] !== '' && scn[k] != null).length;
}

// ── Comparison table metric definitions ───────────────────────────────────────
// best: 'max' | 'min' | null  (null = informational, no winner highlight)
const METRICS = [
  { key: 'totalGBA',          label: 'إجمالي البناء',  kind: 'text', best: null },
  { key: 'units',             label: 'عدد الوحدات',     kind: 'units', best: 'max' },
  { key: 'farValue',          label: 'معامل البناء FAR', kind: 'farx', best: null },
  { key: 'totalCost',         label: 'إجمالي التكلفة',  kind: 'sar',  best: null },
  { key: 'totalRevenue',      label: 'إجمالي الإيرادات', kind: 'sar',  best: 'max' },
  { key: 'netProfit',         label: 'صافي الربح',       kind: 'sar',  best: 'max' },
  { key: 'financingRequired', label: 'التمويل المطلوب',  kind: 'sar',  best: null },
  { key: 'irr',               label: 'IRR',              kind: 'pct',  best: 'max' },
  { key: 'roi',               label: 'ROI',              kind: 'pct',  best: 'max' },
  { key: 'roeAnnual',         label: 'ROE سنوي',         kind: 'pct',  best: 'max' },
  { key: 'paybackYears',      label: 'فترة الاسترداد',   kind: 'years', best: 'min' },
];

function metricValue(s, key) {
  if (key === 'netProfit') {
    const r = num(s.totalRevenue), c = num(s.totalCost);
    return (r != null && c != null) ? r - c : undefined;
  }
  return num(s[key]) ?? (typeof s[key] === 'string' ? s[key] : undefined);
}

function renderMetric(kind, v) {
  if (v == null || v === '') return <span style={{ color: 'var(--text-faint)' }}>—</span>;
  switch (kind) {
    case 'sar':   return <SARNum millions={Number(v)} symbolSize="0.8em" />;
    case 'pct':   return fmtPct(v);
    case 'units': return `${fmtUnits(v)} وحدة`;
    case 'farx':  return `${v}x`;
    case 'years': return `${v} سنة`;
    default:      return String(v);
  }
}

// ── Scenario card ──────────────────────────────────────────────────────────────
function ScenarioCard({ scenario, onSelect, onEdit, onDelete }) {
  const stage = scenarioStage(scenario);
  const isSelected = scenario.selected;
  const netProfit = metricValue(scenario, 'netProfit');

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border: isSelected ? '1.5px solid var(--rasf-primary)' : '1px solid var(--border)',
        boxShadow: isSelected ? '0 0 0 3px var(--rasf-primary-dim)' : 'none',
        transition: 'all .2s',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div className="p-4" style={{ borderBottom: '1px solid var(--border-faint)' }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {isSelected && <Star size={15} style={{ color: 'var(--rasf-primary)', fill: 'var(--rasf-primary)', flexShrink: 0 }} />}
            <span className="font-bold truncate" style={{ fontSize: 14, color: 'var(--text-hi)' }}>{scenario.name}</span>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={() => onEdit(scenario)} title="تعديل"
              style={{ color: 'var(--text-muted)', padding: 4, borderRadius: 6, background: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--rasf-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              <Pencil size={13} />
            </button>
            <button onClick={() => onDelete(scenario)} title="حذف"
              style={{ color: 'var(--text-muted)', padding: 4, borderRadius: 6, background: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {scenario.useType && <Tag variant="purple">{scenario.useType}</Tag>}
          {stage === 'complete'
            ? <Tag variant="green">مكتمل مالياً</Tag>
            : <Tag variant="amber">تقني فقط</Tag>}
        </div>
      </div>

      {/* Technical block */}
      <div className="p-4" style={{ borderBottom: '1px solid var(--border-faint)' }}>
        <div className="flex items-center gap-1.5 mb-3" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
          <Ruler size={12} /> الأرقام الفنية
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="البناء" value={scenario.totalGBA || '—'} />
          <MiniStat label="الوحدات" value={fmtUnits(scenario.units)} />
          <MiniStat label="FAR" value={scenario.farValue ? `${scenario.farValue}x` : '—'} />
        </div>
      </div>

      {/* Financial block */}
      <div className="p-4" style={{ flex: 1 }}>
        <div className="flex items-center gap-1.5 mb-3" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
          <TrendingUp size={12} /> الدراسة المالية
        </div>
        {stage === 'technical' ? (
          <div className="text-center py-3" style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>
            بانتظار الدراسة المالية
          </div>
        ) : (
          <div className="space-y-1.5">
            <CardRow label="التكلفة"   value={<SARNum millions={num(scenario.totalCost)} symbolSize="0.8em" />} />
            <CardRow label="الإيرادات" value={<SARNum millions={num(scenario.totalRevenue)} symbolSize="0.8em" />} />
            <CardRow label="صافي الربح" value={<SARNum millions={netProfit} symbolSize="0.8em" />} color="#10b981" bold />
            <CardRow label="التمويل المطلوب" value={<SARNum millions={num(scenario.financingRequired)} symbolSize="0.8em" />} />
            <div className="flex gap-2 pt-2 mt-1" style={{ borderTop: '1px solid var(--border-faint)' }}>
              <Pill label="IRR" value={fmtPct(scenario.irr)} />
              <Pill label="ROI" value={fmtPct(scenario.roi)} />
              <Pill label="استرداد" value={scenario.paybackYears ? `${scenario.paybackYears}س` : '—'} />
            </div>
            <RevenueAssumptions rb={scenario.revenueBreakdown} />
          </div>
        )}
      </div>

      {/* Select footer */}
      <button
        onClick={() => onSelect(scenario)}
        disabled={isSelected}
        style={{
          padding: '10px 0', fontSize: 12.5, fontWeight: 700,
          border: 'none', cursor: isSelected ? 'default' : 'pointer',
          background: isSelected ? 'var(--rasf-primary-dim)' : 'var(--bg-card-strong)',
          color: isSelected ? 'var(--rasf-primary)' : 'var(--text-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          transition: 'all .15s',
        }}
        onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = 'var(--rasf-primary)'; e.currentTarget.style.color = 'var(--bg-app)'; } }}
        onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = 'var(--bg-card-strong)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
      >
        <CheckCircle2 size={14} />
        {isSelected ? 'أفضل استخدام — معتمد' : 'اعتماد كأفضل استخدام'}
      </button>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg p-2 text-center" style={{ background: 'var(--bg-card-strong)' }}>
      <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-hi)' }}>{value}</div>
    </div>
  );
}

function CardRow({ label, value, color = 'var(--text-hi)', bold = false }) {
  return (
    <div className="flex justify-between items-center">
      <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 12.5, fontWeight: bold ? 700 : 600, color }}>{value}</span>
    </div>
  );
}

function Pill({ label, value }) {
  return (
    <div className="flex-1 rounded-lg py-1.5 text-center" style={{ background: 'var(--bg-card-strong)' }}>
      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--rasf-primary)' }}>{value}</div>
    </div>
  );
}

// ── Revenue assumptions (aggregate cards → per-component drill-down) ─────────────
const REV_TYPES = [
  { key: 'directSale',   label: 'بيع مباشر',   total: 'totalSales',
    cols: [['units', 'وحدات', 'n'], ['salePricePerSqm', 'سعر/م²', 'n'], ['totalSales', 'المبيعات', 'sar']] },
  { key: 'offPlan',      label: 'على الخارطة', total: 'totalSales',
    cols: [['units', 'وحدات', 'n'], ['salePricePerSqm', 'سعر/م²', 'n'], ['totalSales', 'المبيعات', 'sar']] },
  { key: 'annualRental', label: 'تأجير سنوي',  total: 'annualRevenue',
    cols: [['units', 'وحدات', 'n'], ['rentPerSqm', 'تأجير/م²', 'n'], ['occupancy', 'إشغال', 'pct'], ['annualRevenue', 'الإيراد', 'sar'], ['payback', 'استرداد', 'yr']] },
  { key: 'dailyRental',  label: 'تأجير يومي',  total: 'totalRevenue',
    cols: [['units', 'وحدات', 'n'], ['dailyRate', 'سعر يومي', 'n'], ['occupancy', 'إشغال', 'pct'], ['totalRevenue', 'الإيراد', 'sar']] },
  { key: 'capRate',      label: 'المخارجة',    total: 'totalCapitalized',
    cols: [['capRate', 'Cap', 'pct'], ['unitValueCap', 'قيمة الوحدة', 'sar'], ['totalCapitalized', 'القيمة', 'sar']] },
];

const revCell = (v, kind) => {
  if (v == null || v === '') return '—';
  if (kind === 'sar') return <SARNum millions={Number(v)} symbolSize="0.7em" />;
  if (kind === 'pct') return fmtPct(v);
  if (kind === 'yr')  return `${v}س`;
  return Number(v).toLocaleString('en-US');
};
const revTh = { padding: '4px 5px', fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' };
const revTd = { padding: '4px 5px', fontSize: 10.5, textAlign: 'center', color: 'var(--text-med)' };

function RevenueAssumptions({ rb }) {
  const [open, setOpen] = useState(null);
  if (!rb) return null;
  const types = REV_TYPES.filter(t => rb[t.key] &&
    (rb[t.key].total?.[t.total] != null || Object.keys(rb[t.key].perComponent || {}).length));
  if (!types.length) return null;

  const openType = types.find(t => t.key === open);
  const rows = openType ? Object.values(rb[open].perComponent || {}) : [];

  return (
    <div className="pt-2.5 mt-2.5" style={{ borderTop: '1px solid var(--border-faint)' }}>
      <div className="flex items-center gap-1.5 mb-2" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
        <DollarSign size={12} /> افتراضات الإيراد
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {types.map(t => {
          const totalVal = rb[t.key].total?.[t.total];
          const isOpen = open === t.key;
          return (
            <button key={t.key} onClick={() => setOpen(isOpen ? null : t.key)}
              style={{ background: isOpen ? 'var(--rasf-primary-dim)' : 'var(--bg-card-strong)',
                border: isOpen ? '1px solid var(--rasf-primary)' : '1px solid transparent',
                borderRadius: 8, padding: '6px 8px', cursor: 'pointer', textAlign: 'right' }}>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t.label}</span>
                <ChevronDown size={11} style={{ color: 'var(--text-faint)',
                  transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-hi)' }}>
                {totalVal != null ? <SARNum millions={Number(totalVal)} symbolSize="0.7em" /> : '—'}
              </div>
            </button>
          );
        })}
      </div>
      {openType && (
        rows.length ? (
          <div className="mt-2 rounded-lg" style={{ border: '1px solid var(--border-faint)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card-strong)' }}>
                  <th style={revTh}>المكوّن</th>
                  {openType.cols.map(([, lbl]) => <th key={lbl} style={revTh}>{lbl}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border-faint)' }}>
                    <td style={{ ...revTd, fontWeight: 600, color: 'var(--text-hi)' }}>{r.nameAr}</td>
                    {openType.cols.map(([f, , kind]) => <td key={f} style={revTd}>{revCell(r[f], kind)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-2 text-center py-2" style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>لا يوجد تفصيل لكل مكوّن</div>
        )
      )}
    </div>
  );
}

// ── Add/Edit modal ──────────────────────────────────────────────────────────────
function ScenarioModal({ initial, mode = 'new', onSave, onClose }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const heading = mode === 'edit' ? 'تعديل المقترح' : mode === 'import' ? 'مراجعة المقترح المستورد' : 'مقترح استخدام جديد';
  const cta     = mode === 'edit' ? 'حفظ التعديلات' : 'إضافة المقترح';
  const extractedCount = mode === 'import' ? countExtracted(form) : 0;

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({ ...form, name: form.name.trim() });
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1 }}>
          <div className="font-bold" style={{ fontSize: 16, color: 'var(--text-hi)' }}>{heading}</div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: 4 }}><X size={18} /></button>
        </div>

        {/* Import review banner */}
        {mode === 'import' && (
          <div className="flex items-start gap-2.5 mx-5 mt-5 p-3 rounded-xl" style={{ background: 'var(--rasf-primary-dim)', border: '1px solid var(--border-tag-warm)' }}>
            <FileSpreadsheet size={16} style={{ color: 'var(--rasf-primary)', flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 11.5, lineHeight: 1.6, color: 'var(--text-med)' }}>
              تم استخراج <b style={{ color: 'var(--rasf-primary)' }}>{extractedCount}</b> حقلاً من{form.importedFrom ? <> «<b>{form.importedFrom}</b>»</> : ' الملف'}.
              راجع الأرقام وعدّل الناقص قبل الإضافة.
            </div>
          </div>
        )}

        <div className="p-5 space-y-5">
          {/* Identity */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="اسم المقترح" wide>
              <input value={form.name} onChange={set('name')} placeholder="سيناريو أ — سكني فاخر" style={inputStyle} autoFocus />
            </Field>
            <Field label="نوع الاستخدام" wide>
              <input value={form.useType} onChange={set('useType')} placeholder="سكني / تجاري / مختلط" style={inputStyle} />
            </Field>
          </div>

          {/* Technical section */}
          <Section icon={<Ruler size={13} />} title="الأرقام الفنية">
            <Field label="إجمالي البناء (GBA)">
              <input value={form.totalGBA} onChange={set('totalGBA')} placeholder="45,000 م²" style={inputStyle} />
            </Field>
            <Field label="عدد الوحدات">
              <input value={form.units} onChange={set('units')} type="number" placeholder="200" style={inputStyle} />
            </Field>
            <Field label="معامل البناء FAR">
              <input value={form.farValue} onChange={set('farValue')} type="number" step="0.1" placeholder="3.5" style={inputStyle} />
            </Field>
          </Section>

          {/* Financial section */}
          <Section icon={<TrendingUp size={13} />} title="الدراسة المالية" hint="تُملأ من المسؤول المالي — اتركها فارغة للمقترح التقني">
            <Field label="إجمالي التكلفة (مليون)">
              <input value={form.totalCost} onChange={set('totalCost')} type="number" placeholder="250" style={inputStyle} />
            </Field>
            <Field label="إجمالي الإيرادات (مليون)">
              <input value={form.totalRevenue} onChange={set('totalRevenue')} type="number" placeholder="380" style={inputStyle} />
            </Field>
            <Field label="رأس المال الذاتي (مليون)">
              <input value={form.equityRequired} onChange={set('equityRequired')} type="number" placeholder="90" style={inputStyle} />
            </Field>
            <Field label="التمويل المطلوب (مليون)">
              <input value={form.financingRequired} onChange={set('financingRequired')} type="number" placeholder="180" style={inputStyle} />
            </Field>
            <Field label="IRR %">
              <input value={form.irr} onChange={set('irr')} type="number" step="0.1" placeholder="21" style={inputStyle} />
            </Field>
            <Field label="ROI %">
              <input value={form.roi} onChange={set('roi')} type="number" step="0.1" placeholder="34" style={inputStyle} />
            </Field>
            <Field label="ROE سنوي %">
              <input value={form.roeAnnual} onChange={set('roeAnnual')} type="number" step="0.1" placeholder="16" style={inputStyle} />
            </Field>
            <Field label="فترة الاسترداد (سنوات)">
              <input value={form.paybackYears} onChange={set('paybackYears')} type="number" step="0.5" placeholder="5" style={inputStyle} />
            </Field>
          </Section>
        </div>

        {/* Modal footer */}
        <div className="flex gap-3 p-5" style={{ borderTop: '1px solid var(--border)', position: 'sticky', bottom: 0, background: 'var(--bg-card)' }}>
          <button onClick={handleSave} disabled={!form.name.trim()}
            style={{ flex: 1, padding: '11px 0', borderRadius: 10, fontWeight: 700, fontSize: 14, border: 'none',
              background: form.name.trim() ? 'var(--rasf-primary)' : 'var(--bg-card-strong)',
              color: form.name.trim() ? 'var(--bg-app)' : 'var(--text-faint)',
              cursor: form.name.trim() ? 'pointer' : 'default' }}>
            {cta}
          </button>
          <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 10, fontWeight: 600, fontSize: 14, background: 'var(--bg-app)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '8px 11px', borderRadius: 9, fontSize: 13,
  background: 'var(--bg-card-strong)', border: '1px solid var(--border-soft)',
  color: 'var(--text-hi)', outline: 'none',
};

function Field({ label, children, wide = false }) {
  return (
    <div style={{ gridColumn: wide ? 'span 1' : 'auto' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  );
}

function Section({ icon, title, hint, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-hi)' }}>
        <span style={{ color: 'var(--rasf-primary)' }}>{icon}</span> {title}
      </div>
      {hint && <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginBottom: 10 }}>{hint}</div>}
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

// ── Comparison table ────────────────────────────────────────────────────────────
function ComparisonTable({ scenarios }) {
  // Winner per metric row
  const winners = {};
  for (const m of METRICS) {
    if (!m.best) continue;
    let bestId = null, bestVal = null;
    for (const s of scenarios) {
      const v = metricValue(s, m.key);
      if (v == null || typeof v !== 'number' || Number.isNaN(v)) continue;
      if (bestVal == null || (m.best === 'max' ? v > bestVal : v < bestVal)) { bestVal = v; bestId = s.id; }
    }
    if (bestId) winners[m.key] = bestId;
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="section-hd">مقارنة المقترحات</div>
        <div className="section-sub">أفضل قيمة في كل مؤشر مظللة — لتحديد أفضل استخدام</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-card-strong)' }}>
              <th className="text-right px-5 py-3" style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>المؤشر</th>
              {scenarios.map(s => (
                <th key={s.id} className="text-right px-5 py-3" style={{ minWidth: 130 }}>
                  <div className="flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 700, color: s.selected ? 'var(--rasf-primary)' : 'var(--text-hi)' }}>
                    {s.selected && <Star size={12} style={{ fill: 'var(--rasf-primary)', color: 'var(--rasf-primary)' }} />}
                    {s.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((m, i) => (
              <tr key={m.key} style={{ background: i % 2 === 0 ? 'var(--bg-row-a)' : 'var(--bg-row-b)', borderTop: '1px solid var(--border)' }}>
                <td className="px-5 py-3" style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{m.label}</td>
                {scenarios.map(s => {
                  const isWinner = winners[m.key] === s.id;
                  return (
                    <td key={s.id} className="px-5 py-3" style={{ whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontWeight: isWinner ? 800 : 600,
                        color: isWinner ? '#10b981' : 'var(--text-hi)',
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                      }}>
                        {renderMetric(m.kind, metricValue(s, m.key))}
                        {isWinner && <CheckCircle2 size={12} style={{ color: '#10b981' }} />}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────────
export default function ProjectScenarios({ project }) {
  const { portfolioService, refreshPortfolio } = useApp();
  const [modal, setModal]     = useState(null);   // null | { editing?: scenario } | { prefill: data }
  const [confirmDel, setConfirmDel] = useState(null);
  const [importing, setImporting]   = useState(false);
  const [importErr, setImportErr]   = useState(null);
  const fileInputRef = useRef(null);

  const scenarios = project.scenarios ?? [];

  const handleSave = (data) => {
    if (modal?.editing) {
      portfolioService.updateScenario(project.id, modal.editing.id, data);
    } else {
      portfolioService.addScenario(project.id, data);
    }
    refreshPortfolio();
    setModal(null);
  };

  const handleSelect = (s) => { portfolioService.selectScenario(project.id, s.id); refreshPortfolio(); };
  const handleDelete = (s) => { portfolioService.removeScenario(project.id, s.id); refreshPortfolio(); setConfirmDel(null); };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportErr(null);
    setImporting(true);
    try {
      const ex = await parseStudyFile(file);
      const prefill = extractedToScenario(ex, file.name.replace(/\.(xlsx|xls|xlsm|xlsb)$/i, ''));
      setModal({ prefill });
    } catch (err) {
      setImportErr(err?.message || 'تعذّر قراءة الملف. تأكد أنه قالب Excel صحيح.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="section-hd">مقترحات الاستخدام</div>
          <div className="section-sub">قارن أكثر من سيناريو لأفضل استخدام — كل مقترح نموذج تقني ومالي مستقل</div>
        </div>
        <div className="flex items-center gap-2.5">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.xlsm,.xlsb" onChange={handleImport} style={{ display: 'none' }} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            title="استيراد قالب دراسة الجدوى (Excel)"
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-mid)', borderRadius: 9, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: importing ? 'default' : 'pointer', transition: 'all .15s' }}
            onMouseEnter={e => { if (!importing) { e.currentTarget.style.borderColor = 'var(--rasf-primary)'; e.currentTarget.style.color = 'var(--rasf-primary)'; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-mid)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            {importing ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
            {importing ? 'جارٍ القراءة…' : 'استيراد من Excel'}
          </button>
          <button
            onClick={() => setModal({})}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--rasf-primary)', color: 'var(--bg-app)', border: 'none', borderRadius: 9, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            <Plus size={15} /> مقترح جديد
          </button>
        </div>
      </div>

      {/* Import error */}
      {importErr && (
        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <AlertCircle size={15} style={{ color: '#ef4444', flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, color: '#ef4444' }}>{importErr}</span>
          <button onClick={() => setImportErr(null)} style={{ marginInlineStart: 'auto', color: '#ef4444', padding: 2 }}><X size={14} /></button>
        </div>
      )}

      {/* Empty state */}
      {scenarios.length === 0 && (
        <GlassCard>
          <div className="flex flex-col items-center justify-center text-center" style={{ padding: '56px 20px' }}>
            <Layers size={44} style={{ marginBottom: 14, opacity: 0.25, color: 'var(--rasf-primary)' }} />
            <div className="section-hd mb-2">لا توجد مقترحات بعد</div>
            <div className="section-sub mb-5" style={{ maxWidth: 380 }}>
              ابدأ بإضافة مقترح استخدام، أو استورد قالب دراسة الجدوى (Excel) ليتكوّن المقترح تلقائياً. يمكن للفريق الفني إدخال الأرقام الفنية، ثم يكمل المسؤول المالي الدراسة.
            </div>
            <div className="flex items-center gap-2.5">
              <button onClick={() => fileInputRef.current?.click()} disabled={importing}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-mid)', borderRadius: 9, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: importing ? 'default' : 'pointer' }}>
                {importing ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
                استيراد من Excel
              </button>
              <button onClick={() => setModal({})}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--rasf-primary)', color: 'var(--bg-app)', border: 'none', borderRadius: 9, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                <Plus size={15} /> إضافة أول مقترح
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Cards grid */}
      {scenarios.length > 0 && (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {scenarios.map(s => (
            <ScenarioCard
              key={s.id}
              scenario={s}
              onSelect={handleSelect}
              onEdit={(sc) => setModal({ editing: sc })}
              onDelete={(sc) => setConfirmDel(sc)}
            />
          ))}
        </div>
      )}

      {/* Comparison table — only with 2+ scenarios */}
      {scenarios.length >= 2 && <ComparisonTable scenarios={scenarios} />}

      {/* Add/Edit/Import modal */}
      {modal && (
        <ScenarioModal
          initial={
            modal.editing ? { ...EMPTY_FORM, ...modal.editing }
            : modal.prefill ? { ...EMPTY_FORM, ...modal.prefill }
            : null
          }
          mode={modal.editing ? 'edit' : modal.prefill ? 'import' : 'new'}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete confirm */}
      {confirmDel && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setConfirmDel(null)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 26, minWidth: 320, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="font-bold mb-2" style={{ fontSize: 15, color: 'var(--text-hi)' }}>حذف المقترح؟</div>
            <div className="mb-5" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              سيُحذف «{confirmDel.name}» نهائياً مع كل أرقامه الفنية والمالية.
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(confirmDel)} style={{ flex: 1, padding: '9px 0', borderRadius: 9, fontWeight: 700, fontSize: 13, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}>حذف</button>
              <button onClick={() => setConfirmDel(null)} style={{ flex: 1, padding: '9px 0', borderRadius: 9, fontWeight: 600, fontSize: 13, background: 'var(--bg-app)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
