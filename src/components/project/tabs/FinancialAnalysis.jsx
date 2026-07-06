import { Doughnut } from 'react-chartjs-2';
import { useApp } from '../../../contexts/useApp';
import { fmtPct } from '../../../utils/fmt';
import { stripUnit, addUnit } from '../../../utils/fmtMode';
import GlassCard from '../../common/GlassCard';
import { donutCenterPlugin } from '../../../utils/chartColors';
import SARNum from '../../common/SARNum';

// land, construction, other, financing, developer, fund
const COST_COLORS = ['#DAD2CC', '#F0EAE4', '#A4907E', '#6B5545', '#B5A495', '#3D2E24'];
const DOUGHNUT_OPTIONS = {
  responsive: true, maintainAspectRatio: false, cutout: '68%',
  plugins: { legend: { display: false } },
};

export default function FinancialAnalysis({ project }) {
  const { t, lang, displayMode } = useApp();
  const costs = project.costs;

  const costData = {
    labels: t('chartCosts'),
    datasets: [{
      data: [
        costs.landCost || 0,
        costs.constructionCost || 0,
        (costs.otherCost || 0) + (costs.operationalCost || 0),
        costs.financingCost || 0,
        costs.developerCost || 0,
        costs.fundCost || 0,
      ],
      backgroundColor: COST_COLORS, borderWidth: 0, hoverOffset: 6,
    }],
  };

  const np  = project.netProfit;

  // Auto-calculated metrics
  const totalRev  = costs.totalRevenue ?? 0;
  const totalCost = costs.totalCost ?? 0;
  const f      = project.financing ?? {};
  const equity = (f.cashSubscriptions          ?? 0)
               + (f.fundManagerSubscription     ?? 0)
               + (f.developerCashSubscription   ?? 0)
               + (f.developerInKindSubscription ?? 0)
               + (f.landOwnerInKind             ?? 0)
               + (f.contractorCashSubscription  ?? 0);

  // Prefer the figures extracted from the study; fall back to derived values
  // only when the study didn't provide them. Keeps this tab consistent with the
  // project header cards (which show the study's own ROI/ROE/IRR).
  const roi    = project.roi       ?? (totalCost > 0 ? (np / totalCost) * 100 : null);
  const roeAnn = project.roeAnnual ?? (equity > 0 && project.paybackYears > 0
    ? (np / equity * 100) / project.paybackYears : null);
  // ROE (total) — derive from annual × payback when the study gave an annual
  // figure, otherwise compute straight from equity.
  const roe = (project.roeAnnual != null && project.paybackYears > 0)
    ? project.roeAnnual * project.paybackYears
    : (equity > 0 ? (np / equity) * 100 : null);

  const moicCalc   = totalCost > 0 ? `${(totalRev / totalCost).toFixed(2)}x`  : '—';
  const roiCalc    = roi    != null ? fmtPct(roi)    : '—';
  const roeCalc    = roe    != null ? fmtPct(roe)    : '—';
  const roeAnnCalc = roeAnn != null ? fmtPct(roeAnn) : '—';

  const kpiCards = [
    { label: addUnit(t('fk1'), displayMode, lang), value: <SARNum millions={np} />, color: '#10b981' },
    { label: 'MOIC',        value: moicCalc,                                    color: 'var(--rasf-primary)', desc: t('fkMoicDesc') },
    { label: 'ROI',         value: roiCalc,                                     color: '#10b981', desc: t('fkRoiDesc') },
    { label: 'ROE',         value: roeCalc,                                     color: '#10b981', desc: t('fkRoeDesc') },
    { label: 'ROE ' + (lang === 'ar' ? 'سنوي' : 'Annual'), value: roeAnnCalc,  color: '#10b981', desc: t('fkRoeAnnDesc') },
    { label: t('fk4'),      value: `${project.paybackYears} ${t('fk4u')}`,     color: 'var(--text-hi)' },
  ];

  const summaryRows = [
    { key: 'fr1', value: <SARNum millions={costs.totalRevenue} />,   color: '#10b981'  },
    { key: 'fr2', value: <SARNum millions={costs.landCost} />                           },
    { key: 'fr3', value: <SARNum millions={costs.constructionCost} />                   },
    { key: 'fr7', value: <SARNum millions={costs.otherCost} />                          },
    { key: 'fr9', value: <SARNum millions={costs.operationalCost} />                    },
    { key: 'fr5', value: <SARNum millions={costs.financingCost} />                      },
    { key: 'fr8', value: <SARNum millions={costs.developerCost} />                      },
    { key: 'fr4', value: <SARNum millions={costs.fundCost} />                           },
    { key: 'fr6', value: <SARNum millions={np} />,                    color: '#10b981', bold: true },
  ];

  return (
    <div>
      <div className="grid grid-cols-6 gap-3 mb-4">
        {kpiCards.map((k, i) => (
          <div key={i} className="kpi">
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{k.label}</div>
            <div className="text-xl font-bold mt-2" style={{ color: k.color }}>{k.value}</div>
            {k.desc && (
              <div className="mt-1.5" style={{ color: 'var(--text-faint)', fontSize: 10, lineHeight: 1.5 }}>
                {k.desc}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <GlassCard>
          <div className="section-hd mb-4">{t('finCostT')}</div>
          <div style={{ position: 'relative', height: 220 }}>
            <Doughnut data={costData} options={DOUGHNUT_OPTIONS} plugins={[donutCenterPlugin]} />
          </div>
          <div className="grid grid-cols-3 gap-1 mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            {['c1','c2','c3','c4','c5','c6'].map((k, i) => (
              <span key={k} className="flex items-center gap-1">
                <span style={{ width: 8, height: 8, borderRadius: 2, background: COST_COLORS[i], display: 'inline-block' }} />
                <span>{t(k)}</span>
              </span>
            ))}
          </div>
        </GlassCard>
        <GlassCard>
          <div className="section-hd mb-4">{stripUnit(t('finSumT'), displayMode)}</div>
          <table className="w-full text-sm">
            <tbody>
              {summaryRows.map(r => (
                <tr key={r.key} style={{ borderBottom: '1px solid var(--glass-line)' }}>
                  <td className="py-3" style={{ color: 'var(--text-muted)' }}>{addUnit(t(r.key), displayMode, lang)}</td>
                  <td className="py-3" style={{ textAlign: 'left', color: r.color ?? 'var(--text-lo)', fontWeight: r.bold ? 700 : 400 }}>{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      </div>
    </div>
  );
}
