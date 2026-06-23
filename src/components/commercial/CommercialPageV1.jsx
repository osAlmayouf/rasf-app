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
} from '../../data/commercialSeedData';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// ─── Colors ──────────────────────────────────────────────────────────────────
const COLOR_SOLD      = '#10B981';
const COLOR_RESERVED  = '#F59E0B';
const COLOR_AVAILABLE = '#6B7280';

const STATUS_META = {
  sold:      { label: 'مباع',     labelEn: 'Sold',      color: COLOR_SOLD,      tagVariant: 'green' },
  reserved:  { label: 'محجوز',    labelEn: 'Reserved',  color: COLOR_RESERVED,  tagVariant: 'amber' },
  available: { label: 'متاح',     labelEn: 'Available', color: COLOR_AVAILABLE, tagVariant: 'blue'  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtSAR = (v) =>
  v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(2)} م`
    : `${(v / 1_000).toFixed(0)} ألف`;

const fmtSARFull = (v) =>
  new Intl.NumberFormat('ar-SA', { style: 'decimal', maximumFractionDigits: 0 }).format(v) + ' ﷼';

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, border }) {
  return (
    <GlassCard className="flex flex-col gap-1" padding="p-4">
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color ?? 'var(--text-hi)', lineHeight: 1.1,
        borderInlineStart: border ? `3px solid ${border}` : undefined,
        paddingInlineStart: border ? 8 : 0,
      }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{sub}</div>}
    </GlassCard>
  );
}

function AgentCard({ agent, sold, reserved, soldValue }) {
  const initials = agent.split(' ').map(w => w[0]).join('').slice(0, 2);
  return (
    <GlassCard padding="p-4" className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div style={{
          width: 38, height: 38, borderRadius: '50%', background: 'var(--rasf-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 13, color: '#fff', flexShrink: 0,
        }}>{initials}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-hi)' }}>{agent}</div>
          <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>موظف مبيعات</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: COLOR_SOLD }}>{sold}</div>
          <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>مباع</div>
        </div>
        <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: COLOR_RESERVED }}>{reserved}</div>
          <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>محجوز</div>
        </div>
        <div className="rounded-lg p-2 text-center" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-faint)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-med)' }}>{fmtSAR(soldValue)}</div>
          <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>قيمة المبيعات</div>
        </div>
      </div>
    </GlassCard>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CommercialPageV1() {
  const [activeProject, setActiveProject] = useState('all');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [agentFilter,   setAgentFilter]   = useState('all');
  const [zoneFilter,    setZoneFilter]    = useState('all');

  const allUnits = useMemo(() => getAllUnits(), []);
  const stats    = useMemo(() => getPortfolioStats(), []);
  const agents   = useMemo(() => getAgentStats(), []);

  const currentProject = useMemo(
    () => activeProject === 'all' ? null : COMMERCIAL_PROJECTS.find(p => p.id === activeProject),
    [activeProject],
  );

  const filteredUnits = useMemo(() => {
    let units = activeProject === 'all' ? allUnits : allUnits.filter(u => u.projectId === activeProject);
    if (statusFilter !== 'all') units = units.filter(u => u.status === statusFilter);
    if (agentFilter  !== 'all') units = units.filter(u => u.agent === agentFilter);
    if (zoneFilter   !== 'all') units = units.filter(u => u.zone === zoneFilter);
    return units;
  }, [allUnits, activeProject, statusFilter, agentFilter, zoneFilter]);

  const availableZones = useMemo(() => {
    const base = activeProject === 'all' ? allUnits : allUnits.filter(u => u.projectId === activeProject);
    return [...new Set(base.map(u => u.zone).filter(Boolean))].sort();
  }, [allUnits, activeProject]);

  const availableAgents = useMemo(() => {
    const base = activeProject === 'all' ? allUnits : allUnits.filter(u => u.projectId === activeProject);
    return [...new Set(base.map(u => u.agent).filter(Boolean))].sort();
  }, [allUnits, activeProject]);

  const showZoneColumn = activeProject === 'all'
    ? allUnits.some(u => u.zone)
    : currentProject?.hasZones;

  const donutData = {
    labels: ['مباع', 'محجوز', 'متاح'],
    datasets: [{
      data: [stats.sold, stats.reserved, stats.available],
      backgroundColor: [COLOR_SOLD, COLOR_RESERVED, COLOR_AVAILABLE],
      borderWidth: 0, hoverOffset: 6,
    }],
  };
  const donutOptions = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: { legend: { display: false } },
  };

  const barData = {
    labels: COMMERCIAL_PROJECTS.map(p => p.name),
    datasets: [
      { label: 'مباع',  data: COMMERCIAL_PROJECTS.map(p => getProjectStats(p.id).sold),      backgroundColor: COLOR_SOLD,             borderRadius: 4, stack: 's' },
      { label: 'محجوز', data: COMMERCIAL_PROJECTS.map(p => getProjectStats(p.id).reserved),  backgroundColor: COLOR_RESERVED,         borderRadius: 4, stack: 's' },
      { label: 'متاح',  data: COMMERCIAL_PROJECTS.map(p => getProjectStats(p.id).available), backgroundColor: COLOR_AVAILABLE + '88', borderRadius: 4, stack: 's' },
    ],
  };
  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index' } },
    scales: {
      x: { stacked: true, ticks: { color: '#7A6E67', font: { family: 'Almarai', size: 10 } }, grid: { display: false }, border: { display: false } },
      y: { stacked: true, ticks: { color: '#7A6E67', stepSize: 5 }, grid: { color: 'rgba(71,53,48,0.08)' }, border: { display: false } },
    },
  };

  const sellPct = stats.sellThrough.toFixed(1);
  const tableStats = useMemo(() => ({
    count:     filteredUnits.length,
    soldValue: filteredUnits.filter(u => u.status === 'sold').reduce((s, u) => s + u.price, 0),
  }), [filteredUnits]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-hi)', margin: 0 }}>القطاع التجاري — المبيعات</h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {COMMERCIAL_PROJECTS.length} مشاريع · {stats.total} وحدة · آخر تحديث: يونيو 2026
          </div>
        </div>
        <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-faint)', borderRadius: 12, padding: '6px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
          بيانات تجريبية
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <StatCard label="إجمالي الوحدات"     value={stats.total}       sub={`${COMMERCIAL_PROJECTS.length} مشاريع`} />
        <StatCard label="وحدات مباعة"         value={stats.sold}        sub={fmtSAR(stats.soldValue)}     color={COLOR_SOLD}          border={COLOR_SOLD} />
        <StatCard label="وحدات محجوزة"        value={stats.reserved}    sub={fmtSAR(stats.reservedValue)} color={COLOR_RESERVED}      border={COLOR_RESERVED} />
        <StatCard label="وحدات متاحة"         value={stats.available}   sub="قيد العرض"                   color="var(--text-med)" />
        <StatCard label="نسبة الإشغال البيعي" value={`${sellPct}%`}    sub="مباع + محجوز"                color="var(--rasf-primary)" border="var(--rasf-primary)" />
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '280px 1fr' }}>
        <GlassCard padding="p-4" className="flex flex-col gap-3">
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-hi)' }}>توزيع حالات الوحدات</div>
          <div style={{ position: 'relative', height: 160 }}>
            <Doughnut data={donutData} options={donutOptions} plugins={[donutCenterPlugin]} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-hi)' }}>{sellPct}%</div>
              <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>إشغال</div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {[{ label: 'مباع', count: stats.sold, color: COLOR_SOLD }, { label: 'محجوز', count: stats.reserved, color: COLOR_RESERVED }, { label: 'متاح', count: stats.available, color: COLOR_AVAILABLE }].map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: row.color, display: 'inline-block' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.label}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-med)' }}>{row.count} وحدة</span>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard padding="p-4" className="flex flex-col gap-3">
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-hi)' }}>الوحدات حسب المشروع</div>
          <div style={{ flex: 1, height: 180 }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </GlassCard>
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 12 }}>أداء موظفي المبيعات</div>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {agents.map(a => <AgentCard key={a.agent} agent={a.agent} sold={a.sold} reserved={a.reserved} soldValue={a.soldValue} />)}
        </div>
      </div>

      <GlassCard padding="p-4">
        <div className="flex items-center gap-1 mb-4 flex-wrap">
          {[{ id: 'all', name: 'جميع المشاريع' }, ...COMMERCIAL_PROJECTS].map(p => (
            <button key={p.id} onClick={() => { setActiveProject(p.id); setZoneFilter('all'); setAgentFilter('all'); }}
              style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: activeProject === p.id ? 'var(--rasf-primary)' : 'var(--bg-subtle)', color: activeProject === p.id ? '#fff' : 'var(--text-muted)', border: activeProject === p.id ? '1px solid transparent' : '1px solid var(--border-faint)', transition: 'all .15s' }}>
              {p.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-1">
            {[{ key: 'all', label: 'الكل' }, { key: 'sold', label: 'مباع' }, { key: 'reserved', label: 'محجوز' }, { key: 'available', label: 'متاح' }].map(f => (
              <button key={f.key} onClick={() => setStatusFilter(f.key)}
                style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: statusFilter === f.key ? 'var(--bg-card-strong)' : 'transparent', color: statusFilter === f.key ? 'var(--text-hi)' : 'var(--text-faint)', border: statusFilter === f.key ? '1px solid var(--border-soft)' : '1px solid transparent' }}>
                {f.label}
              </button>
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
            {tableStats.count} وحدة
            {tableStats.soldValue > 0 && <span style={{ marginInlineStart: 8, color: COLOR_SOLD, fontWeight: 600 }}>· قيمة المبيعات: {fmtSARFull(tableStats.soldValue)}</span>}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[...(activeProject === 'all' ? [{ label: 'المشروع', width: 130 }] : []), ...(showZoneColumn ? [{ label: 'الزون', width: 60 }] : []), { label: 'المبنى', width: 70 }, { label: 'رقم الوحدة', width: 90 }, { label: 'الدور', width: 55 }, { label: 'المساحة م²', width: 80 }, { label: 'الجزء الخاص', width: 85 }, { label: 'الإجمالي م²', width: 80 }, { label: 'قيمة الوحدة', width: 110 }, { label: 'الحالة', width: 80 }, { label: 'موظف المبيعات', width: 120 }].map(col => (
                  <th key={col.label} style={{ padding: '8px 10px', textAlign: 'start', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', width: col.width }}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUnits.length === 0 ? (
                <tr><td colSpan={12} style={{ textAlign: 'center', padding: 32, color: 'var(--text-faint)' }}>لا توجد وحدات تطابق الفلتر المحدد</td></tr>
              ) : filteredUnits.map((u, i) => (
                <tr key={`${u.projectId}-${u.unitNo}-${i}`}
                  style={{ borderBottom: '1px solid var(--border-faint)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-subtle)', transition: 'background .12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-strong)'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--bg-subtle)'}>
                  {activeProject === 'all' && <td style={{ padding: '9px 10px', color: 'var(--text-med)', fontWeight: 600, whiteSpace: 'nowrap' }}>{u.projectName}</td>}
                  {showZoneColumn && <td style={{ padding: '9px 10px', color: 'var(--text-muted)' }}>{u.zone ? <span style={{ background: 'var(--rasf-primary-dim)', color: 'var(--rasf-primary)', borderRadius: 5, padding: '1px 8px', fontWeight: 700, fontSize: 11 }}>{u.zone}</span> : '—'}</td>}
                  <td style={{ padding: '9px 10px', color: 'var(--text-muted)' }}>{u.building}</td>
                  <td style={{ padding: '9px 10px', color: 'var(--text-hi)', fontWeight: 600 }}>{u.unitNo}</td>
                  <td style={{ padding: '9px 10px', color: 'var(--text-muted)' }}>{u.floor}</td>
                  <td style={{ padding: '9px 10px', color: 'var(--text-med)' }}>{u.area.toLocaleString('ar-SA')}</td>
                  <td style={{ padding: '9px 10px', color: 'var(--text-muted)' }}>{u.privateArea.toLocaleString('ar-SA')}</td>
                  <td style={{ padding: '9px 10px', color: 'var(--text-med)', fontWeight: 600 }}>{u.total.toLocaleString('ar-SA')}</td>
                  <td style={{ padding: '9px 10px', color: 'var(--rasf-primary)', fontWeight: 700, whiteSpace: 'nowrap' }}>{u.price.toLocaleString('ar-SA')} ﷼</td>
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
