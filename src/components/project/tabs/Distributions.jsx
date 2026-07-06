import { useState, useMemo } from 'react';
import { useApp } from '../../../contexts/useApp';
import { fmtSARMode } from '../../../utils/fmtMode';
import GlassCard from '../../common/GlassCard';
import Tag from '../../common/Tag';
import { X, ChevronDown, ChevronRight } from 'lucide-react';

const EQUITY_DEFS = [
  { key: 'developerInKindSubscription', labelAr: 'الاشتراك العيني من المطور',  isDev: true,  isInKind: true,  color: '#5A4535' },
  { key: 'developerCashSubscription',   labelAr: 'الاشتراك النقدي من المطور',  isDev: true,  isInKind: false, color: '#8B7566' },
  { key: 'cashSubscriptions',           labelAr: 'الاشتراكات النقدية',          isDev: false, isInKind: false, color: '#B5A495' },
  { key: 'fundManagerSubscription',     labelAr: 'مدير الصندوق',               isDev: false, isInKind: false, color: '#6B5545' },
  { key: 'landOwnerInKind',             labelAr: 'مالك الأرض (اشتراك عيني)',   isDev: false, isInKind: true,  color: '#A4907E' },
];

const DIST_TYPES = [
  { value: 'interim', label: 'أرباح مرحلية', variant: 'amber' },
  { value: 'final',   label: 'توزيع نهائي',  variant: 'green' },
  { value: 'capital', label: 'عائد رأس مال', variant: 'blue'  },
];

function ls(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}

const TH = ({ children }) => (
  <th className="text-right pb-2 px-2" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
    {children}
  </th>
);
const TD = ({ children, style }) => (
  <td className="py-3 px-2" style={{ fontSize: 12, ...style }}>{children}</td>
);

const PCT_BTN = ({ onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      width: 22, height: 22, borderRadius: 5, border: '1px solid var(--border-mid)',
      background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
      fontSize: 15, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
  >
    {children}
  </button>
);

export default function Distributions({ project }) {
  const { displayMode } = useApp();
  const isFull = displayMode === 'full';
  const sarSub = isFull ? 'ريال' : 'ألف ريال';
  const fmt = (v) => fmtSARMode(v, displayMode);

  const fin = project.financing ?? {};
  const constructionCost = project.costs?.constructionCost ?? 0;

  // ── Equity participants ────────────────────────────────────────────────────
  const equityItems = useMemo(() => {
    const items = EQUITY_DEFS
      .map(def => ({ ...def, amount: fin[def.key] ?? 0 }))
      .filter(item => item.amount > 0);
    const totalEquity = items.reduce((s, i) => s + i.amount, 0);
    return items.map(item => ({
      ...item,
      pct: totalEquity > 0 ? (item.amount / totalEquity) * 100 : 0,
    }));
  }, [fin]);

  const devItems   = equityItems.filter(i => i.isDev);
  const otherItems = equityItems.filter(i => !i.isDev);
  const devTotal   = devItems.reduce((s, i) => s + i.amount, 0);
  const devPct     = devItems.reduce((s, i) => s + i.pct, 0);
  const devInKind  = devItems.find(i => i.isInKind)?.amount ?? 0;
  const devCash    = devItems.find(i => !i.isInKind)?.amount ?? 0;

  const netProfit = isFinite(project.netProfit) ? (project.netProfit ?? 0) : 0;

  // ── Equity distributions (دورات التوزيع) ──────────────────────────────────
  const [dists, setDists]         = useState(() => ls(`distributions_${project.id}`) ?? []);
  const [showForm, setShowForm]   = useState(false);
  const [expandDev, setExpandDev] = useState(false);
  const [formDate, setFormDate]   = useState('');
  const [formType, setFormType]   = useState('interim');
  const [formAmount, setFormAmount] = useState('');

  const totalDistributed = dists.reduce((s, d) => s + d.totalAmount, 0);
  const totalRemaining   = Math.max(0, netProfit - totalDistributed);

  const distributedByKey = useMemo(() => {
    const map = {};
    for (const d of dists)
      for (const [key, amt] of Object.entries(d.breakdown ?? {}))
        map[key] = (map[key] ?? 0) + amt;
    return map;
  }, [dists]);

  const distForKey     = (key) => distributedByKey[key] ?? 0;
  const devDistributed = devItems.reduce((s, i) => s + distForKey(i.key), 0);

  const handleAddDist = () => {
    const amount = parseFloat(formAmount);
    if (!formDate || !amount || amount <= 0) return;
    const breakdown = {};
    for (const item of equityItems)
      breakdown[item.key] = parseFloat(((item.pct / 100) * amount).toFixed(2));
    const updated = [...dists, { id: `dist_${Date.now()}`, date: formDate, type: formType, totalAmount: amount, breakdown }]
      .sort((a, b) => a.date.localeCompare(b.date));
    setDists(updated);
    lsSet(`distributions_${project.id}`, updated);
    setShowForm(false); setFormDate(''); setFormAmount(''); setFormType('interim');
  };

  const handleDeleteDist = (id) => {
    const updated = dists.filter(d => d.id !== id);
    setDists(updated);
    lsSet(`distributions_${project.id}`, updated);
  };

  // ── Contractor margin (فارق المقاولات) ────────────────────────────────────
  const [marginPct, setMarginPctState] = useState(() => ls(`marginPct_${project.id}`) ?? 5);
  const [marginPayments, setMarginPayments] = useState(() => ls(`marginPayments_${project.id}`) ?? []);
  const [showMarginForm, setShowMarginForm] = useState(false);
  const [mDate, setMDate]     = useState('');
  const [mAmount, setMAmount] = useState('');

  const saveMarginPct = (val) => {
    const clamped = Math.round(Math.min(20, Math.max(1, val)) * 2) / 2; // step 0.5
    setMarginPctState(clamped);
    lsSet(`marginPct_${project.id}`, clamped);
  };

  const marginTotal     = parseFloat(((marginPct / 100) * constructionCost).toFixed(2));
  const marginPaid      = marginPayments.reduce((s, p) => s + p.amount, 0);
  const marginRemaining = Math.max(0, marginTotal - marginPaid);

  const addMarginPayment = () => {
    const amount = parseFloat(mAmount);
    if (!mDate || !amount || amount <= 0) return;
    const updated = [...marginPayments, { id: `mp_${Date.now()}`, date: mDate, amount }]
      .sort((a, b) => a.date.localeCompare(b.date));
    setMarginPayments(updated);
    lsSet(`marginPayments_${project.id}`, updated);
    setShowMarginForm(false); setMDate(''); setMAmount('');
  };

  const deleteMarginPayment = (id) => {
    const updated = marginPayments.filter(p => p.id !== id);
    setMarginPayments(updated);
    lsSet(`marginPayments_${project.id}`, updated);
  };

  const previewAmount = parseFloat(formAmount) || 0;
  const histCols = [
    ...(devTotal > 0 ? [{ key: '__dev', label: 'المطور' }] : []),
    ...otherItems.map(i => ({ key: i.key, label: i.labelAr })),
  ];

  const inputStyle = {
    padding: '5px 8px', borderRadius: 6, fontSize: 11,
    background: 'var(--bg-card-strong)', border: '1px solid var(--border-soft)',
    color: 'var(--text-hi)', outline: 'none', fontFamily: 'inherit',
  };

  return (
    <div className="space-y-4">

      {/* ── Summary cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'الأرباح المتوقعة',  value: fmt(netProfit),        color: 'var(--rasf-primary)' },
          { label: 'الموزع حتى الآن',   value: fmt(totalDistributed), color: '#10b981' },
          { label: 'المتبقي للتوزيع',   value: fmt(totalRemaining),   color: '#a78bfa' },
          { label: 'عدد دورات التوزيع', value: dists.length,           color: 'var(--text-hi)' },
        ].map(c => (
          <div key={c.label} className="glass rounded-xl p-4 text-center">
            <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>{sarSub}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* ── فارق المقاولات ────────────────────────────────────────────────── */}
      <GlassCard>
        <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
          <div>
            <div className="section-hd mb-0.5">فارق المقاولات للمطور</div>
            <div className="section-sub">دخل إضافي للمطور من فارق عقود الإنشاء — خارج هيكل الملكية</div>
          </div>

          {/* KPI row */}
          <div className="flex gap-6 flex-wrap items-start">
            {/* تكاليف البناء */}
            <div className="text-center">
              <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 4 }}>تكاليف البناء</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-lo)' }}>
                {constructionCost > 0 ? fmt(constructionCost) : '—'}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-faint)' }}>{sarSub}</div>
            </div>

            {/* نسبة الفارق */}
            <div className="text-center">
              <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 4 }}>نسبة الفارق</div>
              <div className="flex items-center gap-1.5 justify-center">
                <PCT_BTN onClick={() => saveMarginPct(marginPct - 0.5)}>−</PCT_BTN>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--rasf-primary)', minWidth: 44, textAlign: 'center' }}>
                  {marginPct}%
                </span>
                <PCT_BTN onClick={() => saveMarginPct(marginPct + 0.5)}>+</PCT_BTN>
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-faint)', marginTop: 2 }}>5% — 10% متعارف عليه</div>
            </div>

            {/* المستحق */}
            <div className="text-center">
              <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 4 }}>إجمالي المستحق</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--rasf-primary)' }}>
                {constructionCost > 0 ? fmt(marginTotal) : '—'}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-faint)' }}>{sarSub}</div>
            </div>

            {/* المدفوع */}
            <div className="text-center">
              <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 4 }}>المدفوع</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#10b981' }}>{fmt(marginPaid)}</div>
              <div style={{ fontSize: 9, color: 'var(--text-faint)' }}>{sarSub}</div>
            </div>

            {/* المتبقي */}
            <div className="text-center">
              <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 4 }}>المتبقي</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#a78bfa' }}>
                {constructionCost > 0 ? fmt(marginRemaining) : '—'}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-faint)' }}>{sarSub}</div>
            </div>
          </div>
        </div>

        {/* Payment history + add form */}
        <div style={{ borderTop: '1px solid var(--glass-line)', paddingTop: 12 }}>
          {marginPayments.length > 0 && (
            <div className="space-y-2 mb-3">
              {marginPayments.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-3" style={{ fontSize: 12 }}>
                  <span style={{ color: 'var(--text-faint)', minWidth: 18 }}>{idx + 1}</span>
                  <span style={{ color: 'var(--text-lo)', minWidth: 80 }}>{p.date}</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>{fmt(p.amount)} {sarSub}</span>
                  <button
                    onClick={() => deleteMarginPayment(p.id)}
                    style={{ color: 'var(--text-muted)', fontSize: 13, padding: '1px 5px', background: 'transparent', cursor: 'pointer', borderRadius: 4, marginRight: 'auto' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  ><X size={13} /></button>
                </div>
              ))}
            </div>
          )}

          {showMarginForm ? (
            <div className="flex gap-2 items-center flex-wrap">
              <input type="month" value={mDate} onChange={e => setMDate(e.target.value)} style={inputStyle} />
              <input
                type="number" value={mAmount} onChange={e => setMAmount(e.target.value)}
                placeholder="المبلغ (مليون ريال)" style={{ ...inputStyle, width: 150 }}
              />
              <button
                onClick={addMarginPayment}
                style={{ padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: 'var(--rasf-primary-dim)', border: '1px solid var(--rasf-primary)', color: 'var(--rasf-primary)' }}
              >تسجيل</button>
              <button
                onClick={() => { setShowMarginForm(false); setMDate(''); setMAmount(''); }}
                style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              >إلغاء</button>
            </div>
          ) : (
            <button
              onClick={() => setShowMarginForm(true)}
              style={{ fontSize: 11, padding: '5px 14px', borderRadius: 6, cursor: 'pointer', background: 'transparent', border: '1px dashed var(--rasf-primary)', color: 'var(--rasf-primary)', fontWeight: 600 }}
            >
              + تسجيل دفعة من فارق المقاولات
            </button>
          )}
        </div>
      </GlassCard>

      {/* ── Equity owners grid ────────────────────────────────────────────── */}
      {equityItems.length === 0 ? (
        <GlassCard>
          <div className="text-center py-10" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            لا توجد بيانات ملاك — يرجى إدخال هيكل التمويل أولاً
          </div>
        </GlassCard>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: '3fr 2fr' }}>

          {/* Owners table */}
          <GlassCard>
            <div className="section-hd mb-4">هيكل الملاك والتوزيعات</div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-line)' }}>
                    <TH>الجهة</TH><TH>نوع الاشتراك</TH><TH>المبلغ</TH>
                    <TH>نسبة %</TH><TH>المستحق</TH><TH>الموزع</TH><TH>المتبقي</TH>
                  </tr>
                </thead>
                <tbody>
                  {/* Developer row */}
                  {devTotal > 0 && <>
                    <tr onClick={() => setExpandDev(v => !v)} style={{ borderBottom: '1px solid var(--glass-line)', cursor: 'pointer' }}>
                      <TD>
                        <div style={{ fontWeight: 700, color: 'var(--text-hi)', fontSize: 12 }}>
                          {expandDev ? <ChevronDown size={11} style={{ display: 'inline', marginLeft: 4 }} /> : <ChevronRight size={11} style={{ display: 'inline', marginLeft: 4 }} />}المطور
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>
                          {devInKind > 0 && devCash > 0 ? 'عيني + نقدي' : devInKind > 0 ? 'عيني' : 'نقدي'}
                        </div>
                      </TD>
                      <TD>
                        <div className="flex flex-col gap-0.5">
                          {devInKind > 0 && <Tag variant="amber">عيني</Tag>}
                          {devCash  > 0 && <Tag variant="blue">نقدي</Tag>}
                        </div>
                      </TD>
                      <TD style={{ fontWeight: 600, color: 'var(--text-hi)' }}>{fmt(devTotal)}</TD>
                      <TD style={{ color: 'var(--rasf-primary)', fontWeight: 700 }}>{devPct.toFixed(1)}%</TD>
                      <TD style={{ color: 'var(--text-lo)' }}>{fmt((devPct / 100) * netProfit)}</TD>
                      <TD style={{ color: '#10b981' }}>{fmt(devDistributed)}</TD>
                      <TD style={{ color: '#a78bfa' }}>{fmt(Math.max(0, (devPct / 100) * netProfit - devDistributed))}</TD>
                    </tr>
                    {expandDev && devItems.map(item => (
                      <tr key={item.key} style={{ background: 'var(--rasf-primary-dim)', borderBottom: '1px solid var(--glass-line)' }}>
                        <TD style={{ paddingRight: 20 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>↳ {item.isInKind ? 'اشتراك عيني' : 'اشتراك نقدي'}</div>
                        </TD>
                        <TD><Tag variant={item.isInKind ? 'amber' : 'blue'}>{item.isInKind ? 'عيني' : 'نقدي'}</Tag></TD>
                        <TD style={{ color: 'var(--text-lo)' }}>{fmt(item.amount)}</TD>
                        <TD style={{ color: 'var(--text-muted)' }}>{item.pct.toFixed(1)}%</TD>
                        <TD style={{ color: 'var(--text-lo)' }}>{fmt((item.pct / 100) * netProfit)}</TD>
                        <TD style={{ color: '#10b981' }}>{fmt(distForKey(item.key))}</TD>
                        <TD style={{ color: '#a78bfa' }}>{fmt(Math.max(0, (item.pct / 100) * netProfit - distForKey(item.key)))}</TD>
                      </tr>
                    ))}
                  </>}

                  {/* Other equity participants */}
                  {otherItems.map(item => {
                    const due  = (item.pct / 100) * netProfit;
                    const paid = distForKey(item.key);
                    return (
                      <tr key={item.key} style={{ borderBottom: '1px solid var(--glass-line)' }}>
                        <TD style={{ fontWeight: 600, color: 'var(--text-hi)' }}>{item.labelAr}</TD>
                        <TD><Tag variant={item.isInKind ? 'amber' : 'blue'}>{item.isInKind ? 'عيني' : 'نقدي'}</Tag></TD>
                        <TD style={{ fontWeight: 600, color: 'var(--text-hi)' }}>{fmt(item.amount)}</TD>
                        <TD style={{ color: item.color, fontWeight: 700 }}>{item.pct.toFixed(1)}%</TD>
                        <TD style={{ color: 'var(--text-lo)' }}>{fmt(due)}</TD>
                        <TD style={{ color: '#10b981' }}>{fmt(paid)}</TD>
                        <TD style={{ color: '#a78bfa' }}>{fmt(Math.max(0, due - paid))}</TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Add distribution form */}
          <GlassCard>
            <div className="section-hd mb-4">إضافة دورة توزيع</div>

            {showForm ? (
              <div className="space-y-3">
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>تاريخ التوزيع</div>
                  <input type="month" value={formDate} onChange={e => setFormDate(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 8, fontSize: 12, background: 'var(--bg-card-strong)', border: '1px solid var(--border-soft)', color: 'var(--text-hi)', outline: 'none' }} />
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>نوع التوزيع</div>
                  <div className="flex gap-2 flex-wrap">
                    {DIST_TYPES.map(dt => (
                      <button key={dt.value} type="button" onClick={() => setFormType(dt.value)}
                        style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                          border: formType === dt.value ? '1px solid var(--rasf-primary)' : '1px solid var(--border)',
                          background: formType === dt.value ? 'var(--rasf-primary-dim)' : 'transparent',
                          color: formType === dt.value ? 'var(--rasf-primary)' : 'var(--text-muted)',
                          fontWeight: formType === dt.value ? 700 : 400 }}
                      >{dt.label}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>المبلغ الإجمالي (مليون ريال)</div>
                  <input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="0"
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 8, fontSize: 13, background: 'var(--bg-card-strong)', border: '1px solid var(--border-soft)', color: 'var(--text-hi)', outline: 'none', fontFamily: 'inherit' }} />
                </div>

                {previewAmount > 0 && (
                  <div style={{ background: 'var(--rasf-primary-dim)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 6 }}>توزيع مقترح</div>
                    {devTotal > 0 && (
                      <div className="flex justify-between" style={{ fontSize: 11, marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-muted)' }}>المطور</span>
                        <span style={{ color: 'var(--rasf-primary)', fontWeight: 600 }}>{fmt((devPct / 100) * previewAmount)}</span>
                      </div>
                    )}
                    {otherItems.map(item => (
                      <div key={item.key} className="flex justify-between" style={{ fontSize: 11, marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{item.labelAr}</span>
                        <span style={{ color: item.color, fontWeight: 600 }}>{fmt((item.pct / 100) * previewAmount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button onClick={handleAddDist}
                    style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'var(--rasf-primary-dim)', border: '1px solid var(--rasf-primary)', color: 'var(--rasf-primary)' }}>
                    تأكيد التوزيع
                  </button>
                  <button onClick={() => { setShowForm(false); setFormAmount(''); setFormDate(''); }}
                    style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {dists.length === 0 && (
                  <div className="text-center py-6 mb-3" style={{ color: 'var(--text-faint)', fontSize: 12 }}>
                    لا توجد توزيعات مسجلة بعد
                  </div>
                )}
                <button onClick={() => setShowForm(true)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'var(--rasf-primary-dim)', border: '1px dashed var(--rasf-primary)', color: 'var(--rasf-primary)' }}>
                  + إضافة دورة توزيع جديدة
                </button>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* ── Distribution history ───────────────────────────────────────────── */}
      {dists.length > 0 && (
        <GlassCard>
          <div className="section-hd mb-4">سجل التوزيعات</div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-line)' }}>
                  <TH>#</TH><TH>التاريخ</TH><TH>النوع</TH><TH>الإجمالي</TH>
                  {histCols.map(c => <TH key={c.key}>{c.label}</TH>)}
                  <TH />
                </tr>
              </thead>
              <tbody>
                {dists.map((d, idx) => {
                  const typeInfo = DIST_TYPES.find(dt => dt.value === d.type) ?? DIST_TYPES[0];
                  const devInDist = devItems.reduce((s, i) => s + (d.breakdown?.[i.key] ?? 0), 0);
                  return (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--glass-line)' }}>
                      <TD style={{ color: 'var(--text-faint)' }}>{idx + 1}</TD>
                      <TD style={{ color: 'var(--text-lo)', whiteSpace: 'nowrap' }}>{d.date}</TD>
                      <TD><Tag variant={typeInfo.variant}>{typeInfo.label}</Tag></TD>
                      <TD style={{ fontWeight: 700, color: 'var(--rasf-primary)', fontSize: 13 }}>{fmt(d.totalAmount)}</TD>
                      {histCols.map(c => (
                        <TD key={c.key} style={{ color: 'var(--text-lo)' }}>
                          {fmt(c.key === '__dev' ? devInDist : (d.breakdown?.[c.key] ?? 0))}
                        </TD>
                      ))}
                      <TD>
                        <button onClick={() => handleDeleteDist(d.id)}
                          style={{ color: 'var(--text-muted)', fontSize: 13, padding: '2px 6px', borderRadius: 4, background: 'transparent', cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>✕</button>
                      </TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
