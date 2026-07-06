import { useState } from 'react';
import { fmtPct } from '../../utils/fmt';
import { Doughnut } from 'react-chartjs-2';
import { useApp } from '../../contexts/useApp';
import GlassCard from '../common/GlassCard';
import { donutCenterPlugin, RASF_CHART_COLORS } from '../../utils/chartColors';

const DOUGHNUT_OPTIONS = {
  responsive: true, maintainAspectRatio: false, cutout: '70%',
  plugins: { legend: { display: false } },
};

const SENS_EXPLAIN = {
  ar: {
    method: 'طريقة الحساب: يُطبَّق تغيير موحّد على متوسط العائد السنوي على حقوق الملاك (ROE سنوي) للمحفظة:',
    rows: [
      { label: 'متشائم', calc: 'ROE السنوي × 0.90', note: 'افتراض تراجع الإيرادات 10%' },
      { label: 'طبيعي',  calc: 'ROE السنوي × 1.00', note: 'التوقعات الأساسية' },
      { label: 'متفائل', calc: 'ROE السنوي × 1.10', note: 'افتراض نمو الإيرادات 10%' },
    ],
    footer: 'المتغير الوحيد هو معدل الإيرادات — يبقى هيكل التكاليف وحقوق الملاك ثابتَين في جميع السيناريوهات.',
  },
  en: {
    method: "Calculation method: a uniform shift is applied to the portfolio's average annual ROE:",
    rows: [
      { label: 'Pessimistic', calc: 'Base Annual ROE × 0.90', note: '10% revenue decline assumed' },
      { label: 'Normal',      calc: 'Base Annual ROE × 1.00', note: 'Base-case expectations' },
      { label: 'Optimistic',  calc: 'Base Annual ROE × 1.10', note: '10% revenue growth assumed' },
    ],
    footer: 'Only revenue rate changes — cost structure and equity base remain fixed across all scenarios.',
  },
};


export default function SectorPanel() {
  const { t, lang, portfolioService } = useApp();
  const [showSensInfo, setShowSensInfo] = useState(false);

  const sens = portfolioService.getSensitivityScenarios();
  const scenarios = [
    { key: 'sOpt',  value: `ROE ${fmtPct(sens.optimistic)}`, color: '#7AAF6A', bg: 'rgba(122,175,106,0.08)', icon: '▲' },
    { key: 'sNorm', value: `ROE ${fmtPct(sens.normal)}`,      color: 'var(--rasf-primary)', bg: 'var(--rasf-primary-dim)', icon: '─' },
    { key: 'sPess', value: `ROE ${fmtPct(sens.pessimistic)}`, color: '#C17A6A', bg: 'rgba(193,122,106,0.08)', icon: '▼' },
  ];

  const sectors = portfolioService.getPortfolioSectorDistribution();
  const sColors  = sectors.map((_, i) => RASF_CHART_COLORS[i % RASF_CHART_COLORS.length]);

  const sectorData = {
    labels:   sectors.map(s => lang === 'ar' ? s.nameAr : s.nameEn),
    datasets: [{ data: sectors.map(s => s.pct), backgroundColor: sColors, borderWidth: 0, hoverOffset: 5 }],
  };

  const explain = SENS_EXPLAIN[lang];

  return (
    <div className="flex flex-col gap-4">
      {/* Sector Doughnut */}
      <GlassCard className="flex-1">
        <div className="section-hd mb-1">{t('dSectorT')}</div>
        <div style={{ position: 'relative', height: 130 }}>
          <Doughnut data={sectorData} options={DOUGHNUT_OPTIONS} plugins={[donutCenterPlugin]} />
        </div>
        <div className="grid grid-cols-2 gap-1 mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          {sectors.map((s, i) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sColors[i], display: 'inline-block' }} />
              <span>{lang === 'ar' ? s.nameAr : s.nameEn} {s.pct}%</span>
            </span>
          ))}
        </div>
      </GlassCard>

      {/* Sensitivity Analysis */}
      <GlassCard padding="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="section-hd">{t('dSensT')}</div>
          <button
            onClick={() => setShowSensInfo(v => !v)}
            title={lang === 'ar' ? 'كيف تُحسب هذه الأرقام؟' : 'How are these numbers calculated?'}
            style={{
              color: showSensInfo ? 'var(--rasf-primary)' : 'var(--text-faint)',
              fontSize: 14, lineHeight: 1,
              background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px',
              borderRadius: 6,
              transition: 'color .15s',
            }}
          >
            ⓘ
          </button>
        </div>

        {showSensInfo && (
          <div className="rounded-xl p-3 mb-3 text-xs" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-tag-warm)', lineHeight: 1.7 }}>
            <div className="font-semibold mb-2" style={{ color: 'var(--rasf-primary)' }}>{explain.method}</div>
            <div className="space-y-1 mb-2">
              {explain.rows.map(r => (
                <div key={r.label} className="flex gap-2" style={{ color: 'var(--text-muted)' }}>
                  <span className="font-medium w-16 flex-shrink-0" style={{ color: 'var(--text-med)' }}>{r.label}</span>
                  <span className="font-mono" style={{ color: 'var(--rasf-primary)' }}>{r.calc}</span>
                  <span style={{ color: 'var(--text-muted)' }}>— {r.note}</span>
                </div>
              ))}
            </div>
            <div style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--glass-line)', paddingTop: 6 }}>
              {explain.footer}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {scenarios.map(s => (
            <div
              key={s.key}
              className="flex justify-between items-center rounded-xl px-3 py-2.5"
              style={{
                background: s.bg,
                border: `1px solid ${s.color}33`,
                borderInlineStart: `3px solid ${s.color}`,
              }}
            >
              <div className="flex items-center gap-1.5">
                <span style={{ color: s.color, fontSize: 11, fontWeight: 600 }}>{t(s.key)}</span>
                <span style={{ color: s.color, fontSize: 10 }}>{s.icon}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span style={{ color: s.color, fontWeight: 700, fontSize: 13 }}>{s.value}</span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

