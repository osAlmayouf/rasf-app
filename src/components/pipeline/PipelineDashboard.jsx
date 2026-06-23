import { Bar } from 'react-chartjs-2';
import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Tooltip, Legend,
} from 'chart.js';
import { useApp } from '../../contexts/useApp';
import { fmtPct } from '../../utils/fmt';
import { fmtSARMode, addUnit } from '../../utils/fmtMode';
import KPICard    from '../dashboard/KPICard';
import GlassCard  from '../common/GlassCard';
import SARSymbol  from '../common/SARSymbol';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Returns years that have at least one pipeline/archived project with opportunityDate
function getAvailableYears(allProjects) {
  const yearSet = new Set();
  allProjects.forEach(p => {
    if (p.status !== 'pipeline' && p.status !== 'archived') return;
    if (!p.opportunityDate) return;
    const d = new Date(p.opportunityDate);
    if (!isNaN(d)) yearSet.add(d.getFullYear());
  });
  // Always include current year so selector is never empty
  yearSet.add(new Date().getFullYear());
  return [...yearSet].sort((a, b) => b - a);
}

function buildOpportunityChart(allProjects, year, lang) {
  const MONTHS = lang === 'ar' ? MONTHS_AR : MONTHS_EN;

  // Build 12-month skeleton for the selected year
  const statMap = {};
  for (let m = 1; m <= 12; m++) {
    statMap[String(m).padStart(2, '0')] = { pipeline: 0, archived: 0 };
  }

  allProjects.forEach(p => {
    if (p.status !== 'pipeline' && p.status !== 'archived') return;
    if (!p.opportunityDate) return;
    const d = new Date(p.opportunityDate);
    if (isNaN(d) || d.getFullYear() !== year) return;
    const mKey = String(d.getMonth() + 1).padStart(2, '0');
    if (p.status === 'pipeline') statMap[mKey].pipeline++;
    else                         statMap[mKey].archived++;
  });

  const labels = Object.keys(statMap).sort().map(m => MONTHS[parseInt(m) - 1]);

  return {
    labels,
    datasets: [
      {
        label: lang === 'ar' ? 'تحت الدراسة' : 'Pipeline',
        data: Object.keys(statMap).sort().map(m => statMap[m].pipeline),
        backgroundColor: '#A4907E',
        borderRadius: 5,
        stack: 'stack',
      },
      {
        label: lang === 'ar' ? 'مؤرشفة' : 'Archived',
        data: Object.keys(statMap).sort().map(m => statMap[m].archived),
        backgroundColor: '#3D2E24',
        borderRadius: 5,
        stack: 'stack',
      },
    ],
  };
}

const BAR_OPTS = (suffix = '') => ({
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: { label: ctx => `${ctx.parsed.x.toLocaleString('en-US')}${suffix}` },
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(160,128,112,0.08)' },
      ticks: { color: '#8A7D74', font: { size: 10 }, maxTicksLimit: 5 },
      border: { display: false },
    },
    y: {
      grid: { display: false },
      ticks: { color: '#C5B5A5', font: { size: 11 } },
      border: { display: false },
    },
  },
});

export default function PipelineDashboard() {
  const { t, lang, portfolioService, setPage, setSelectedProjectId, displayMode } = useApp();
  const fmt = (v) => fmtSARMode(v, displayMode);
  const projects = portfolioService.getPipelineProjects();

  // Pipeline + archived for the opportunity timeline
  const studiedProjects = [
    ...portfolioService.getPipelineProjects(),
    ...portfolioService.getArchivedProjects(),
  ];
  const availableYears  = getAvailableYears(studiedProjects);
  const [selectedYear, setSelectedYear] = useState(() => {
    const cur = new Date().getFullYear();
    return availableYears.includes(cur) ? cur : (availableYears[0] ?? cur);
  });

  const yearTotal = studiedProjects.filter(p => {
    if (!p.opportunityDate) return false;
    return new Date(p.opportunityDate).getFullYear() === selectedYear;
  }).length;

  const oppChartData = buildOpportunityChart(studiedProjects, selectedYear, lang);

  const count    = projects.length;
  const totalInv = projects.reduce((s, p) => s + (p.investmentM || 0), 0);
  const avgIRR   = count > 0 ? projects.reduce((s, p) => s + (p.irr  || 0), 0) / count : 0;
  const avgROI   = count > 0 ? projects.reduce((s, p) => s + (p.roi  || 0), 0) / count : 0;

  const sarUnit = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {displayMode === 'thousands' ? (lang === 'ar' ? 'ألف' : 'K') : (lang === 'ar' ? 'ريال' : 'SAR')}
      <SARSymbol size="0.85em" style={{ opacity: 0.75 }} />
    </span>
  );

  const kpiCards = [
    {
      label: t('plCount'),
      value: count,
      unit: lang === 'ar' ? 'مشروع' : 'projects',
    },
    {
      label: addUnit(t('plTotalInv'), displayMode, lang),
      value: fmt(totalInv),
      unit: sarUnit,
    },
    {
      label: lang === 'ar' ? 'متوسط IRR المتوقع' : 'Average Expected IRR',
      value: fmtPct(avgIRR),
      unit: 'IRR',
      valueClass: 'gold',
    },
    {
      label: lang === 'ar' ? 'متوسط ROI المتوقع' : 'Average Expected ROI',
      value: fmtPct(avgROI),
      unit: 'ROI',
    },
  ];

  const labels     = projects.map(p => p.name);
  const barHeight  = Math.max(180, count * 56);

  const invData = {
    labels,
    datasets: [{
      data: projects.map(p => p.investmentM || 0),
      backgroundColor: '#A4907E',
      borderRadius: 5,
      barThickness: 22,
    }],
  };

  const irrData = {
    labels,
    datasets: [{
      data: projects.map(p => p.irr || 0),
      backgroundColor: '#6B5545',
      borderRadius: 5,
      barThickness: 22,
    }],
  };

  const openProject = (id) => {
    setSelectedProjectId(id);
    setPage('project');
  };

  if (count === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 18, opacity: 0.3 }}>🔍</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 8 }}>
          {t('pipelineEmpty')}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {lang === 'ar' ? 'أضف مشاريع من صفحة مشاريع تحت الدراسة' : 'Add projects from the Pipeline page'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        {kpiCards.map((c, i) => <KPICard key={i} {...c} />)}
      </div>

      {/* Charts row */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>

        <GlassCard>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-hi)', marginBottom: 16 }}>
            {lang === 'ar' ? 'مقارنة حجم الاستثمار (مليون ريال)' : 'Investment Comparison (SAR M)'}
          </div>
          <div style={{ height: barHeight }}>
            <Bar data={invData} options={BAR_OPTS(' م')} />
          </div>
        </GlassCard>

        <GlassCard>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-hi)', marginBottom: 16 }}>
            {lang === 'ar' ? 'مقارنة معدل العائد الداخلي IRR (%)' : 'IRR Comparison (%)'}
          </div>
          <div style={{ height: barHeight }}>
            <Bar data={irrData} options={BAR_OPTS('%')} />
          </div>
        </GlassCard>

      </div>

      {/* Opportunity timeline chart */}
      <GlassCard>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-hi)', marginBottom: 4 }}>
              {lang === 'ar' ? 'المشاريع المدروسة حسب الشهر' : 'Projects Studied by Month'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {lang === 'ar'
                ? `${yearTotal} مشروع تم تسجيله في ${selectedYear} — تحت الدراسة والمؤرشفة فقط`
                : `${yearTotal} project(s) recorded in ${selectedYear} — pipeline & archived only`}
            </div>
          </div>

          {/* Year selector */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {availableYears.map(yr => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                style={{
                  padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  border: `1px solid ${selectedYear === yr ? 'var(--rasf-primary)' : 'var(--border)'}`,
                  background: selectedYear === yr ? 'var(--rasf-primary-dim)' : 'var(--bg-app)',
                  color: selectedYear === yr ? 'var(--rasf-primary)' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all .15s',
                }}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: 220 }}>
          <Bar
            data={oppChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  position: 'top',
                  align: 'end',
                  labels: { color: '#8A7D74', font: { size: 10 }, boxWidth: 10, padding: 12 },
                },
                tooltip: {
                  callbacks: {
                    footer: (items) => {
                      const total = items.reduce((s, i) => s + i.parsed.y, 0);
                      return total > 0
                        ? (lang === 'ar' ? `الإجمالي: ${total} مشروع` : `Total: ${total}`)
                        : '';
                    },
                  },
                },
              },
              scales: {
                x: {
                  stacked: true,
                  grid: { display: false },
                  ticks: { color: '#8A7D74', font: { size: 10 } },
                  border: { display: false },
                },
                y: {
                  stacked: true,
                  grid: { color: 'rgba(160,128,112,0.08)' },
                  ticks: { color: '#8A7D74', font: { size: 10 }, stepSize: 1, precision: 0 },
                  border: { display: false },
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>
      </GlassCard>

      {/* Detailed comparison table */}
      <GlassCard>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-hi)', marginBottom: 16 }}>
          {lang === 'ar' ? 'مقارنة تفصيلية للمشاريع' : 'Detailed Project Comparison'}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--bg-card-strong)' }}>
                {[
                  lang === 'ar' ? 'المشروع'    : 'Project',
                  lang === 'ar' ? 'الموقع'     : 'Location',
                  addUnit(lang === 'ar' ? 'الاستثمار'  : 'Investment',  displayMode, lang),
                  'IRR',
                  'ROI',
                  'ROE سنوي',
                  addUnit(lang === 'ar' ? 'صافي الربح' : 'Net Profit',  displayMode, lang),
                  addUnit(lang === 'ar' ? 'الإيراد'    : 'Revenue',     displayMode, lang),
                  'MOIC',
                  lang === 'ar' ? 'مدة الاسترداد' : 'Payback',
                  lang === 'ar' ? 'الوحدات'       : 'Units',
                ].map((h, i) => (
                  <th key={i} style={{
                    textAlign: 'right', padding: '10px 14px',
                    fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
                    whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map(p => {
                const np       = p.costs?.netProfit    ?? 0;
                const rev      = p.costs?.totalRevenue ?? 0;
                const cost     = p.costs?.totalCost    ?? (p.investmentM * 1000);
                const moic     = cost > 0 ? `${(rev / cost).toFixed(2)}x` : '—';

                return (
                  <tr
                    key={p.id}
                    style={{ borderBottom: '1px solid var(--border-faint)', cursor: 'pointer', transition: 'background .12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => openProject(p.id)}
                  >
                    <td style={{ padding: '11px 14px', fontWeight: 700, color: 'var(--rasf-primary)', whiteSpace: 'nowrap' }}>
                      {p.name} →
                    </td>
                    <td style={{ padding: '11px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {p.location}
                    </td>
                    <td style={{ padding: '11px 14px', fontWeight: 600, color: 'var(--text-hi)', whiteSpace: 'nowrap' }}>
                      {fmt(p.investmentM)}
                    </td>
                    <td style={{ padding: '11px 14px', fontWeight: 700, color: '#a78bfa', whiteSpace: 'nowrap' }}>
                      {fmtPct(p.irr)}
                    </td>
                    <td style={{ padding: '11px 14px', fontWeight: 700, color: '#10b981', whiteSpace: 'nowrap' }}>
                      {fmtPct(p.roi)}
                    </td>
                    <td style={{ padding: '11px 14px', color: '#10b981', whiteSpace: 'nowrap' }}>
                      {fmtPct(p.roeAnnual)}
                    </td>
                    <td style={{ padding: '11px 14px', fontWeight: 600, color: np > 0 ? '#10b981' : '#ef4444', whiteSpace: 'nowrap' }}>
                      {fmt(np)}
                    </td>
                    <td style={{ padding: '11px 14px', color: 'var(--text-hi)', whiteSpace: 'nowrap' }}>
                      {fmt(rev)}
                    </td>
                    <td style={{ padding: '11px 14px', color: 'var(--rasf-primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {moic}
                    </td>
                    <td style={{ padding: '11px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {p.paybackYears ? `${p.paybackYears} ${lang === 'ar' ? 'سنة' : 'yr'}` : '—'}
                    </td>
                    <td style={{ padding: '11px 14px', color: 'var(--text-hi)', whiteSpace: 'nowrap' }}>
                      {p.units ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Totals row */}
            <tfoot>
              <tr style={{ background: 'var(--bg-card-strong)', borderTop: '2px solid var(--border)' }}>
                <td colSpan={2} style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-muted)', fontSize: 11 }}>
                  {lang === 'ar' ? 'الإجمالي / المتوسط' : 'Total / Average'}
                </td>
                <td style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--rasf-primary)' }}>
                  {fmt(totalInv)}
                </td>
                <td style={{ padding: '10px 14px', fontWeight: 800, color: '#a78bfa' }}>
                  {fmtPct(avgIRR)}
                </td>
                <td style={{ padding: '10px 14px', fontWeight: 800, color: '#10b981' }}>
                  {fmtPct(avgROI)}
                </td>
                <td colSpan={6} />
              </tr>
            </tfoot>
          </table>
        </div>
      </GlassCard>

    </div>
  );
}
