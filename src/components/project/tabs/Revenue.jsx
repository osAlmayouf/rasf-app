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
function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

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
      {tag && <div style={{ marginBottom: 6 }}><Tag variant={tag.variant}>{tag.label}</Tag></div>}
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

  // ── Cap rate ──────────────────────────────────────────────────────────────
  const [capRate, setCapRateState] = useState(() => ls(`capRate_${project.id}`) ?? 7);
  const [editingCap, setEditingCap] = useState(false);
  const [capInput, setCapInput]     = useState('');

  const saveCapRate = () => {
    const v = parseFloat(capInput);
    if (v > 0 && v <= 30) { setCapRateState(v); lsSet(`capRate_${project.id}`, v); }
    setEditingCap(false);
  };

  const calcExitValue  = capRate > 0 && noi > 0 ? parseFloat((noi / (capRate / 100)).toFixed(2)) : 0;
  const studyExitValue = costs.exitValue ?? 0;
  const exitValue      = studyExitValue || calcExitValue;
  const exitMoic       = project.investmentM > 0 && exitValue > 0
    ? (exitValue / project.investmentM).toFixed(2) : null;

  // ── Per-component rows ────────────────────────────────────────────────────
  const saleRows = useMemo(() =>
    breakdown.filter(b => (b.totalSales ?? 0) > 0 || (b.salePricePerSqm ?? 0) > 0 || (b.saleUnits ?? 0) > 0),
  [breakdown]);

  const rentRows = useMemo(() =>
    breakdown.filter(b => (b.rentUnits ?? 0) > 0 || (b.annualRentalRevenue ?? 0) > 0),
  [breakdown]);

  const dailyRows = useMemo(() =>
    breakdown.filter(b => (b.dailyAnnualRevenue ?? 0) > 0 || (b.dailyRatePerUnit ?? 0) > 0),
  [breakdown]);

  const offplanPct = totalSales > 0 ? (offplan / totalSales) * 100 : 0;

  return (
    <div className="space-y-4">

      {/* ── Summary cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        <SummaryCard label="إجمالي الإيراد المتوقع" color="var(--rasf-primary)"
          value={grandTotal > 0 ? fmt(grandTotal) : '—'} sub={grandTotal > 0 ? sarSub() : ''} />
        <SummaryCard label="إيراد المبيعات" color="#10b981"
          tag={{ label: 'مبيعات', variant: 'green' }}
          value={totalSales > 0 ? fmt(totalSales) : '—'} sub={totalSales > 0 ? sarSub() : ''} />
        <SummaryCard label="الإيراد الإيجاري السنوي" color="#4f8ef7"
          tag={{ label: noi > 0 ? 'تأجير' : '—', variant: 'blue' }}
          value={noi > 0 ? fmt(noi) : '—'} sub={noi > 0 ? sarSub(' / سنة') : 'لا توجد بيانات'} />
        <SummaryCard label="قيمة المخارجة" color="#a78bfa"
          tag={{ label: 'مخارجة', variant: 'purple' }}
          value={exitValue > 0 ? fmt(exitValue) : '—'} sub={exitValue > 0 ? sarSub() : `Cap Rate ${capRate}%`} />
      </div>

      {/* ══ المبيعات ═══════════════════════════════════════════════════════ */}
      <GlassCard>
        <SectionHeader title="المبيعات" tag={{ label: 'مبيعات', variant: 'green' }} />
        <div className="grid gap-4" style={{ gridTemplateColumns: '2fr 1fr' }}>

          {/* Per-component table */}
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
                  const pct       = totalSales > 0 && compTotal > 0 ? (compTotal / totalSales) * 100 : 0;
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
                    <TD style={{ fontWeight: 800, color: 'var(--rasf-primary)', fontSize: 13 }}>{fmt(totalSales)}</TD>
                    <TD />
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Off-plan vs direct split */}
          <div style={{ borderRight: '1px solid var(--glass-line)', paddingRight: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>الخارطة مقابل المبيعات العادية</div>
            {totalSales > 0 && (
              <div style={{ height: 8, borderRadius: 6, overflow: 'hidden', background: 'var(--glass-line)', display: 'flex', marginBottom: 12 }}>
                <div style={{ width: `${offplanPct}%`, background: '#4f8ef7', transition: 'width .4s' }} />
                <div style={{ flex: 1, background: '#10b981' }} />
              </div>
            )}
            {[
              { label: 'بيع على الخارطة', value: offplan,     color: '#4f8ef7', pct: offplanPct },
              { label: 'بيع مباشر',       value: directSales, color: '#10b981', pct: totalSales > 0 ? (directSales / totalSales) * 100 : 0 },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.label}</span>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.value > 0 ? fmt(r.value) : '—'}</div>
                  {r.pct > 0 && <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{r.pct.toFixed(1)}%</div>}
                </div>
              </div>
            ))}
            {directSales > 0 && (
              <div style={{ background: 'var(--rasf-primary-dim)', borderRadius: 8, padding: '8px 10px', marginTop: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 2 }}>أساس سعي المبيعات (2.5%)</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--rasf-primary)' }}>
                  {fmt(directSales * 0.025)} <span style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 400 }}>{sarSub()}</span>
                </div>
              </div>
            )}
          </div>
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
                // Compute occupancy from stored values if available
                const occ = revenue > 0 && dailyRate > 0 && units > 0
                  ? Math.round((revenue * 1_000_000) / (units * 365 * dailyRate) * 100) : null;
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
        <SectionHeader title="المخارجة" tag={{ label: 'مخارجة', variant: 'purple' }} />
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>

          {/* NOI breakdown */}
          <div className="glass rounded-xl p-4">
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>ملخص الدخل الصافي (NOI)</div>
            {[
              ...(annualRental > 0 ? [{ label: 'إيراد إيجاري سنوي', value: annualRental, color: '#4f8ef7' }] : []),
              ...(dailyRental  > 0 ? [{ label: 'إيراد يومي (سنوي)',  value: dailyRental,  color: '#f59e0b' }] : []),
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center mb-2">
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{fmt(r.value)}</span>
              </div>
            ))}
            {noi > 0 ? (
              <div className="flex justify-between items-center pt-2 mt-1" style={{ borderTop: '1px solid var(--glass-line)' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>إجمالي NOI</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#a78bfa' }}>{fmt(noi)}</span>
              </div>
            ) : (
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 6 }}>
                يتطلب إيرادات إيجارية لحساب قيمة الخروج
              </div>
            )}
            <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 6 }}>{sarSub(' / سنة')}</div>
          </div>

          {/* Cap rate + calc exit value */}
          <div className="glass rounded-xl p-4">
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>نسبة الرسملة (Cap Rate)</div>
            {editingCap ? (
              <div className="flex gap-2 items-center mb-3">
                <input
                  type="number" value={capInput} onChange={e => setCapInput(e.target.value)}
                  placeholder={String(capRate)} min={1} max={30} step={0.25}
                  style={{ width: 70, padding: '4px 8px', borderRadius: 6, fontSize: 14, fontWeight: 700, background: 'var(--bg-card-strong)', border: '1px solid var(--rasf-primary)', color: 'var(--rasf-primary)', outline: 'none', fontFamily: 'inherit', textAlign: 'center' }}
                />
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>%</span>
                <button onClick={saveCapRate}
                  style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: 'var(--rasf-primary-dim)', border: '1px solid var(--rasf-primary)', color: 'var(--rasf-primary)' }}>
                  حفظ
                </button>
                <button onClick={() => setEditingCap(false)}
                  style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  إلغاء
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-3">
                <span style={{ fontSize: 28, fontWeight: 800, color: '#a78bfa' }}>{capRate}%</span>
                <button onClick={() => { setCapInput(String(capRate)); setEditingCap(true); }}
                  style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, cursor: 'pointer', background: 'transparent', border: '1px solid var(--border-mid)', color: 'var(--text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                  تعديل
                </button>
              </div>
            )}
            <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 8 }}>
              NOI ÷ Cap Rate = {noi > 0 ? fmt(noi) : '—'} ÷ {capRate}%
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#a78bfa' }}>
              {calcExitValue > 0 ? fmt(calcExitValue) : '—'}
            </div>
            {calcExitValue > 0 && <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{sarSub(' (محتسب)')}</div>}
          </div>

          {/* Study reference + MOIC */}
          <div className="glass rounded-xl p-4">
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>مرجع الدراسة والعائد</div>
            {studyExitValue > 0 && (
              <div className="mb-3">
                <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 2 }}>قيمة المخارجة (دراسة الجدوى)</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--rasf-primary)' }}>{fmt(studyExitValue)}</div>
                <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{sarSub()}</div>
              </div>
            )}
            {exitMoic && (
              <div style={{ paddingTop: studyExitValue > 0 ? 10 : 0, borderTop: studyExitValue > 0 ? '1px solid var(--glass-line)' : 'none' }}>
                <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 2 }}>MOIC من المخارجة</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>{exitMoic}x</div>
                <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                  {fmt(exitValue)} ÷ {fmt(project.investmentM)} استثمار
                </div>
              </div>
            )}
            {!studyExitValue && !exitMoic && (
              <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                أدخل Cap Rate وبيانات التأجير لحساب MOIC
              </div>
            )}
          </div>
        </div>
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
