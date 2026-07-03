import { Bar } from 'react-chartjs-2';
import { useApp } from '../../../contexts/useApp';
import { CashFlow } from '../../../models/CashFlow';
import { fmtYMode, addUnit } from '../../../utils/fmtMode';
import GlassCard from '../../common/GlassCard';
import SARNum from '../../common/SARNum';

const INFLOW_COLOR  = 'rgba(16,185,129,0.82)';
const OUTFLOW_COLOR = 'rgba(239,68,68,0.82)';

const BASE_SCALES = {
  x: {
    ticks: { color: '#7A6E67' },
    grid:  { color: 'rgba(71,53,48,0.08)' },
    border: { display: false },
  },
  y: {
    border: { display: false },
    grid: {
      color:     (ctx) => ctx.tick.value === 0 ? 'rgba(71,53,48,0.30)' : 'rgba(71,53,48,0.08)',
      lineWidth: (ctx) => ctx.tick.value === 0 ? 1.5 : 1,
    },
  },
};

export default function CashFlows({ project }) {
  const { t, lang, displayMode } = useApp();

  const flows      = project.cashFlows.map(cf => new CashFlow(cf));
  const cumulative = CashFlow.cumulative(flows);

  const isAr   = lang === 'ar';
  const isFull = displayMode === 'full';

  // Dynamic column headers — strip/add unit hint based on mode
  const revenueHeader = isFull ? (isAr ? 'الإيرادات'  : 'Revenue')   : t('cfh2');
  const expenseHeader = isFull ? (isAr ? 'المصروفات'  : 'Expenses')  : t('cfh3');
  const netHeader     = addUnit(t('cfh4'), displayMode, lang);
  const cumHeader     = addUnit(t('cfh5'), displayMode, lang);

  // Chart subtitle
  const chartSub = isFull
    ? (isAr ? '(ريال)' : '(SAR)')
    : (isAr ? '(ألف ريال)' : '(SAR 000)');

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      ...BASE_SCALES,
      y: {
        ...BASE_SCALES.y,
        ticks: { color: '#7A6E67', callback: v => fmtYMode(v, displayMode) },
      },
    },
  };

  const barData = {
    labels: flows.map(f => f.year),
    datasets: [
      {
        label: t('chartInflow'),
        data: flows.map(f => f.revenue),
        backgroundColor: INFLOW_COLOR,
        borderRadius: 5,
      },
      {
        label: t('chartOutflow'),
        data: flows.map(f => f.expenses),
        backgroundColor: OUTFLOW_COLOR,
        borderRadius: 5,
      },
    ],
  };

  return (
    <div>
      <GlassCard className="mb-4">

        {/* Header + inline legend */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="section-hd mb-0.5">{t('cfChT')}</div>
            <div className="section-sub">
              {flows.length
                ? `${flows[0].year} – ${flows[flows.length - 1].year} ${chartSub}`
                : chartSub}
            </div>
          </div>
          <div className="flex items-center gap-4" style={{ paddingTop: 2 }}>
            <span className="flex items-center gap-1.5" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', flexShrink: 0, display: 'inline-block' }} />
              {t('chartInflow')}
            </span>
            <span className="flex items-center gap-1.5" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', flexShrink: 0, display: 'inline-block' }} />
              {t('chartOutflow')}
            </span>
          </div>
        </div>

        <div style={{ position: 'relative', height: 240 }}>
          <Bar data={barData} options={barOptions} />
        </div>
      </GlassCard>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--bg-card-strong)' }}>
              <th className="text-right px-5 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{t('cfh1')}</th>
              <th className="text-right px-5 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{revenueHeader}</th>
              <th className="text-right px-5 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{expenseHeader}</th>
              <th className="text-right px-5 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{netHeader}</th>
              <th className="text-right px-5 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{cumHeader}</th>
            </tr>
          </thead>
          <tbody>
            {flows.map((cf, i) => {
              const cum = cumulative[i].cumulative;
              return (
                <tr key={cf.year} style={{ borderTop: '1px solid var(--border-faint)' }}>
                  <td className="px-5 py-3">{cf.year}</td>
                  <td className="px-5 py-3" style={{ color: cf.revenue > 0 ? '#10b981' : '#7A6E67' }}>
                    {cf.revenue > 0
                      ? <SARNum millions={cf.revenue} showSymbol={false} />
                      : '—'}
                  </td>
                  <td className="px-5 py-3" style={{ color: '#ef4444' }}>
                    <SARNum millions={cf.expenses} showSymbol={false} />
                  </td>
                  <td className="px-5 py-3" style={{ color: cf.isPositive ? '#10b981' : '#ef4444' }}>
                    <SARNum millions={cf.net} showSymbol={false} />
                  </td>
                  <td className="px-5 py-3" style={{ color: cum >= 0 ? '#10b981' : '#ef4444', fontWeight: i === flows.length - 1 ? 700 : 400 }}>
                    <SARNum millions={cum} showSymbol={false} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
