import { useState, useMemo } from 'react';
import { useApp } from '../../../contexts/useApp';
import { fmtSARMode } from '../../../utils/fmtMode';
import GlassCard from '../../common/GlassCard';
import SARSymbol from '../../common/SARSymbol';
import Tag from '../../common/Tag';

const COMP_LABELS = {
  residential: 'سكني',  villas: 'فلل',       townhouse: 'تاون هاوس',
  studios: 'أستوديوهات', commercial: 'تجاري', office: 'مكتبي',
  hotel: 'فندقي',       medical: 'صحي',        floors: 'أدوار',
};
const COMP_COLORS = {
  residential: '#4f8ef7', villas: '#06b6d4', townhouse: '#22d3ee',
  studios: '#a78bfa',    commercial: '#8b5cf6', office: '#10b981',
  hotel: '#A4907E',      medical: '#fb923c',    floors: '#facc15',
};

function ls(key)         { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ } }

function PctBar({ value, color = 'var(--rasf-primary)', height = 4 }) {
  return (
    <div style={{ height, background: 'var(--glass-line)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, value || 0))}%`, background: color, borderRadius: 3, transition: 'width .4s ease' }} />
    </div>
  );
}

const TH = ({ children, style }) => (
  <th className="text-right pb-2 px-2" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', ...style }}>{children}</th>
);
const TD = ({ children, style }) => (
  <td className="py-2 px-2" style={{ fontSize: 12, ...style }}>{children}</td>
);

function SummaryCard({ label, value, sub, color, tag }) {
  return (
    <div className="glass rounded-xl p-4">
      {tag && <div style={{ marginBottom: 6 }}>
        {/* Chip tinted to the card's own colour so all four cards read as one set. */}
        <span style={{
          display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontSize: 11,
          fontWeight: 600, letterSpacing: '0.2px', color,
          background: `color-mix(in srgb, ${color} 12%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
        }}>{tag.label}</span>
      </div>}
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 1 }}>{sub}</div>}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{label}</div>
    </div>
  );
}

function SectionHeader({ title, tag, extra }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="section-hd">{title}</div>
      {tag && <Tag variant={tag.variant}>{tag.label}</Tag>}
      {extra}
    </div>
  );
}

function EmptyRow({ cols, msg }) {
  return (
    <tr>
      <td colSpan={cols} className="py-4 text-center" style={{ fontSize: 12, color: 'var(--text-faint)' }}>{msg}</td>
    </tr>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Revenue({ project }) {
  const { displayMode } = useApp();
  const isFull = displayMode === 'full';
  const sarSub  = (suffix = '') => isFull ? `ريال${suffix}` : `ألف ريال${suffix}`;
  const fmt     = (v) => fmtSARMode(v, displayMode);

  const costs     = project.costs     ?? {};
  const financing = project.financing ?? {};
  const breakdown = useMemo(() => {
    const raw = project.componentBreakdown ?? {};
    return Object.entries(raw).map(([key, b]) => ({
      key, ...b,
      label: b.nameAr || COMP_LABELS[key] || key,
      color: COMP_COLORS[key] || '#7A6E67',
    }));
  }, [project.componentBreakdown]);

  // ── Revenue sources ───────────────────────────────────────────────────────
  const directSales  = costs.directSalesRevenue ?? 0;
  const offplan      = costs.offplanRevenue ?? financing.offplanSales ?? 0;
  const totalSales   = directSales + offplan
    || breakdown.reduce((s, b) => s + (b.totalSales ?? 0), 0);
  const annualRental = costs.annualRentalRevenue
    ?? breakdown.reduce((s, b) => s + (b.annualRentalRevenue ?? 0), 0);
  const dailyRental  = costs.dailyRentalRevenue
    ?? breakdown.reduce((s, b) => s + (b.dailyAnnualRevenue ?? 0), 0);
  const noi          = annualRental + dailyRental;
  const grandTotal   = costs.totalRevenue ?? (totalSales + noi);

  // ── Exit / cap rate ─────────────────────────────────────────────────────────
  // Global fallback cap rate — used only when the study carries no per-component exit.
  const [capRate] = useState(() => ls(`capRate_${project.id}`) ?? 7);
  const calcExitValue  = capRate > 0 && noi > 0 ? parseFloat((noi / (capRate / 100)).toFixed(2)) : 0;
  const studyExitValue = costs.exitValue ?? 0;

  // Per-component cap-rate overrides — the user can retune each exit yield; persisted.
  const [capOverrides, setCapOverrides] = useState(() => ls(`capRateOverrides_${project.id}`) ?? {});
  const [editingComp, setEditingComp]   = useState(null);
  const [compInput, setCompInput]       = useState('');
  const saveCompRate = (key) => {
    const v = parseFloat(compInput);
    if (v > 0 && v <= 30) {
      const next = { ...capOverrides, [key]: v };
      setCapOverrides(next); lsSet(`capRateOverrides_${project.id}`, next);
    }
    setEditingComp(null);
  };
  const resetCapRates = () => { setCapOverrides({}); lsSet(`capRateOverrides_${project.id}`, {}); };

  // ── Per-component rows ────────────────────────────────────────────────────
  // Show a component only if it actually earns revenue in THIS stream — hide
  // units-only rows (e.g. a hotel listed under annual rental with no annual income).
  const saleRows = useMemo(() =>
    breakdown.filter(b => (b.totalSales ?? 0) > 0 ||
      ((b.salePricePerSqm ?? 0) > 0 && (b.saleUnits ?? 0) > 0 && (b.unitSize ?? 0) > 0)),
  [breakdown]);

  // Denominator for the direct-sales table's % column — the sales table's own rows,
  // so shares sum to 100% (totalSales mixes in off-plan and can exceed a row).
  const rowTotal = (b) => {
    const unitVal = (b.salePricePerSqm ?? 0) > 0 && (b.unitSize ?? 0) > 0 ? (b.salePricePerSqm * b.unitSize) / 1000 : null;
    return b.totalSales ?? (unitVal && b.saleUnits ? unitVal * b.saleUnits / 1000 : 0);
  };
  const saleRowsTotal = useMemo(() => saleRows.reduce((s, b) => s + rowTotal(b), 0), [saleRows]);

  const rentRows = useMemo(() =>
    breakdown.filter(b => (b.annualRentalRevenue ?? 0) > 0 ||
      ((b.rentalRatePerSqm ?? 0) > 0 && (b.nsa ?? 0) > 0)),
  [breakdown]);

  const dailyRows = useMemo(() =>
    breakdown.filter(b => (b.dailyAnnualRevenue ?? 0) > 0),
  [breakdown]);

  // Off-plan detail comes from the dedicated revenue table (its per-m² price and
  // unit value differ from direct sale), keyed by component.
  const offRows = useMemo(() => {
    const pc = project.revenueBreakdown?.offPlan?.perComponent ?? {};
    const sizeByKey = Object.fromEntries(breakdown.map(b => [b.key, b.unitSize]));
    return Object.entries(pc)
      .map(([key, b]) => {
        // the off-plan table carries no unit-size column; reuse the component's
        // size (same physical unit) or derive it from value ÷ price-per-m².
        const unitSize = b.unitSize ?? sizeByKey[key]
          ?? (((b.unitValue ?? 0) > 0 && (b.salePricePerSqm ?? 0) > 0) ? Math.round(b.unitValue * 1e6 / b.salePricePerSqm) : 0);
        return { key, ...b, unitSize, label: b.nameAr || COMP_LABELS[key] || key, color: COMP_COLORS[key] || '#7A6E67' };
      })
      .filter(b => (b.totalSales ?? 0) > 0 || (b.units ?? 0) > 0);
  }, [project.revenueBreakdown, breakdown]);
  const offRowsTotal = useMemo(() => offRows.reduce((s, b) => s + (b.totalSales ?? 0), 0) || offplan, [offRows, offplan]);

  // Per-component exit (capitalization) detail from the study's CAP-RATE table,
  // keyed by component: cap rate % and the capitalized total.
  const capRows = useMemo(() => {
    const pc = project.revenueBreakdown?.capRate?.perComponent ?? {};
    return Object.entries(pc)
      .map(([key, b]) => ({ key, ...b, label: b.nameAr || COMP_LABELS[key] || key, color: COMP_COLORS[key] || '#7A6E67' }))
      .filter(b => (b.totalCapitalized ?? 0) > 0);
  }, [project.revenueBreakdown]);

  // Apply overrides: a capitalized value is NOI ÷ cap-rate, so retuning the rate
  // rescales the total while holding the implied component NOI constant.
  const capRowsEff = useMemo(() => capRows.map(b => {
    const override = capOverrides[b.key];
    const effRate  = override ?? b.capRate ?? 0;
    const base     = b.totalCapitalized ?? 0;
    const effTotal = (override != null && (b.capRate ?? 0) > 0) ? base * b.capRate / override : base;
    return { ...b, effRate, effTotal, edited: override != null };
  }), [capRows, capOverrides]);
  const capRowsTotal = useMemo(() => capRowsEff.reduce((s, b) => s + (b.effTotal ?? 0), 0) || studyExitValue, [capRowsEff, studyExitValue]);

  // Exit value drives the top summary card; prefer the (possibly retuned) table total.
  const exitValue = capRowsTotal > 0 ? capRowsTotal : (studyExitValue || calcExitValue);

  return (
    <div className="space-y-4">

      {/* ── Summary cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        <SummaryCard label="إجمالي الإيراد المتوقع" color="var(--rasf-primary)"
          tag={{ label: 'إجمالي', variant: 'warm' }}
          value={grandTotal > 0 ? fmt(grandTotal) : '—'} sub={grandTotal > 0 ? sarSub() : ''} />
        <SummaryCard label="إيراد المبيعات" color="#10b981"
          tag={{ label: 'مبيعات', variant: 'green' }}
          value={totalSales > 0 ? fmt(totalSales) : '—'} sub={totalSales > 0 ? sarSub() : ''} />
        <SummaryCard label="الإيراد الإيجاري (سنوي + يومي)" color="#4f8ef7"
          tag={{ label: noi > 0 ? 'تأجير' : '—', variant: 'blue' }}
          value={noi > 0 ? fmt(noi) : '—'} sub={noi > 0 ? sarSub(' / سنة') : 'لا توجد بيانات'} />
        <SummaryCard label="قيمة المخارجة" color="#a78bfa"
          tag={{ label: 'مخارجة', variant: 'purple' }}
          value={exitValue > 0 ? fmt(exitValue) : '—'} sub={exitValue > 0 ? sarSub() : `Cap Rate ${capRate}%`} />
      </div>

      {/* ══ المبيعات ═══════════════════════════════════════════════════════ */}
      <GlassCard>
        <SectionHeader title="المبيعات" tag={{ label: 'مبيعات', variant: 'green' }} />
        <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-line)' }}>
                  <TH>المكوّن</TH>
                  <TH>وحدات البيع</TH>
                  <TH>مساحة الوحدة</TH>
                  <TH>سعر المتر</TH>
                  <TH>قيمة الوحدة</TH>
                  <TH>الإجمالي</TH>
                  <TH>%</TH>
                </tr>
              </thead>
              <tbody>
                {saleRows.length > 0 ? saleRows.map(b => {
                  const unitVal   = (b.salePricePerSqm ?? 0) > 0 && (b.unitSize ?? 0) > 0
                    ? (b.salePricePerSqm * b.unitSize) / 1000 : null; // in thousands
                  const compTotal = b.totalSales ?? (unitVal && b.saleUnits ? unitVal * b.saleUnits / 1000 : 0);
                  const pct       = saleRowsTotal > 0 && compTotal > 0 ? (compTotal / saleRowsTotal) * 100 : 0;
                  return (
                    <tr key={b.key} style={{ borderBottom: '1px solid var(--glass-line)' }}>
                      <TD>
                        <div className="flex items-center gap-2">
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: b.color, display: 'inline-block', flexShrink: 0 }} />
                          <span style={{ fontWeight: 600, color: 'var(--text-hi)' }}>{b.label}</span>
                        </div>
                      </TD>
                      <TD style={{ color: 'var(--text-lo)' }}>
                        {(b.saleUnits ?? 0) > 0 ? `${b.saleUnits.toLocaleString()} وحدة` : '—'}
                      </TD>
                      <TD style={{ color: 'var(--text-muted)' }}>
                        {(b.unitSize ?? 0) > 0 ? `${b.unitSize} م²` : '—'}
                      </TD>
                      <TD style={{ color: 'var(--text-muted)' }}>
                        {(b.salePricePerSqm ?? 0) > 0
                          ? <span>{b.salePricePerSqm.toLocaleString()} <SARSymbol size="0.7em" /></span>
                          : '—'}
                      </TD>
                      <TD style={{ color: 'var(--text-lo)' }}>
                        {unitVal != null
                          ? <span>
                              {isFull
                                ? Math.round(unitVal * 1000).toLocaleString()
                                : Math.round(unitVal).toLocaleString()}
                              {' '}<span style={{ fontSize: 10, color: 'var(--text-faint)' }}>{isFull ? 'ريال' : 'ألف'}</span>
                            </span>
                          : '—'}
                      </TD>
                      <TD style={{ fontWeight: 700, color: '#10b981' }}>
                        {compTotal > 0 ? fmt(compTotal) : '—'}
                      </TD>
                      <TD style={{ minWidth: 60 }}>
                        {pct > 0 && <>
                          <PctBar value={pct} color={b.color} />
                          <div style={{ fontSize: 10, color: b.color, marginTop: 2 }}>{pct.toFixed(1)}%</div>
                        </>}
                      </TD>
                    </tr>
                  );
                }) : (
                  <EmptyRow cols={7} msg={totalSales > 0 ? 'ملخص إجمالي فقط — بيانات المكونات غير متوفرة' : 'لا توجد بيانات مبيعات'} />
                )}
                {saleRows.length > 1 && (
                  <tr style={{ borderTop: '2px solid var(--glass-line)', background: 'var(--rasf-primary-dim)' }}>
                    <TD style={{ fontWeight: 700, color: 'var(--text-muted)' }}>الإجمالي</TD>
                    <TD /><TD /><TD /><TD />
                    <TD style={{ fontWeight: 800, color: 'var(--rasf-primary)', fontSize: 13 }}>{fmt(saleRowsTotal)}</TD>
                    <TD />
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        {directSales > 0 && (
          <div style={{ background: 'var(--rasf-primary-dim)', borderRadius: 8, padding: '8px 10px', marginTop: 12, maxWidth: 260 }}>
            <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 2 }}>أساس سعي المبيعات (2.5%)</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--rasf-primary)' }}>
              {fmt(directSales * 0.025)} <span style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 400 }}>{sarSub()}</span>
            </div>
          </div>
        )}
      </GlassCard>

      {/* ══ البيع على الخارطة ════════════════════════════════════════════════ */}
      <GlassCard>
        <SectionHeader title="البيع على الخارطة" tag={{ label: 'خارطة', variant: 'blue' }} />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-line)' }}>
                <TH>المكوّن</TH>
                <TH>وحدات الخارطة</TH>
                <TH>مساحة الوحدة</TH>
                <TH>سعر المتر</TH>
                <TH>قيمة الوحدة</TH>
                <TH>الإجمالي</TH>
                <TH>%</TH>
              </tr>
            </thead>
            <tbody>
              {offRows.length > 0 ? offRows.map(b => {
                const unitValTh = (b.unitValue ?? 0) > 0 ? b.unitValue * 1000 : null; // millions → thousands
                const compTotal = b.totalSales ?? 0;
                const pct = offRowsTotal > 0 && compTotal > 0 ? (compTotal / offRowsTotal) * 100 : 0;
                return (
                  <tr key={b.key} style={{ borderBottom: '1px solid var(--glass-line)' }}>
                    <TD>
                      <div className="flex items-center gap-2">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: b.color, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: 'var(--text-hi)' }}>{b.label}</span>
                      </div>
                    </TD>
                    <TD style={{ color: 'var(--text-lo)' }}>
                      {(b.units ?? 0) > 0 ? `${b.units.toLocaleString()} وحدة` : '—'}
                    </TD>
                    <TD style={{ color: 'var(--text-muted)' }}>
                      {(b.unitSize ?? 0) > 0 ? `${b.unitSize} م²` : '—'}
                    </TD>
                    <TD style={{ color: 'var(--text-muted)' }}>
                      {(b.salePricePerSqm ?? 0) > 0
                        ? <span>{b.salePricePerSqm.toLocaleString()} <SARSymbol size="0.7em" /></span>
                        : '—'}
                    </TD>
                    <TD style={{ color: 'var(--text-lo)' }}>
                      {unitValTh != null
                        ? <span>
                            {isFull ? Math.round(unitValTh * 1000).toLocaleString() : Math.round(unitValTh).toLocaleString()}
                            {' '}<span style={{ fontSize: 10, color: 'var(--text-faint)' }}>{isFull ? 'ريال' : 'ألف'}</span>
                          </span>
                        : '—'}
                    </TD>
                    <TD style={{ fontWeight: 700, color: '#4f8ef7' }}>
                      {compTotal > 0 ? fmt(compTotal) : '—'}
                    </TD>
                    <TD style={{ minWidth: 60 }}>
                      {pct > 0 && <>
                        <PctBar value={pct} color={b.color} />
                        <div style={{ fontSize: 10, color: b.color, marginTop: 2 }}>{pct.toFixed(1)}%</div>
                      </>}
                    </TD>
                  </tr>
                );
              }) : (
                <EmptyRow cols={7} msg={offplan > 0 ? 'ملخص إجمالي فقط — بيانات المكونات غير متوفرة' : 'لا يوجد بيع على الخارطة لهذا المشروع'} />
              )}
              {offRows.length > 1 && (
                <tr style={{ borderTop: '2px solid var(--glass-line)', background: 'rgba(79,142,247,0.04)' }}>
                  <TD style={{ fontWeight: 700, color: 'var(--text-muted)' }}>الإجمالي</TD>
                  <TD /><TD /><TD /><TD />
                  <TD style={{ fontWeight: 800, color: '#4f8ef7', fontSize: 13 }}>{offRowsTotal > 0 ? fmt(offRowsTotal) : '—'}</TD>
                  <TD />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* ══ التأجير السنوي ════════════════════════════════════════════════ */}
      <GlassCard>
        <SectionHeader title="التأجير السنوي" tag={{ label: 'تأجير', variant: 'blue' }} />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-line)' }}>
                <TH>المكوّن</TH>
                <TH>وحدات التأجير</TH>
                <TH>NSA (م²)</TH>
                <TH>إيجار المتر / سنة</TH>
                <TH>الإيراد السنوي</TH>
                <TH>%</TH>
              </tr>
            </thead>
            <tbody>
              {rentRows.length > 0 ? rentRows.map(b => {
                const calcRevenue = (b.rentalRatePerSqm ?? 0) > 0 && (b.nsa ?? 0) > 0
                  ? toMillionsLocal(b.rentalRatePerSqm * b.nsa) : null;
                const revenue = b.annualRentalRevenue ?? calcRevenue ?? 0;
                const pct = annualRental > 0 && revenue > 0 ? (revenue / annualRental) * 100 : 0;
                return (
                  <tr key={b.key} style={{ borderBottom: '1px solid var(--glass-line)' }}>
                    <TD>
                      <div className="flex items-center gap-2">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: b.color, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: 'var(--text-hi)' }}>{b.label}</span>
                      </div>
                    </TD>
                    <TD style={{ color: 'var(--text-lo)' }}>
                      {(b.rentUnits ?? 0) > 0 ? `${b.rentUnits.toLocaleString()} وحدة` : '—'}
                    </TD>
                    <TD style={{ color: 'var(--text-muted)' }}>
                      {(b.nsa ?? 0) > 0 ? b.nsa.toLocaleString() : '—'}
                    </TD>
                    <TD style={{ color: 'var(--text-muted)' }}>
                      {(b.rentalRatePerSqm ?? 0) > 0
                        ? <span>{b.rentalRatePerSqm.toLocaleString()} <SARSymbol size="0.7em" /></span>
                        : '—'}
                    </TD>
                    <TD style={{ fontWeight: 700, color: '#4f8ef7' }}>
                      {revenue > 0 ? fmt(revenue) : '—'}
                      {calcRevenue != null && !b.annualRentalRevenue && revenue > 0 &&
                        <span style={{ fontSize: 9, color: 'var(--text-faint)', marginRight: 4 }}>محتسب</span>}
                    </TD>
                    <TD style={{ minWidth: 60 }}>
                      {pct > 0 && <>
                        <PctBar value={pct} color={b.color} />
                        <div style={{ fontSize: 10, color: b.color, marginTop: 2 }}>{pct.toFixed(1)}%</div>
                      </>}
                    </TD>
                  </tr>
                );
              }) : (
                <EmptyRow cols={6} msg={annualRental > 0 ? 'إجمالي إيراد إيجاري — بيانات المكونات غير متوفرة' : 'لا توجد بيانات تأجير سنوي'} />
              )}
              {rentRows.length > 1 && (
                <tr style={{ borderTop: '2px solid var(--glass-line)', background: 'rgba(79,142,247,0.04)' }}>
                  <TD style={{ fontWeight: 700, color: 'var(--text-muted)' }}>الإجمالي السنوي</TD>
                  <TD /><TD /><TD />
                  <TD style={{ fontWeight: 800, color: '#4f8ef7', fontSize: 13 }}>{annualRental > 0 ? fmt(annualRental) : '—'}</TD>
                  <TD />
                </tr>
              )}
            </tbody>
          </table>
          {annualRental === 0 && rentRows.length === 0 && (
            <div className="pt-2 pb-1 text-center" style={{ fontSize: 12, color: 'var(--text-faint)' }}>
              لا توجد بيانات تأجير سنوي لهذا المشروع
            </div>
          )}
        </div>
      </GlassCard>

      {/* ══ التأجير اليومي ════════════════════════════════════════════════ */}
      <GlassCard>
        <SectionHeader title="التأجير اليومي" tag={{ label: 'يومي', variant: 'amber' }} />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-line)' }}>
                <TH>المكوّن</TH>
                <TH>الوحدات</TH>
                <TH>قيمة الليلة</TH>
                <TH>نسبة الإشغال</TH>
                <TH>الإيراد السنوي</TH>
                <TH>تكاليف التشغيل</TH>
                <TH>صافي الإيراد</TH>
                <TH>%</TH>
              </tr>
            </thead>
            <tbody>
              {dailyRows.length > 0 ? dailyRows.map(b => {
                const units      = b.rentUnits ?? b.unitCount ?? 0;
                const dailyRate  = b.dailyRatePerUnit ?? 0;
                const revenue    = b.dailyAnnualRevenue ?? 0;
                const opCost     = b.operatingCostDaily ?? 0;
                const netRevenue = revenue > 0 ? revenue - opCost : 0;
                // Prefer the study's stored occupancy; else derive it from revenue
                const occ = b.occupancy != null ? Math.round(b.occupancy)
                  : (revenue > 0 && dailyRate > 0 && units > 0
                      ? Math.round((revenue * 1_000_000) / (units * 365 * dailyRate) * 100) : null);
                const pct = dailyRental > 0 && revenue > 0 ? (revenue / dailyRental) * 100 : 0;
                return (
                  <tr key={b.key} style={{ borderBottom: '1px solid var(--glass-line)' }}>
                    <TD>
                      <div className="flex items-center gap-2">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: b.color, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: 'var(--text-hi)' }}>{b.label}</span>
                      </div>
                    </TD>
                    <TD style={{ color: 'var(--text-lo)' }}>
                      {units > 0 ? `${units.toLocaleString()} وحدة` : '—'}
                    </TD>
                    <TD style={{ color: 'var(--text-muted)' }}>
                      {dailyRate > 0
                        ? <span>{dailyRate.toLocaleString()} <SARSymbol size="0.7em" /></span>
                        : '—'}
                    </TD>
                    <TD style={{ color: 'var(--text-muted)' }}>
                      {occ != null ? `${occ}%` : '—'}
                    </TD>
                    <TD style={{ fontWeight: 700, color: '#f59e0b' }}>
                      {revenue > 0 ? fmt(revenue) : '—'}
                    </TD>
                    <TD style={{ color: '#ef4444' }}>
                      {opCost > 0 ? fmt(opCost) : '—'}
                    </TD>
                    <TD style={{ fontWeight: 700, color: '#10b981' }}>
                      {netRevenue > 0 ? fmt(netRevenue) : revenue > 0 ? fmt(revenue) : '—'}
                    </TD>
                    <TD style={{ minWidth: 60 }}>
                      {pct > 0 && <>
                        <PctBar value={pct} color={b.color} />
                        <div style={{ fontSize: 10, color: b.color, marginTop: 2 }}>{pct.toFixed(1)}%</div>
                      </>}
                    </TD>
                  </tr>
                );
              }) : (
                <EmptyRow cols={8} msg={dailyRental > 0 ? 'إجمالي إيراد يومي — بيانات المكونات غير متوفرة' : 'لا توجد بيانات تأجير يومي'} />
              )}
              {dailyRows.length > 1 && (
                <tr style={{ borderTop: '2px solid var(--glass-line)', background: 'rgba(245,158,11,0.04)' }}>
                  <TD style={{ fontWeight: 700, color: 'var(--text-muted)' }}>الإجمالي</TD>
                  <TD /><TD /><TD />
                  <TD style={{ fontWeight: 800, color: '#f59e0b', fontSize: 13 }}>{dailyRental > 0 ? fmt(dailyRental) : '—'}</TD>
                  <TD />
                  <TD style={{ fontWeight: 800, color: '#10b981', fontSize: 13 }}>
                    {dailyRental > 0 ? fmt(dailyRental - dailyRows.reduce((s, b) => s + (b.operatingCostDaily ?? 0), 0)) : '—'}
                  </TD>
                  <TD />
                </tr>
              )}
            </tbody>
          </table>
          {dailyRental === 0 && dailyRows.length === 0 && (
            <div className="pt-2 pb-1 text-center" style={{ fontSize: 12, color: 'var(--text-faint)' }}>
              لا توجد بيانات تأجير يومي لهذا المشروع
            </div>
          )}
        </div>
      </GlassCard>

      {/* ══ المخارجة ══════════════════════════════════════════════════════ */}
      <GlassCard>
        <SectionHeader title="المخارجة" tag={{ label: 'مخارجة', variant: 'purple' }}
          extra={Object.keys(capOverrides).length > 0 && (
            <button onClick={resetCapRates}
              style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, cursor: 'pointer', background: 'transparent', border: '1px solid var(--border-mid)', color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              استرجاع الأساس
            </button>
          )} />

        {capRowsEff.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-line)' }}>
                  <TH>المكوّن</TH>
                  <TH>نسبة الرسملة</TH>
                  <TH>الإجمالي</TH>
                  <TH>%</TH>
                </tr>
              </thead>
              <tbody>
                {capRowsEff.map(b => {
                  const pct = capRowsTotal > 0 && b.effTotal > 0 ? (b.effTotal / capRowsTotal) * 100 : 0;
                  return (
                    <tr key={b.key} style={{ borderBottom: '1px solid var(--glass-line)' }}>
                      <TD>
                        <div className="flex items-center gap-2">
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: b.color, display: 'inline-block', flexShrink: 0 }} />
                          <span style={{ fontWeight: 600, color: 'var(--text-hi)' }}>{b.label}</span>
                        </div>
                      </TD>
                      <TD>
                        {editingComp === b.key ? (
                          <div className="flex gap-1 items-center">
                            <input
                              type="number" value={compInput} onChange={e => setCompInput(e.target.value)}
                              min={1} max={30} step={0.25} autoFocus
                              onKeyDown={e => { if (e.key === 'Enter') saveCompRate(b.key); if (e.key === 'Escape') setEditingComp(null); }}
                              style={{ width: 54, padding: '2px 6px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: 'var(--bg-card-strong)', border: '1px solid #a78bfa', color: '#a78bfa', outline: 'none', fontFamily: 'inherit', textAlign: 'center' }}
                            />
                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>%</span>
                            <button onClick={() => saveCompRate(b.key)} title="حفظ"
                              style={{ padding: '2px 7px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'rgba(167,139,250,0.12)', border: '1px solid #a78bfa', color: '#a78bfa' }}>✓</button>
                            <button onClick={() => setEditingComp(null)} title="إلغاء"
                              style={{ padding: '2px 7px', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>×</button>
                          </div>
                        ) : (
                          <button onClick={() => { setCompInput(String(b.effRate)); setEditingComp(b.key); }} title="اضغط للتعديل"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: b.edited ? 700 : 400, color: b.edited ? '#a78bfa' : 'var(--text-muted)' }}>
                            {(b.effRate ?? 0) > 0 ? `${b.effRate}%` : '—'}
                            {b.edited && <span style={{ fontSize: 9, color: 'var(--text-faint)' }}>محرّر</span>}
                          </button>
                        )}
                      </TD>
                      <TD style={{ fontWeight: 700, color: '#a78bfa' }}>
                        {b.effTotal > 0 ? fmt(b.effTotal) : '—'}
                      </TD>
                      <TD style={{ minWidth: 60 }}>
                        {pct > 0 && <>
                          <PctBar value={pct} color={b.color} />
                          <div style={{ fontSize: 10, color: b.color, marginTop: 2 }}>{pct.toFixed(1)}%</div>
                        </>}
                      </TD>
                    </tr>
                  );
                })}
                {capRowsEff.length > 1 && (
                  <tr style={{ borderTop: '2px solid var(--glass-line)', background: 'rgba(167,139,250,0.04)' }}>
                    <TD style={{ fontWeight: 700, color: 'var(--text-muted)' }}>الإجمالي</TD>
                    <TD />
                    <TD style={{ fontWeight: 800, color: '#a78bfa', fontSize: 13 }}>{capRowsTotal > 0 ? fmt(capRowsTotal) : '—'}</TD>
                    <TD />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-4 text-center" style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            {studyExitValue > 0
              ? `قيمة المخارجة (دراسة الجدوى): ${fmt(studyExitValue)} ${sarSub()} — بيانات المكونات غير متوفرة`
              : 'لا توجد بيانات مخارجة لهذا المشروع'}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function toMillionsLocal(raw) {
  if (!raw || raw <= 0) return null;
  if (raw >= 1_000_000) return parseFloat((raw / 1_000_000).toFixed(2));
  if (raw >= 1 && raw < 500) return raw;
  return null;
}
