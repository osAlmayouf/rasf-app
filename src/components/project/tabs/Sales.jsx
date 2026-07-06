import { useState, useMemo } from 'react';
import { useApp } from '../../../contexts/useApp';
import { fmtSARMode } from '../../../utils/fmtMode';
import GlassCard from '../../common/GlassCard';
import SARSymbol from '../../common/SARSymbol';

const COMP_LABELS = {
  residential: 'سكني',       villas: 'فلل',          townhouse: 'تاون هاوس',
  studios:     'أستوديوهات', commercial: 'تجاري',    office: 'مكتبي',
  hotel:       'فندقي',       medical: 'صحي',
};
const COMP_COLORS = {
  residential: '#4f8ef7', villas: '#06b6d4', townhouse: '#22d3ee',
  studios:     '#a78bfa', commercial: '#8b5cf6', office: '#10b981',
  hotel:       '#A4907E', medical: '#fb923c',
};

function fmtNum(n) { return n > 0 ? Number(n).toLocaleString('ar-SA') : '—'; }
function fmtSar(n) {
  if (!n || n === 0) return '—';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {Number(n).toLocaleString()} <SARSymbol size="0.85em" />
    </span>
  );
}

function ls(key)         { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ } }

// ── Progress bar ──────────────────────────────────────────────────────────────
function PctBar({ value, color = 'var(--rasf-primary)', height = 4 }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  return (
    <div style={{ height, background: 'var(--glass-line)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width .4s ease' }} />
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color = 'var(--rasf-primary)', pct }) {
  return (
    <div className="glass rounded-xl p-4 text-center">
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      {sub  && <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>{sub}</div>}
      {pct != null && (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--glass-line)' }}>
          <PctBar value={pct} color={color} height={3} />
          <div style={{ fontSize: 10, color, marginTop: 3, fontWeight: 600 }}>{pct.toFixed(1)}%</div>
        </div>
      )}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ── Collections row ───────────────────────────────────────────────────────────
function CollectionRow({ label, value, color }) {
  const { displayMode } = useApp();
  return (
    <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--glass-line)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{fmtSARMode(value, displayMode)}</span>
    </div>
  );
}

export default function Sales({ project }) {
  const { displayMode } = useApp();
  const isFull = displayMode === 'full';
  const fmt = (v) => fmtSARMode(v, displayMode);
  const sarSub = isFull ? 'ريال' : 'ألف ريال';

  const breakdown = project.componentBreakdown ?? [];

  // ── Sales data from componentBreakdown ────────────────────────────────────
  const salesRows = useMemo(() =>
    breakdown
      .filter(b => b.unitCount > 0 || b.totalSales > 0)
      .map(b => {
        const key   = b.key || b.labelKey;
        const label = b.nameAr || COMP_LABELS[key] || key || '—';
        const color = b.color || COMP_COLORS[key] || '#7A6E67';
        return { key, label, color,
          unitCount:       b.unitCount       ?? 0,
          unitSize:        b.unitSize        ?? 0,
          nsa:             b.nsa             ?? 0,
          salePricePerSqm: b.salePricePerSqm ?? 0,
          totalSales:      b.totalSales      ?? 0,
        };
      }),
  [breakdown]);

  // ── Totals ────────────────────────────────────────────────────────────────
  const totalUnits       = project.units      ?? 0;
  const unitsSold        = project.unitsSold  ?? 0;
  const unitsRemaining   = Math.max(0, totalUnits - unitsSold);
  const soldPct          = totalUnits > 0 ? (unitsSold / totalUnits) * 100 : 0;

  const totalSalesValue  = salesRows.reduce((s, r) => s + r.totalSales, 0)
                           || (project.costs?.totalRevenue ?? 0);

  const offplanSales     = project.financing?.offplanSales ?? 0;
  const regularSales     = Math.max(0, totalSalesValue - offplanSales);
  const offplanPct       = totalSalesValue > 0 ? (offplanSales / totalSalesValue) * 100 : 0;

  // ── Collections (tracked in localStorage) ────────────────────────────────
  const [collections, setCollections] = useState(
    () => ls(`salesCollections_${project.id}`) ?? { contracted: 0, collected: 0 }
  );
  const [editingCol, setEditingCol] = useState(false);
  const [colForm, setColForm] = useState({ contracted: '', collected: '' });

  const saveCollections = () => {
    const updated = {
      contracted: parseFloat(colForm.contracted) || collections.contracted,
      collected:  parseFloat(colForm.collected)  || collections.collected,
    };
    setCollections(updated);
    lsSet(`salesCollections_${project.id}`, updated);
    setEditingCol(false);
  };

  const collectionPct = collections.contracted > 0
    ? (collections.collected / collections.contracted) * 100
    : 0;

  return (
    <div className="space-y-4">

      {/* ── KPI cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-3">
        <KpiCard label="إجمالي الوحدات"   value={fmtNum(totalUnits)}     color="var(--text-hi)" />
        <KpiCard label="الوحدات المباعة"  value={fmtNum(unitsSold)}
          color="#10b981" pct={soldPct} />
        <KpiCard label="الوحدات المتبقية" value={fmtNum(unitsRemaining)} color="#a78bfa" />
        <KpiCard label="إجمالي الإيراد"
          value={fmt(totalSalesValue)} sub={sarSub} color="var(--rasf-primary)" />
        <KpiCard label="مبيعات الخارطة"
          value={offplanSales > 0 ? fmt(offplanSales) : '—'}
          sub={offplanSales > 0 ? sarSub : undefined}
          color="#4f8ef7"
          pct={offplanSales > 0 ? offplanPct : undefined} />
      </div>

      {/* ── Sales table + Off-plan split ─────────────────────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '2fr 1fr' }}>

        {/* Sales by component */}
        <GlassCard>
          <div className="section-hd mb-4">تفاصيل المبيعات حسب المكوّن</div>
          {salesRows.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              لا توجد بيانات مبيعات — يرجى استيراد دراسة الجدوى أو إدخال بيانات المكونات
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-line)' }}>
                    {['المكوّن', 'الوحدات', 'متوسط المساحة', 'سعر المتر', 'إجمالي المبيعات', 'النسبة'].map(h => (
                      <th key={h} className="text-right pb-2 px-2"
                        style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {salesRows.map(row => {
                    const rowPct = totalSalesValue > 0 ? (row.totalSales / totalSalesValue) * 100 : 0;
                    return (
                      <tr key={row.key} style={{ borderBottom: '1px solid var(--glass-line)' }}>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: row.color, display: 'inline-block', flexShrink: 0 }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-hi)' }}>{row.label}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2" style={{ fontSize: 12, color: 'var(--text-lo)' }}>
                          {row.unitCount > 0 ? `${row.unitCount.toLocaleString()} وحدة` : '—'}
                        </td>
                        <td className="py-3 px-2" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {row.unitSize > 0 ? `${row.unitSize} م²` : row.nsa > 0 ? `${row.nsa.toLocaleString()} م²` : '—'}
                        </td>
                        <td className="py-3 px-2" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {row.salePricePerSqm > 0 ? fmtSar(row.salePricePerSqm) : '—'}
                        </td>
                        <td className="py-3 px-2" style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>
                          {row.totalSales > 0 ? fmt(row.totalSales) : '—'}
                        </td>
                        <td className="py-3 px-2" style={{ minWidth: 80 }}>
                          {rowPct > 0 && (
                            <div>
                              <PctBar value={rowPct} color={row.color} />
                              <div style={{ fontSize: 10, color: row.color, marginTop: 2 }}>{rowPct.toFixed(1)}%</div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Total row */}
                  {salesRows.length > 1 && (
                    <tr style={{ borderTop: '2px solid var(--glass-line)', background: 'var(--rasf-primary-dim)' }}>
                      <td className="py-3 px-2" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>الإجمالي</td>
                      <td className="py-3 px-2" style={{ fontSize: 12, color: 'var(--text-lo)' }}>
                        {totalUnits > 0 ? `${totalUnits.toLocaleString()} وحدة` : '—'}
                      </td>
                      <td className="py-3 px-2" />
                      <td className="py-3 px-2" />
                      <td className="py-3 px-2" style={{ fontSize: 13, fontWeight: 800, color: 'var(--rasf-primary)' }}>
                        {fmt(totalSalesValue)}
                      </td>
                      <td className="py-3 px-2" />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

        {/* Off-plan vs regular + collections */}
        <div className="space-y-4">

          {/* Off-plan split */}
          <GlassCard>
            <div className="section-hd mb-4">الخارطة مقابل المبيعات العادية</div>

            <div className="space-y-3">
              {/* Bar visual */}
              {totalSalesValue > 0 && (
                <div style={{ height: 8, borderRadius: 6, overflow: 'hidden', background: 'var(--glass-line)', display: 'flex' }}>
                  <div style={{ width: `${offplanPct}%`, background: '#4f8ef7', transition: 'width .4s' }} />
                  <div style={{ flex: 1, background: '#10b981' }} />
                </div>
              )}

              <div className="space-y-2 mt-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4f8ef7', display: 'inline-block' }} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>مبيعات الخارطة</span>
                  </div>
                  <div className="text-left">
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#4f8ef7' }}>{offplanSales > 0 ? fmt(offplanSales) : '—'}</div>
                    {offplanPct > 0 && <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{offplanPct.toFixed(1)}%</div>}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>مبيعات عادية</span>
                  </div>
                  <div className="text-left">
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>{regularSales > 0 ? fmt(regularSales) : '—'}</div>
                    {regularSales > 0 && totalSalesValue > 0 && (
                      <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{(100 - offplanPct).toFixed(1)}%</div>
                    )}
                  </div>
                </div>
              </div>

              {/* سعي المبيعات reference */}
              {regularSales > 0 && (
                <div style={{ background: 'var(--rasf-primary-dim)', borderRadius: 8, padding: '8px 10px', marginTop: 4 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 4 }}>أساس سعي المبيعات</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    المبيعات العادية فقط (تُستثنى الخارطة)
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--rasf-primary)', marginTop: 2 }}>
                    {fmt(regularSales)} <span style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 400 }}>{sarSub}</span>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Collections tracking */}
          <GlassCard>
            <div className="flex justify-between items-center mb-4">
              <div className="section-hd">تتبع التحصيل</div>
              {!editingCol && (
                <button
                  onClick={() => { setColForm({ contracted: collections.contracted || '', collected: collections.collected || '' }); setEditingCol(true); }}
                  style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, cursor: 'pointer', background: 'transparent', border: '1px solid var(--border-mid)', color: 'var(--text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--rasf-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  تعديل
                </button>
              )}
            </div>

            {editingCol ? (
              <div className="space-y-3">
                {[
                  { field: 'contracted', label: 'إجمالي المتعاقد عليه (مليون ريال)' },
                  { field: 'collected',  label: 'المحصّل حتى الآن (مليون ريال)' },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
                    <input
                      type="number"
                      value={colForm[field]}
                      onChange={e => setColForm(f => ({ ...f, [field]: e.target.value }))}
                      placeholder="0"
                      style={{ width: '100%', padding: '6px 10px', borderRadius: 7, fontSize: 12, background: 'var(--bg-card-strong)', border: '1px solid var(--border-soft)', color: 'var(--text-hi)', outline: 'none', fontFamily: 'inherit' }}
                    />
                  </div>
                ))}
                <div className="flex gap-2">
                  <button onClick={saveCollections}
                    style={{ flex: 1, padding: '6px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: 'var(--rasf-primary-dim)', border: '1px solid var(--rasf-primary)', color: 'var(--rasf-primary)' }}>
                    حفظ
                  </button>
                  <button onClick={() => setEditingCol(false)}
                    style={{ padding: '6px 12px', borderRadius: 7, fontSize: 11, cursor: 'pointer', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <CollectionRow label="إجمالي المتعاقد عليه" value={collections.contracted} color="var(--rasf-primary)" />
                <CollectionRow label="المحصّل حتى الآن"     value={collections.collected}  color="#10b981" />
                <CollectionRow label="المتبقي للتحصيل"      value={Math.max(0, collections.contracted - collections.collected)} color="#a78bfa" />

                {collections.contracted > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <PctBar value={collectionPct} color="#10b981" height={5} />
                    <div style={{ fontSize: 10, color: '#10b981', marginTop: 3, fontWeight: 600 }}>
                      {collectionPct.toFixed(1)}% محصّل
                    </div>
                  </div>
                )}

                {collections.contracted === 0 && (
                  <div className="text-center py-3" style={{ color: 'var(--text-faint)', fontSize: 11 }}>
                    لم يتم إدخال بيانات التحصيل بعد
                  </div>
                )}
              </div>
            )}
          </GlassCard>

        </div>
      </div>
    </div>
  );
}
