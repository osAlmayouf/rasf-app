import { Bar } from 'react-chartjs-2';
import { useState } from 'react';
import { useApp } from '../../contexts/useApp';
import { fmtYMode } from '../../utils/fmtMode';
import GlassCard from '../common/GlassCard';

const TARGET_ROE   = 14.5;
const SECONDARY    = '#8A6D51';                 // كراميل غامق (ثانوي على الهوية)
const TARGET_COLOR = 'rgba(193,122,106,0.8)';   // تيراكوتا لخط المستهدف

const VIEWS = [
  { key: 'returns', ar: 'المؤشرات',          en: 'Returns' },
  { key: 'revenue', ar: 'الاستثمار/الإيراد', en: 'Inv/Rev' },
];

const truncate = (s, n = 14) => (s && s.length > n ? s.slice(0, n - 1) + '…' : (s ?? ''));

// خط أفقي عند الحد المستهدف (لعرض المؤشرات)
const targetLinePlugin = {
  id: 'roeTarget',
  afterDatasetsDraw(chart) {
    const y = chart.scales.y;
    if (!y) return;
    const yPos = y.getPixelForValue(TARGET_ROE);
    const { left, right } = chart.chartArea;
    const { ctx } = chart;
    ctx.save();
    ctx.strokeStyle = TARGET_COLOR;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(left, yPos);
    ctx.lineTo(right, yPos);
    ctx.stroke();
    ctx.restore();
  },
};

export default function PortfolioChart() {
  const { lang, portfolioService, displayMode } = useApp();
  const [showInfo, setShowInfo] = useState(false);
  const [view, setView] = useState('returns');
  const isAr = lang === 'ar';

  const projects = [...portfolioService.getAllProjects()];

  const styles       = getComputedStyle(document.documentElement);
  const brandPrimary = styles.getPropertyValue('--rasf-primary').trim() || '#CEB69F';
  const gridColor    = styles.getPropertyValue('--border').trim() || '#1e293b';
  const tickColor    = '#7A6E67';

  const axis = (yCallback) => ({
    x: { ticks: { color: tickColor, font: { size: 10, weight: '500' }, maxRotation: 30, minRotation: 0 }, grid: { display: false }, border: { display: false } },
    y: { ticks: { color: tickColor, font: { size: 10 }, callback: yCallback }, grid: { color: gridColor, drawBorder: false }, border: { display: false } },
  });

  const money = v => fmtYMode(v, displayMode);

  // ── بناء بيانات كل عرض ─────────────────────────────────────────────────
  let chartData, chartOptions, chartEl, legend, footer, subtitle;

  if (view === 'returns') {
    const rows = projects.map(p => ({ name: p.name, roe: p.roeAnnual ?? 0, irr: p.irr ?? 0 })).sort((a, b) => b.roe - a.roe);
    chartData = {
      labels: rows.map(p => truncate(p.name)),
      datasets: [
        { label: isAr ? 'ROE سنوي' : 'Annual ROE', data: rows.map(p => p.roe), backgroundColor: brandPrimary, borderRadius: 5 },
        { label: 'IRR', data: rows.map(p => p.irr), backgroundColor: SECONDARY, borderRadius: 5 },
      ],
    };
    chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${Number(c.raw).toFixed(1)}%` } } }, scales: axis(v => `${v}%`) };
    chartEl = <Bar data={chartData} options={chartOptions} plugins={[targetLinePlugin]} />;
    legend = [
      { color: brandPrimary, label: 'ROE' },
      { color: SECONDARY, label: 'IRR' },
      { color: TARGET_COLOR, label: isAr ? 'المستهدف' : 'Target', dashed: true },
    ];
    const top = rows[0];
    const avgRoe = rows.length ? rows.reduce((s, p) => s + p.roe, 0) / rows.length : 0;
    const below = rows.filter(p => p.roe < TARGET_ROE).length;
    footer = [
      { label: isAr ? 'أعلى عائد' : 'Top ROE', value: top ? `${top.roe.toFixed(1)}%` : '—', color: 'var(--rasf-primary)', sub: top ? truncate(top.name, 16) : '' },
      { label: isAr ? 'متوسط ROE' : 'Avg ROE', value: `${avgRoe.toFixed(1)}%`, color: 'var(--rasf-primary)' },
      { label: isAr ? 'دون المستهدف' : 'Below target', value: below, color: below ? '#C17A6A' : 'var(--rasf-primary)' },
    ];
    subtitle = isAr ? 'مقارنة عوائد المشاريع القائمة — ROE و IRR' : 'Active project returns — ROE & IRR';

  } else {
    const rows = projects.map(p => ({ name: p.name, inv: p.investmentM ?? 0, rev: p.costs?.totalRevenue ?? 0 })).sort((a, b) => b.rev - a.rev);
    chartData = {
      labels: rows.map(p => truncate(p.name)),
      datasets: [
        { label: isAr ? 'الاستثمار' : 'Investment', data: rows.map(p => p.inv), backgroundColor: brandPrimary, borderRadius: 5 },
        { label: isAr ? 'الإيراد المتوقع' : 'Expected revenue', data: rows.map(p => p.rev), backgroundColor: SECONDARY, borderRadius: 5 },
      ],
    };
    chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${money(c.raw)}` } } }, scales: axis(money) };
    chartEl = <Bar data={chartData} options={chartOptions} />;
    legend = [
      { color: brandPrimary, label: isAr ? 'الاستثمار' : 'Investment' },
      { color: SECONDARY, label: isAr ? 'الإيراد المتوقع' : 'Expected revenue' },
    ];
    const totalInv = rows.reduce((s, p) => s + p.inv, 0);
    const totalRev = rows.reduce((s, p) => s + p.rev, 0);
    const profit = totalRev - totalInv;
    footer = [
      { label: isAr ? 'إجمالي الاستثمار' : 'Total investment', value: money(totalInv), color: 'var(--rasf-primary)' },
      { label: isAr ? 'إجمالي الإيراد' : 'Total revenue', value: money(totalRev), color: SECONDARY },
      { label: isAr ? 'صافي الربح المتوقع' : 'Expected profit', value: money(profit), color: profit >= 0 ? 'var(--rasf-primary)' : '#C17A6A' },
    ];
    subtitle = isAr ? 'الاستثمار مقابل الإيراد المتوقع لكل مشروع' : 'Investment vs expected revenue per project';
  }

  const EXPLAIN = {
    returns: isAr ? 'مقارنة ROE و IRR لكل مشروع قائم، مرتّبة تنازليًا. الخط المتقطّع = الحد المستهدف (14.5%).' : 'ROE & IRR per active project, sorted. Dashed line = 14.5% target.',
    revenue: isAr ? 'الاستثمار مقابل الإيراد المتوقع لكل مشروع — الفرق يمثّل الربح المتوقع.' : 'Investment vs expected revenue per project — the gap is expected profit.',
  };

  return (
    <GlassCard>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="section-hd">{isAr ? 'أداء المحفظة' : 'Portfolio Performance'}</div>
          <div className="section-sub">{subtitle}</div>
        </div>
        <button
          onClick={() => setShowInfo(v => !v)}
          style={{ color: showInfo ? 'var(--rasf-primary)' : 'var(--text-faint)', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 5px' }}
        >
          ⓘ
        </button>
      </div>

      {/* ── View switcher + legend ──────────────────────────────────────── */}
      <div className="flex justify-between items-center gap-2 mb-3 flex-wrap">
        <div style={{ display: 'inline-flex', gap: 2, background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 9, padding: 3 }}>
          {VIEWS.map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              style={{
                padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all .15s',
                background: view === v.key ? 'var(--rasf-primary)' : 'transparent',
                color: view === v.key ? 'var(--bg-app)' : 'var(--text-muted)',
              }}
            >
              {isAr ? v.ar : v.en}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {legend.map(l => (
            <span key={l.label} className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--text-lo)' }}>
              <span style={l.dashed
                ? { width: 16, height: 0, display: 'inline-block', borderTop: `2px dashed ${l.color}` }
                : { width: 10, height: 10, display: 'inline-block', borderRadius: 3, background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Info panel ──────────────────────────────────────────────────── */}
      {showInfo && (
        <div className="rounded-xl p-3 mb-3 text-xs"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-tag-warm)', color: 'var(--text-muted)', lineHeight: 1.65 }}>
          {EXPLAIN[view]}
        </div>
      )}

      {/* ── Chart ───────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: 200 }}>
        {chartEl}
      </div>

      {/* ── Footer stats ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mt-4 text-center">
        {footer.map(f => (
          <div key={f.label} className="glass rounded-xl py-2.5 px-3">
            <div style={{ color: '#7A6E67', fontSize: 10, marginBottom: 2 }}>{f.label}</div>
            <div style={{ color: f.color, fontWeight: 700, fontSize: 13 }}>{f.value}</div>
            {f.sub && (
              <div style={{ color: 'var(--text-muted)', fontSize: 9, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.sub}</div>
            )}
          </div>
        ))}
      </div>

    </GlassCard>
  );
}
