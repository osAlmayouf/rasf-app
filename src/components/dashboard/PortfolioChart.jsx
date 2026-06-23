import { Line } from 'react-chartjs-2';
import { useState } from 'react';
import { useApp } from '../../contexts/useApp';
import { fmtYMode } from '../../utils/fmtMode';
import GlassCard from '../common/GlassCard';

/* ── Explanatory text ───────────────────────────────────────────────────────── */
const EXPLAIN = {
  ar: [
    {
      title: 'ما الذي يقيسه هذا الرسم؟',
      body:  'الصافي التراكمي = مجموع (الإيرادات − المصروفات) من جميع المشاريع منذ 2024. القيمة السالبة = مرحلة الاستثمار. عند تقاطع الصفر = نقطة التعادل. القيمة الموجبة = مرحلة الربح.',
    },
    {
      title: 'الخط المتصل مقابل المنقّط',
      body:  'الخط المتصل يمثّل البيانات الفعلية (2024–2026). الخط المنقّط يمثّل التوقعات بناءً على التدفقات النقدية المحسوبة في الدراسات (2027–2030).',
    },
  ],
  en: [
    {
      title: 'What does this chart measure?',
      body:  'Cumulative net = sum of (revenues − expenses) across all projects since 2024. Negative = investment phase. Zero crossing = breakeven. Positive = profit phase.',
    },
    {
      title: 'Solid vs dashed line',
      body:  'The solid line represents actual data (2024–2026). The dashed line represents projections based on the study cash flows (2027–2030).',
    },
  ],
};

/* ── Chart.js glow plugin ───────────────────────────────────────────────────── */
const glowPlugin = {
  id: 'rasf-glow',
  beforeDatasetsDraw(chart) {
    chart.ctx.save();
    chart.ctx.shadowColor = 'rgba(164,144,126,0.35)';
    chart.ctx.shadowBlur  = 12;
  },
  afterDatasetsDraw(chart) { chart.ctx.restore(); },
};

function getGridColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#1e293b';
}

/* ── Component ──────────────────────────────────────────────────────────────── */
export default function PortfolioChart() {
  const { t, lang, portfolioService, displayMode } = useApp();
  const [showInfo, setShowInfo] = useState(false);

  const yearlyData  = portfolioService.getYearlyPortfolioData();
  const labels      = yearlyData.map(d => d.year);
  const currentYear = String(new Date().getFullYear());
  const currentIdx  = yearlyData.findIndex(d => d.year === currentYear);

  // Past/present: solid line (2024 → currentYear)
  const pastSeries = yearlyData.map((d, i) =>
    i <= currentIdx ? d.cumNet : null,
  );

  // Future projection: dashed line (currentYear → 2030), shared first point
  const futureSeries = yearlyData.map((d, i) =>
    i >= currentIdx ? d.cumNet : null,
  );

  const gridColor = getGridColor();
  const tickColor = '#7A6E67';
  const isAr = lang === 'ar';

  const BASE_DATASET = {
    pointRadius: 4,
    pointHoverRadius: 6,
    pointBorderWidth: 2.5,
    tension: 0.35,
    fill: false,
  };

  const data = {
    labels,
    datasets: [
      {
        ...BASE_DATASET,
        label:                isAr ? 'الفعلي' : 'Actual',
        data:                 pastSeries,
        borderColor:          '#A4907E',
        pointBackgroundColor: '#A4907E',
        pointBorderColor:     'rgba(164,144,126,0.3)',
        backgroundColor:      'rgba(164,144,126,0.08)',
        borderWidth:          2.5,
        fill:                 true,
      },
      {
        ...BASE_DATASET,
        label:                isAr ? 'توقعات' : 'Projected',
        data:                 futureSeries,
        borderColor:          'rgba(164,144,126,0.45)',
        pointBackgroundColor: 'rgba(164,144,126,0.45)',
        pointBorderColor:     'rgba(164,144,126,0.15)',
        backgroundColor:      'transparent',
        borderWidth:          2,
        borderDash:           [6, 4],
      },
    ],
  };

  const OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    spanGaps: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks:  { color: tickColor, font: { size: 11, weight: '500' } },
        grid:   { color: gridColor, drawBorder: false },
        border: { display: false },
      },
      y: {
        ticks: {
          color: tickColor,
          font: { size: 10 },
          callback: v => fmtYMode(v, displayMode),
        },
        grid: {
          color: ctx => ctx.tick.value === 0
            ? 'rgba(180,180,180,0.35)'
            : gridColor,
          lineWidth: ctx => ctx.tick.value === 0 ? 1.5 : 1,
          drawBorder: false,
        },
        border: { display: false },
      },
    },
  };

  // Footer stats — mode-aware formatting (no M/B abbreviations)
  const fmtStat = (v) => {
    if (v == null) return '—';
    return fmtYMode(v, displayMode);
  };

  const last    = yearlyData[yearlyData.length - 1];
  const current = yearlyData[currentIdx];
  const breakEvenYear = yearlyData.find(d => d.cumNet >= 0)?.year ?? '—';

  // Subtitle shows the correct unit based on display mode
  const chartSubUnit = displayMode === 'full'
    ? (isAr ? '(ريال)' : '(SAR)')
    : (isAr ? '(ألف ريال)' : '(SAR 000)');
  const chartSub = isAr
    ? `الصافي التراكمي للتدفقات النقدية ${chartSubUnit} — 2024 إلى 2030`
    : `Cumulative net cash flows ${chartSubUnit} — 2024 to 2030`;

  return (
    <GlassCard>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="section-hd">{t('dCh1t')}</div>
          <div className="section-sub">{chartSub}</div>
        </div>
        <div className="flex items-center gap-2">
          {/* Legend */}
          <span className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--text-lo)' }}>
            <span style={{ width: 16, height: 2.5, background: 'var(--rasf-primary)', display: 'inline-block', borderRadius: 2 }} />
            {isAr ? 'فعلي' : 'Actual'}
          </span>
          <span className="flex items-center gap-1.5" style={{ fontSize: 11, color: '#7A6E67' }}>
            <span style={{
              width: 16, height: 0, display: 'inline-block',
              borderTop: '2.5px dashed rgba(164,144,126,0.55)',
            }} />
            {isAr ? 'توقعات' : 'Projected'}
          </span>
          <button
            onClick={() => setShowInfo(v => !v)}
            style={{ color: showInfo ? 'var(--rasf-primary)' : 'var(--text-faint)', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 5px' }}
          >
            ⓘ
          </button>
        </div>
      </div>

      {/* ── Info panel ──────────────────────────────────────────────────── */}
      {showInfo && (
        <div className="rounded-xl p-3 mb-4 space-y-2 text-xs"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-tag-warm)' }}>
          {EXPLAIN[lang].map(item => (
            <div key={item.title}>
              <div className="font-semibold mb-0.5" style={{ color: 'var(--rasf-primary)' }}>{item.title}</div>
              <div style={{ color: 'var(--text-muted)', lineHeight: 1.65 }}>{item.body}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Chart ───────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: 200 }}>
        <Line data={data} options={OPTIONS} plugins={[glowPlugin]} />
      </div>

      {/* ── Footer stats ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mt-4 text-center">
        <div className="glass rounded-xl py-2.5 px-3">
          <div style={{ color: '#7A6E67', fontSize: 10, marginBottom: 2 }}>
            {isAr ? 'الوضع الحالي' : 'Current'}
          </div>
          <div style={{ color: current?.cumNet >= 0 ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: 13 }}>
            {fmtStat(current?.cumNet)}
          </div>
        </div>
        <div className="glass rounded-xl py-2.5 px-3">
          <div style={{ color: '#7A6E67', fontSize: 10, marginBottom: 2 }}>
            {isAr ? 'نقطة التعادل' : 'Breakeven'}
          </div>
          <div style={{ color: 'var(--rasf-primary)', fontWeight: 700, fontSize: 13 }}>
            {breakEvenYear}
          </div>
        </div>
        <div className="glass rounded-xl py-2.5 px-3">
          <div style={{ color: '#7A6E67', fontSize: 10, marginBottom: 2 }}>
            {isAr ? 'العائد المتوقع 2030' : 'Expected 2030'}
          </div>
          <div style={{ color: '#10b981', fontWeight: 700, fontSize: 13 }}>
            {fmtStat(last?.cumNet)}
          </div>
        </div>
      </div>

    </GlassCard>
  );
}
