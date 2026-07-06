import { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import GlassCard from '../common/GlassCard';
import Tag from '../common/Tag';
import { donutCenterPlugin } from '../../utils/chartColors';
import {
  COMMERCIAL_PROJECTS,
  getAllUnits,
  getPortfolioStats,
  getProjectStats,
  getAgentStats,
  getFunnelData,
  getMarketingData,
} from '../../data/commercialSeedData';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// ─── Colors ───────────────────────────────────────────────────────────────────
const C_SOLD      = '#10B981';
const C_RESERVED  = '#F59E0B';
const C_AVAILABLE = '#6B7280';

const STATUS_META = {
  sold:      { label: 'مباع',  color: C_SOLD,      tagVariant: 'green' },
  reserved:  { label: 'محجوز', color: C_RESERVED,  tagVariant: 'amber' },
  available: { label: 'متاح',  color: C_AVAILABLE, tagVariant: 'blue'  },
};

const FUNNEL_STAGES = [
  { key: 'interested', label: 'المهتمين'  },
  { key: 'contacted',  label: 'التواصل'   },
  { key: 'visited',    label: 'الزيارة'   },
  { key: 'reserved',   label: 'الحجز'     },
  { key: 'sold',       label: 'المبيعات'  },
  { key: 'delivered',  label: 'التسليم'   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtM = (v) =>
  v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(2)} م`
    : `${(v / 1_000).toFixed(0)} ألف`;

const fmtNum = (v) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v);

const fmtSAR = (v) => fmtNum(v) + ' ﷼';

const pct = (a, b) => (b > 0 ? ((a / b) * 100).toFixed(0) : '—') + '%';

// ─── Shared KPI card ──────────────────────────────────────────────────────────
function KPI({ label, value, sub, color, border }) {
  return (
    <GlassCard padding="p-4" className="flex flex-col gap-1">
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.4px' }}>{label}</div>
      <div style={{
        fontSize: 28, fontWeight: 800, lineHeight: 1.1,
        color: color ?? 'var(--text-hi)',
        borderInlineStart: border ? `3px solid ${border}` : undefined,
        paddingInlineStart: border ? 8 : 0,
      }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{sub}</div>}
    </GlassCard>
  );
}

// ─── Project selector (shared across tabs) ────────────────────────────────────
function ProjectTabs({ active, onChange }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {[{ id: 'all', name: 'الإجمالي' }, ...COMMERCIAL_PROJECTS].map(p => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          style={{
            padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', transition: 'all .15s',
            background: active === p.id ? 'var(--rasf-primary)'   : 'var(--bg-subtle)',
            color:      active === p.id ? '#fff'                   : 'var(--text-muted)',
            border:     active === p.id ? '1px solid transparent'  : '1px solid var(--border-faint)',
          }}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}

// ─── TAB 1: المبيعات ──────────────────────────────────────────────────────────
function SalesTab({ projectId }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [agentFilter,  setAgentFilter]  = useState('all');
  const [zoneFilter,   setZoneFilter]   = useState('all');

  const allUnits = useMemo(() => getAllUnits(), []);
  const stats    = useMemo(
    () => projectId === 'all' ? getPortfolioStats() : getProjectStats(projectId),
    [projectId],
  );
  const agents = useMemo(() => getAgentStats(projectId === 'all' ? null : projectId), [projectId]);

  const filteredUnits = useMemo(() => {
    let units = projectId === 'all' ? allUnits : allUnits.filter(u => u.projectId === projectId);
    if (statusFilter !== 'all') units = units.filter(u => u.status === statusFilter);
    if (agentFilter  !== 'all') units = units.filter(u => u.agent === agentFilter);
    if (zoneFilter   !== 'all') units = units.filter(u => u.zone  === zoneFilter);
    return units;
  }, [allUnits, projectId, statusFilter, agentFilter, zoneFilter]);

  const availableZones = useMemo(() => {
    const base = projectId === 'all' ? allUnits : allUnits.filter(u => u.projectId === projectId);
    return [...new Set(base.map(u => u.zone).filter(Boolean))].sort();
  }, [allUnits, projectId]);

  const availableAgents = useMemo(() => {
    const base = projectId === 'all' ? allUnits : allUnits.filter(u => u.projectId === projectId);
    return [...new Set(base.map(u => u.agent).filter(Boolean))].sort();
  }, [allUnits, projectId]);

  const showZoneCol = projectId === 'all'
    ? allUnits.some(u => u.zone)
    : COMMERCIAL_PROJECTS.find(p => p.id === projectId)?.hasZones;

  const sellPct = stats.sellThrough.toFixed(1);

  // Donut
  const donutData = {
    labels: ['مباع', 'محجوز', 'متاح'],
    datasets: [{ data: [stats.sold, stats.reserved, stats.available], backgroundColor: [C_SOLD, C_RESERVED, C_AVAILABLE], borderWidth: 0, hoverOffset: 6 }],
  };

  // Stacked bar — only when all projects
  const barData = {
    labels: COMMERCIAL_PROJECTS.map(p => p.name),
    datasets: [
      { label: 'مباع',  data: COMMERCIAL_PROJECTS.map(p => getProjectStats(p.id).sold),      backgroundColor: C_SOLD,             borderRadius: 4, stack: 's' },
      { label: 'محجوز', data: COMMERCIAL_PROJECTS.map(p => getProjectStats(p.id).reserved),  backgroundColor: C_RESERVED,         borderRadius: 4, stack: 's' },
      { label: 'متاح',  data: COMMERCIAL_PROJECTS.map(p => getProjectStats(p.id).available), backgroundColor: C_AVAILABLE + '88', borderRadius: 4, stack: 's' },
    ],
  };
  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index' } },
    scales: {
      x: { stacked: true, ticks: { color: '#7A6E67', font: { family: 'Almarai', size: 10 } }, grid: { display: false }, border: { display: false } },
      y: { stacked: true, ticks: { color: '#7A6E67', stepSize: 5 }, grid: { color: 'rgba(71,53,48,0.08)' }, border: { display: false } },
    },
  };

  const tableFiltered = useMemo(() => ({
    count:     filteredUnits.length,
    soldValue: filteredUnits.filter(u => u.status === 'sold').reduce((s, u) => s + u.price, 0),
  }), [filteredUnits]);

  return (
    <div className="flex flex-col gap-5">
      {/* KPIs */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <KPI label="قيمة المبيعات"      value={fmtM(stats.soldValue)}        sub="وحدات مباعة"         color={C_SOLD}              border={C_SOLD} />
        <KPI label="وحدات مباعة"        value={stats.sold}                    sub={`من ${stats.total} وحدة`} />
        <KPI label="الحجوزات"           value={stats.reserved}                sub={fmtM(stats.reservedValue)}  color={C_RESERVED}    border={C_RESERVED} />
        <KPI label="الإيرادات المحصلة"  value={fmtM(stats.collectedRevenue)}  sub="المبالغ المستلمة فعلياً"  color="var(--rasf-primary)" border="var(--rasf-primary)" />
      </div>

      {/* Charts */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '260px 1fr' }}>
        <GlassCard padding="p-4" className="flex flex-col gap-3">
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-hi)' }}>توزيع الوحدات</div>
          <div style={{ position: 'relative', height: 150 }}>
            <Doughnut data={donutData} options={{ responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false } } }} plugins={[donutCenterPlugin]} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-hi)' }}>{sellPct}%</div>
              <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>إشغال</div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {[{ label: 'مباع', count: stats.sold, color: C_SOLD }, { label: 'محجوز', count: stats.reserved, color: C_RESERVED }, { label: 'متاح', count: stats.available, color: C_AVAILABLE }].map(r => (
              <div key={r.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, display: 'inline-block' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.label}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-med)' }}>{r.count} وحدة</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard padding="p-4" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-hi)' }}>الوحدات حسب المشروع</div>
            <div className="flex gap-3">
              {[{ l: 'مباع', c: C_SOLD }, { l: 'محجوز', c: C_RESERVED }, { l: 'متاح', c: C_AVAILABLE + '88' }].map(x => (
                <div key={x.l} className="flex items-center gap-1">
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: x.c, display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{x.l}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: 170 }}>
            <Bar data={barData} options={barOpts} />
          </div>
        </GlassCard>
      </div>

      {/* Agents */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 10 }}>أداء موظفي المبيعات</div>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))' }}>
          {agents.map(a => {
            const initials = a.agent.split(' ').map(w => w[0]).join('').slice(0, 2);
            return (
              <GlassCard key={a.agent} padding="p-4" className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--rasf-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: '#fff', flexShrink: 0 }}>{initials}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-hi)' }}>{a.agent}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>موظف مبيعات</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: C_SOLD }}>{a.sold}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>مباع</div>
                  </div>
                  <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: C_RESERVED }}>{a.reserved}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>محجوز</div>
                  </div>
                  <div className="rounded-lg p-2 text-center" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-faint)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-med)' }}>{fmtM(a.soldValue)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>القيمة</div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Units table */}
      <GlassCard padding="p-4">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-1">
            {[{ k: 'all', l: 'الكل' }, { k: 'sold', l: 'مباع' }, { k: 'reserved', l: 'محجوز' }, { k: 'available', l: 'متاح' }].map(f => (
              <button key={f.k} onClick={() => setStatusFilter(f.k)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: statusFilter === f.k ? 'var(--bg-card-strong)' : 'transparent', color: statusFilter === f.k ? 'var(--text-hi)' : 'var(--text-faint)', border: statusFilter === f.k ? '1px solid var(--border-soft)' : '1px solid transparent' }}>{f.l}</button>
            ))}
          </div>
          {availableZones.length > 0 && (
            <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border-faint)', outline: 'none' }}>
              <option value="all">كل الزونات</option>
              {availableZones.map(z => <option key={z} value={z}>زون {z}</option>)}
            </select>
          )}
          <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border-faint)', outline: 'none' }}>
            <option value="all">كل الموظفين</option>
            {availableAgents.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <div style={{ marginInlineStart: 'auto', fontSize: 11, color: 'var(--text-faint)' }}>
            {tableFiltered.count} وحدة
            {tableFiltered.soldValue > 0 && <span style={{ marginInlineStart: 8, color: C_SOLD, fontWeight: 600 }}>· مبيعات: {fmtSAR(tableFiltered.soldValue)}</span>}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[
                  ...(projectId === 'all' ? [{ l: 'المشروع',      w: 130 }] : []),
                  ...(showZoneCol         ? [{ l: 'الزون',         w:  60 }] : []),
                  { l: 'المبنى',       w:  70 },
                  { l: 'رقم الوحدة',  w:  90 },
                  { l: 'الدور',        w:  55 },
                  { l: 'المساحة م²',  w:  80 },
                  { l: 'الجزء الخاص', w:  85 },
                  { l: 'الإجمالي م²', w:  80 },
                  { l: 'قيمة الوحدة', w: 120 },
                  { l: 'الحالة',       w:  80 },
                  { l: 'موظف المبيعات', w: 120 },
                ].map(col => (
                  <th key={col.l} style={{ padding: '8px 10px', textAlign: 'start', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', width: col.w }}>{col.l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUnits.length === 0 ? (
                <tr><td colSpan={12} style={{ textAlign: 'center', padding: 32, color: 'var(--text-faint)' }}>لا توجد وحدات تطابق الفلتر</td></tr>
              ) : filteredUnits.map((u, i) => (
                <tr key={`${u.projectId}-${u.unitNo}-${i}`}
                  style={{ borderBottom: '1px solid var(--border-faint)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-subtle)', transition: 'background .12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-strong)'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--bg-subtle)'}
                >
                  {projectId === 'all' && <td style={{ padding: '9px 10px', color: 'var(--text-med)', fontWeight: 600, whiteSpace: 'nowrap' }}>{u.projectName}</td>}
                  {showZoneCol && <td style={{ padding: '9px 10px' }}>{u.zone ? <span style={{ background: 'var(--rasf-primary-dim)', color: 'var(--rasf-primary)', borderRadius: 5, padding: '1px 8px', fontWeight: 700, fontSize: 11 }}>{u.zone}</span> : '—'}</td>}
                  <td style={{ padding: '9px 10px', color: 'var(--text-muted)' }}>{u.building}</td>
                  <td style={{ padding: '9px 10px', color: 'var(--text-hi)', fontWeight: 600 }}>{u.unitNo}</td>
                  <td style={{ padding: '9px 10px', color: 'var(--text-muted)' }}>{u.floor}</td>
                  <td style={{ padding: '9px 10px', color: 'var(--text-med)' }}>{u.area.toLocaleString('en-US')}</td>
                  <td style={{ padding: '9px 10px', color: 'var(--text-muted)' }}>{u.privateArea.toLocaleString('en-US')}</td>
                  <td style={{ padding: '9px 10px', color: 'var(--text-med)', fontWeight: 600 }}>{u.total.toLocaleString('en-US')}</td>
                  <td style={{ padding: '9px 10px', color: 'var(--rasf-primary)', fontWeight: 700, whiteSpace: 'nowrap' }}>{fmtSAR(u.price)}</td>
                  <td style={{ padding: '9px 10px' }}><Tag variant={STATUS_META[u.status].tagVariant}>{STATUS_META[u.status].label}</Tag></td>
                  <td style={{ padding: '9px 10px', color: u.agent ? 'var(--text-med)' : 'var(--text-faint)' }}>{u.agent ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

// ─── TAB 2: التسويق والتحويل البيعي (مدمج) ───────────────────────────────────
function MarketingFunnelTab({ projectId }) {
  const funnel  = useMemo(() => getFunnelData(projectId),    [projectId]);
  const mktData = useMemo(() => getMarketingData(projectId), [projectId]);
  if (!funnel || !mktData) return null;

  const max              = funnel.interested;
  const overallConversion = max > 0 ? ((funnel.sold / max) * 100).toFixed(1) : '0';
  const sourceColors     = ['#A4907E', '#B5A495', '#6B5545', '#CEB69F', '#473530'];

  const sourceBarData = {
    labels: mktData.leadSources.map(s => s.label),
    datasets: [{ data: mktData.leadSources.map(s => s.count), backgroundColor: sourceColors, borderRadius: 4 }],
  };
  const sourceBarOpts = {
    indexAxis: 'y', responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw} عميل` } } },
    scales: {
      x: { ticks: { color: '#7A6E67' }, grid: { color: 'rgba(71,53,48,0.08)' }, border: { display: false } },
      y: { ticks: { color: '#7A6E67', font: { family: 'Almarai', size: 11 } }, grid: { display: false }, border: { display: false } },
    },
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── KPIs ──────────────────────────────────────────────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <KPI label="العملاء المحتملون"        value={fmtNum(mktData.leads)}     sub="إجمالي الليدز" />
        <KPI label="تكلفة العميل المحتمل CPL" value={`${fmtNum(mktData.cpl)} ﷼`} sub="لكل عميل محتمل"  color={C_RESERVED}          border={C_RESERVED} />
        <KPI label="تكلفة الاكتساب CAC"       value={`${fmtNum(mktData.cac)} ﷼`} sub="لكل عملية بيع"   color="var(--rasf-primary)" border="var(--rasf-primary)" />
        <KPI label="معدل التحويل الإجمالي"    value={`${overallConversion}%`}    sub="مهتم ← مبيع"     color={C_SOLD}              border={C_SOLD} />
        <KPI label="المحتويات المنشورة"        value={mktData.contentCount}       sub="منشور تسويقي" />
      </div>

      {/* ── Funnel + Sources (side by side) ───────────────────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 320px' }}>

        {/* Funnel */}
        <GlassCard padding="p-5">
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 16 }}>مراحل التحويل البيعي</div>
          <div className="flex flex-col gap-1">
            {FUNNEL_STAGES.map((stage, idx) => {
              const count     = funnel[stage.key];
              const barWidth  = max > 0 ? (count / max) * 100 : 0;
              const next      = FUNNEL_STAGES[idx + 1];
              const nextCount = next ? funnel[next.key] : null;
              const convPct   = nextCount != null ? pct(nextCount, count) : null;

              return (
                <div key={stage.key}>
                  <div className="flex items-center gap-4" style={{ padding: '5px 0' }}>
                    <div style={{ width: 72, fontSize: 12, fontWeight: 700, color: 'var(--text-med)', textAlign: 'end', flexShrink: 0 }}>
                      {stage.label}
                    </div>
                    <div style={{ flex: 1, height: 34, background: 'var(--bg-subtle)', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${barWidth}%`, borderRadius: 6, transition: 'width .4s ease',
                        display: 'flex', alignItems: 'center', paddingInline: 10,
                        background: idx === 0 ? 'var(--rasf-primary)'
                          : idx < 3            ? `rgba(164,144,126,${0.9 - idx * 0.12})`
                          : idx === 3          ? C_RESERVED
                          : idx === 4          ? C_SOLD
                          :                      '#34D399',
                      }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>{fmtNum(count)}</span>
                      </div>
                    </div>
                    <div style={{ width: 64, fontSize: 11, color: 'var(--text-faint)', flexShrink: 0 }}>
                      {max > 0 ? ((count / max) * 100).toFixed(0) : 0}% من الكل
                    </div>
                  </div>

                  {convPct && (
                    <div className="flex items-center gap-4" style={{ padding: '1px 0' }}>
                      <div style={{ width: 72, flexShrink: 0 }} />
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, paddingInlineStart: 12 }}>
                        <div style={{ width: 1, height: 14, background: 'var(--border)', marginInlineStart: 14 }} />
                        <span style={{
                          fontSize: 11, fontWeight: 700, borderRadius: 5,
                          padding: '1px 8px', border: '1px solid var(--border-faint)',
                          background: 'var(--bg-subtle)',
                          color: parseFloat(convPct) > 50 ? C_SOLD : parseFloat(convPct) > 20 ? C_RESERVED : '#EF4444',
                        }}>
                          ↓ {convPct} تحويل
                        </span>
                      </div>
                      <div style={{ width: 64, flexShrink: 0 }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Lead sources */}
        <GlassCard padding="p-4" className="flex flex-col gap-3">
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-hi)' }}>مصادر العملاء المحتملين</div>
          <div style={{ height: 160 }}>
            <Bar data={sourceBarData} options={sourceBarOpts} />
          </div>
          <div className="flex flex-col gap-2" style={{ marginTop: 4 }}>
            {mktData.leadSources.map((s, i) => {
              const w = mktData.leads > 0 ? (s.count / mktData.leads) * 100 : 0;
              return (
                <div key={s.label}>
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-med)' }}>{s.count} · {w.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${w}%`, background: sourceColors[i % sourceColors.length], borderRadius: 3, transition: 'width .4s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CommercialPage({ defaultTab = 'sales' }) {
  const [activeProject, setActiveProject] = useState('all');

  const handleProjectChange = (id) => {
    setActiveProject(id);
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-hi)', margin: 0 }}>القطاع التجاري</h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {COMMERCIAL_PROJECTS.length} مشاريع · آخر تحديث: يونيو 2026
          </div>
        </div>
        <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-faint)', borderRadius: 12, padding: '6px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
          بيانات تجريبية
        </div>
      </div>

      {/* ── Project selector ────────────────────────────────────────────── */}
      <ProjectTabs active={activeProject} onChange={handleProjectChange} />

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      {defaultTab === 'sales'      && <SalesTab          projectId={activeProject} onProjectChange={handleProjectChange} />}
      {defaultTab === 'mktfunnel'  && <MarketingFunnelTab projectId={activeProject} />}
    </div>
  );
}
