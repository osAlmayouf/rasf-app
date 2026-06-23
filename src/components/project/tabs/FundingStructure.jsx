import { Doughnut } from 'react-chartjs-2';
import { useApp } from '../../../contexts/useApp';
import { addUnit } from '../../../utils/fmtMode';
import GlassCard from '../../common/GlassCard';
import SARNum from '../../common/SARNum';
import { donutCenterPlugin } from '../../../utils/chartColors';

const ITEMS_DEF = [
  { key: 'bankFinancing',               labelAr: 'إجمالي التمويل البنكي',          color: '#F0EAE4', isEquity: false },
  { key: 'offplanSales',                labelAr: 'البيع على الخارطة',              color: '#DAD2CC', isEquity: false },
  { key: 'landOwnerInKind',             labelAr: 'الاشتراك العيني من مالك الأرض', color: '#A4907E', isEquity: true  },
  { key: 'cashSubscriptions',           labelAr: 'الاشتراكات النقدية',              color: '#B5A495', isEquity: true  },
  { key: 'fundManagerSubscription',     labelAr: 'الاشتراك من مدير الصندوق',       color: '#6B5545', isEquity: true  },
  { key: 'developerCashSubscription',   labelAr: 'الاشتراك النقدي من المطور',      color: '#8B7566', isEquity: true  },
  { key: 'developerInKindSubscription', labelAr: 'الاشتراك العيني من المطور',      color: '#5A4535', isEquity: true  },
  { key: 'otherSources',                labelAr: 'مصادر أخرى',                    color: '#3D2E24', isEquity: false },
];

const DONUT_OPTS = {
  responsive: true, maintainAspectRatio: false, cutout: '65%',
  plugins: { legend: { display: false } },
};


function ItemRow({ color, label, pct, amount }) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{label}</span>
      </div>
      <div className="flex gap-3" style={{ direction: 'ltr' }}>
        <span style={{ color, fontWeight: 700, minWidth: 44, textAlign: 'right', fontSize: '0.8rem' }}>{pct}%</span>
        <span style={{ color: 'var(--text-lo)', minWidth: 52, textAlign: 'right', fontSize: '0.8rem' }}>
          <SARNum millions={amount} showSymbol={false} />
        </span>
      </div>
    </div>
  );
}

export default function FundingStructure({ project }) {
  const { t, lang, displayMode } = useApp();
  const { financing, equity, investmentM = 0 } = project;

  // ── Active items from financing (amount > 0) ─────────────────────────────────
  const fin = financing ?? {};
  const allItems = ITEMS_DEF
    .map(def => ({ ...def, amount: fin[def.key] ?? 0 }))
    .filter(item => item.amount > 0);

  const totalFund  = allItems.reduce((s, i) => s + i.amount, 0);
  const totalEquity = allItems.filter(i => i.isEquity).reduce((s, i) => s + i.amount, 0);

  // Funding items: % of total financing
  const fundItems = allItems.map(i => ({
    ...i, pct: totalFund > 0 ? ((i.amount / totalFund) * 100).toFixed(1) : '0',
  }));

  // Equity items: % of equity total only
  const equityItems = allItems
    .filter(i => i.isEquity)
    .map(i => ({
      ...i, pct: totalEquity > 0 ? ((i.amount / totalEquity) * 100).toFixed(1) : '0',
    }));

  const hasFinancing = fundItems.length > 0;
  const hasEquity    = equityItems.length > 0;

  // Fallback equity breakdown (old hardcoded data) for projects without financing
  const legacyEquity = equity?.breakdown ?? [];

  // ── Chart data ───────────────────────────────────────────────────────────────
  const fundChartData = hasFinancing
    ? { labels: fundItems.map(i => i.labelAr),
        datasets: [{ data: fundItems.map(i => i.amount), backgroundColor: fundItems.map(i => i.color), borderWidth: 0, hoverOffset: 6 }] }
    : { labels: t('chartFund'),
        datasets: [{ data: [project.funding.bank, project.funding.land, project.funding.subscription, project.funding.offplan],
                     backgroundColor: ['#F0EAE4', '#DAD2CC', '#6B5545', '#A4907E'], borderWidth: 0, hoverOffset: 6 }] };

  const equityChartData = hasEquity
    ? { labels: equityItems.map(i => i.labelAr),
        datasets: [{ data: equityItems.map(i => i.amount), backgroundColor: equityItems.map(i => i.color), borderWidth: 0, hoverOffset: 6 }] }
    : { labels: legacyEquity.map(e => t(e.labelKey)),
        datasets: [{ data: legacyEquity.map(e => e.pct), backgroundColor: legacyEquity.map(e => e.color), borderWidth: 0, hoverOffset: 6 }] };

  const showEquityCard = hasEquity || legacyEquity.length > 0;

  const totalEquityLabel = addUnit(lang === 'ar' ? 'إجمالي حقوق الملكية' : 'Total Equity', displayMode, lang);
  const totalFundLabel   = addUnit(lang === 'ar' ? 'إجمالي التمويل الكلي' : 'Total Funding', displayMode, lang);

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>

        {/* ── هيكل التمويل — كل المصادر ──────────────────────────────────────── */}
        <GlassCard>
          <div className="section-hd mb-4">{addUnit(t('fundChT'), displayMode, lang)}</div>
          <div style={{ position: 'relative', height: 200 }}>
            <Doughnut data={fundChartData} options={DONUT_OPTS} plugins={[donutCenterPlugin]} />
          </div>

          {hasFinancing ? (
            <div className="space-y-2 mt-4">
              {fundItems.map(item => (
                <ItemRow key={item.key} color={item.color} label={item.labelAr} pct={item.pct} amount={item.amount} />
              ))}
              <div className="pt-2 mt-1 space-y-1" style={{ borderTop: '1px solid var(--glass-line)' }}>
                {totalEquity > 0 && (
                  <div className="flex justify-between" style={{ fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                      <SARNum millions={totalEquity} showSymbol={false} />
                    </span>
                    <span style={{ color: 'var(--text-faint)' }}>{totalEquityLabel}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold" style={{ fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--rasf-primary)' }}>
                    <SARNum millions={totalFund} showSymbol={false} />
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{totalFundLabel}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 mt-4 text-center text-xs">
              {[
                { pct: project.funding.bank,         labelKey: 'f1l', color: 'var(--text-hi)' },
                { pct: project.funding.land,         labelKey: 'f2l', color: 'var(--text-muted)' },
                { pct: project.funding.subscription, labelKey: 'f3l', color: 'var(--rasf-primary)' },
              ].map(f => (
                <div key={f.labelKey} className="glass rounded-xl p-3">
                  <div className="font-bold text-base" style={{ color: f.color }}>{f.pct}%</div>
                  <div style={{ color: 'var(--text-muted)' }}>{t(f.labelKey)}</div>
                  <div style={{ color: 'var(--text-lo)' }} className="mt-1">
                    <SARNum millions={investmentM * f.pct / 100} showSymbol={false} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* ── هيكل الملكية — الملاك فقط ──────────────────────────────────────── */}
        {showEquityCard && (
          <GlassCard>
            <div className="section-hd mb-4">{addUnit(t('equityChT'), displayMode, lang)}</div>
            <div style={{ position: 'relative', height: 200 }}>
              <Doughnut data={equityChartData} options={DONUT_OPTS} plugins={[donutCenterPlugin]} />
            </div>

            <div className="space-y-2 mt-4">
              {hasEquity ? (
                <>
                  {equityItems.map(item => (
                    <ItemRow key={item.key} color={item.color} label={item.labelAr} pct={item.pct} amount={item.amount} />
                  ))}
                  <div className="flex justify-between font-semibold pt-2 mt-1" style={{ borderTop: '1px solid var(--glass-line)', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--rasf-primary)' }}>
                      <SARNum millions={totalEquity} showSymbol={false} />
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{totalEquityLabel}</span>
                  </div>
                </>
              ) : (
                <>
                  {legacyEquity.map(e => (
                    <div key={e.labelKey} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: e.color, display: 'inline-block' }} />
                        <span style={{ color: 'var(--text-muted)' }}>{t(e.labelKey)}</span>
                      </div>
                      <div className="flex gap-3">
                        <span style={{ color: e.color, fontWeight: 600 }}>{e.pct}%</span>
                        <span style={{ color: 'var(--text-lo)' }}>
                          <SARNum millions={e.amount} showSymbol={false} />
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold pt-2 mt-1" style={{ borderTop: '1px solid var(--glass-line)' }}>
                    <span style={{ color: 'var(--rasf-primary)' }}>
                      <SARNum millions={equity.total} showSymbol={false} />
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{totalEquityLabel}</span>
                  </div>
                </>
              )}
            </div>
          </GlassCard>
        )}
    </div>
  );
}
