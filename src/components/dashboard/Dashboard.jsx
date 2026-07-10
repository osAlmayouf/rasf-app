import { useState } from 'react';
import { useApp } from '../../contexts/useApp';
import { fmtPct } from '../../utils/fmt';
import { fmtSARMode, fmtSARFull } from '../../utils/fmtMode';
import KPICard          from './KPICard';
import PortfolioChart   from './PortfolioChart';
import SectorPanel      from './SectorPanel';
import ProjectsTable    from './ProjectsTable';
import RecentNotes      from './RecentNotes';
import SARSymbol        from '../common/SARSymbol';
import PipelineDashboard from '../pipeline/PipelineDashboard';
import PipelinePage     from '../pipeline/PipelinePage';
import NewProjectModal  from '../common/NewProjectModal';
import { Plus }        from 'lucide-react';

export default function Dashboard() {
  const { t, lang, portfolioService, displayMode } = useApp();
  const [activeTab, setActiveTab] = useState('active');
  const [showNewModal, setShowNewModal] = useState(false);

  const kpis        = portfolioService.getKPIs();
  const isAr        = lang === 'ar';
  const isThousands = displayMode === 'thousands';

  // ── Total portfolio value — mode-aware ──────────────────────────────────
  const totalM       = kpis.totalValueM;
  const totalDisplay = fmtSARMode(totalM, displayMode);
  const totalTooltip = isThousands ? fmtSARFull(totalM, lang) : undefined;

  const totalUnit = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {isThousands ? t('k1u') : (isAr ? 'ريال' : 'SAR')}
      <SARSymbol size="0.9em" style={{ opacity: 0.75 }} />
    </span>
  );

  // ── Progress values ─────────────────────────────────────────────────────
  const valueProgress = Math.min(Math.round((kpis.quarterGrowth / 20) * 100), 100);
  const roiProgress   = Math.min(Math.round(parseFloat(kpis.averageROI)), 100);
  const irrProgress   = Math.min(Math.round((parseFloat(kpis.averageIRR) / 35) * 100), 100);
  const roeProgress   = Math.min(Math.round((parseFloat(kpis.averageROEAnnual) / 40) * 100), 100);
  const gbaProgress   = Math.min(Math.round((parseInt(kpis.totalAboveGradeGBA.replace(/,/g, ''), 10) / 500000) * 100), 100);
  const projProgress  = kpis.projectCount > 0
    ? Math.round((kpis.underExecution / kpis.projectCount) * 100)
    : 0;

  const cards = [
    {
      label: t('k1l'),
      value: totalDisplay,
      unit: totalUnit,
      tooltip: totalTooltip,
      trend: t('k1t'), trendColor: 'var(--text-muted)',
      progress: valueProgress,
    },
    {
      label: t('k2l'), value: fmtPct(kpis.averageROI), unit: 'ROI',
      trend: t('k2t'), trendColor: 'var(--text-muted)',
      progress: roiProgress,
    },
    {
      label: t('k3l'), value: fmtPct(kpis.averageIRR), unit: 'IRR',
      trend: t('k3t'), trendColor: 'var(--text-muted)',
      progress: irrProgress, valueClass: 'gold',
    },
    {
      label: t('k5l'), value: fmtPct(kpis.averageROEAnnual), unit: 'ROE',
      trend: t('k5t'), trendColor: 'var(--text-muted)',
      progress: roeProgress,
    },
    {
      label: t('k6l'), value: kpis.totalAboveGradeGBA, unit: t('k6u'),
      trend: t('k6t'), trendColor: 'var(--text-muted)',
      progress: gbaProgress,
    },
    {
      label: t('k4l'), value: kpis.projectCount, unit: t('k4u'),
      trend: `${kpis.underExecution} ${t('k4t')}`, trendColor: 'var(--text-muted)',
      progress: projProgress,
    },
  ];

  const TABS = [
    { key: 'active',   label: t('nDashPortfolio') },
    { key: 'pipeline', label: t('nPipelineDash')  },
  ];

  return (
    <div>
      {/* Tab switcher + new project button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div
          style={{
            display: 'inline-flex', gap: 2,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 10, padding: 4,
          }}
        >
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '6px 20px', borderRadius: 7, fontSize: 13, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all .18s',
                background: activeTab === tab.key ? 'var(--rasf-primary)' : 'transparent',
                color: activeTab === tab.key ? 'var(--bg-app)' : 'var(--text-muted)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'pipeline' && (
          <button
            onClick={() => setShowNewModal(true)}
            style={{
              background: 'var(--rasf-primary)', color: 'var(--bg-app)',
              borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 800,
              cursor: 'pointer', border: 'none', transition: 'opacity .18s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Plus size={14} />
            {t('tbNew')}
          </button>
        )}
      </div>

      {showNewModal && (
        <NewProjectModal
          onClose={() => setShowNewModal(false)}
          defaultStatus="pipeline"
        />
      )}

      {/* Tab content */}
      {activeTab === 'active' ? (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-6 gap-3 mb-6">
            {cards.map((c, i) => <KPICard key={i} {...c} />)}
          </div>

          {/* Charts Row */}
          <div className="grid gap-5 mb-6" style={{ gridTemplateColumns: '2fr 1fr' }}>
            <PortfolioChart />
            <SectorPanel />
          </div>

          {/* Notes (full width) above the projects table */}
          <div className="mb-6">
            <RecentNotes />
          </div>
          <ProjectsTable />
        </>
      ) : (
        <div className="flex flex-col gap-6">
          <PipelineDashboard />
          <div style={{ height: 1, background: 'var(--border-faint)' }} />
          <PipelinePage />
        </div>
      )}
    </div>
  );
}
