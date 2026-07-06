import { fmtPct, fmtK } from '../../utils/fmt';

/* ── Design tokens (hardcoded — no CSS variables, html2canvas needs computed values) ── */
/* Always light mode: cream backgrounds, brand-brown text, beige accents                */
const C = {
  bg:     '#FAF0E6',               /* cream — light bg-app                */
  card:   '#FFFFFF',               /* white card                          */
  card2:  '#F5EDE3',               /* warm card-strong for table headers  */
  border: '#E2DBD3',               /* warm light border                   */
  line:   'rgba(71,53,48,0.08)',   /* hairline divider                    */
  glass:  'rgba(71,53,48,0.04)',   /* subtle warm tint                    */
  gold:   '#473530',               /* brand BROWN — primary on light      */
  goldLt: '#CEB69F',               /* brand BEIGE — accent on light       */
  hi:     '#211E1B',               /* near-black — headings               */
  md:     '#473530',               /* brand brown — body text             */
  lo:     '#6B5A52',               /* warm muted                          */
  faint:  '#89817D',               /* secondary labels                    */
  green:  '#059669',               /* emerald-600 — good on white         */
  purple: '#7c3aed',               /* violet-600                          */
  blue:   '#2563eb',               /* blue-600                            */
  amber:  '#d97706',               /* amber-600                           */
  red:    '#dc2626',               /* red-600                             */
};

/* A4 at 96 dpi */
const PW = 794;
const PH = 1123;

const STATUS_COLOR = { active: C.green, financing: C.amber, planning: C.blue, completed: C.purple };
const STATUS_AR    = { active: 'نشط', financing: 'تمويل', planning: 'تخطيط', completed: 'مكتمل' };
const STATUS_EN    = { active: 'Active', financing: 'Financing', planning: 'Planning', completed: 'Completed' };
const TYPE_AR      = { luxury_residential: 'سكني فاخر', commercial: 'تجاري', mixed: 'متعدد الاستخدامات', residential: 'سكني', hotel: 'فندقي', industrial: 'صناعي' };
const TYPE_EN      = { luxury_residential: 'Luxury Res.', commercial: 'Commercial', mixed: 'Mixed-Use', residential: 'Residential', hotel: 'Hotel', industrial: 'Industrial' };

/* ── Shared primitives ──────────────────────────────────────────────────────── */
function Badge({ color = C.blue, children }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px', borderRadius: 20,
      fontSize: 9, fontWeight: 700,
      color, background: `${color}22`, border: `1px solid ${color}44`,
    }}>{children}</span>
  );
}

function Row({ label, value, color = C.hi, bold = false, topLine = false }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '6px 0',
      borderTop: topLine ? `1px solid ${C.line}` : 'none',
    }}>
      <span style={{ fontSize: 10, color: C.lo }}>{label}</span>
      <span style={{ fontSize: 11, color, fontWeight: bold ? 700 : 400 }}>{value}</span>
    </div>
  );
}

function PageHeader({ left, center, right }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '13px 40px',
      borderBottom: `1px solid ${C.border}`,
      background: C.glass,
    }}>
      <div style={{ fontSize: 10, color: C.lo }}>{left}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.md }}>{center}</div>
      <div style={{ fontSize: 10, color: C.lo }}>{right}</div>
    </div>
  );
}

function PageFooter({ lang, page, total }) {
  const isAr = lang === 'ar';
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 40px',
      borderTop: `1px solid ${C.border}`,
    }}>
      <div style={{ fontSize: 9, color: C.faint }}>رصف — RASF Development Management</div>
      <div style={{ fontSize: 9, color: C.faint }}>
        {isAr ? `${page} / ${total}` : `${page} / ${total}`}
      </div>
    </div>
  );
}

/* ── Page 1: Cover ──────────────────────────────────────────────────────────── */
function CoverPage({ portfolioService, lang, date, totalPages }) {
  const kpis     = portfolioService.getKPIs();
  const projects = portfolioService.getAllProjects();
  const isAr     = lang === 'ar';

  const heroKpis = [
    { label: isAr ? 'إجمالي قيمة المحفظة' : 'Total Portfolio Value', value: kpis.totalValue, sub: isAr ? 'ألف SAR' : '000 SAR', color: C.gold },
    { label: isAr ? 'متوسط ROI'  : 'Average ROI',  value: fmtPct(kpis.averageROI),    color: C.green  },
    { label: isAr ? 'متوسط IRR'  : 'Average IRR',  value: fmtPct(kpis.averageIRR),    color: C.purple },
    { label: isAr ? 'عدد المشاريع': 'Projects',     value: kpis.projectCount,           color: C.blue   },
  ];

  return (
    <div style={{ width: PW, height: PH, background: C.bg, position: 'relative', overflow: 'hidden', boxSizing: 'border-box' }}>

      {/* Gold top stripe */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${C.gold}, ${C.goldLt} 50%, ${C.gold})` }} />

      {/* Decorative circle */}
      <div style={{
        position: 'absolute', top: -180, right: -180,
        width: 520, height: 520, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(71,53,48,0.05) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ padding: '52px 64px 48px', height: PH - 4, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>

        {/* Logo */}
        <div style={{ marginBottom: 56 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 14,
            padding: '10px 20px',
            background: 'rgba(71,53,48,0.06)',
            border: `1px solid rgba(71,53,48,0.20)`,
            borderRadius: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldLt})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 900, color: '#fff', fontFamily: 'Cairo, sans-serif',
            }}>ر</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.gold, fontFamily: 'Cairo, sans-serif', lineHeight: 1.1 }}>رصف</div>
              <div style={{ fontSize: 9, color: C.lo, letterSpacing: 2 }}>RASF</div>
            </div>
          </div>
        </div>

        {/* Title block */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: C.gold, letterSpacing: 2, marginBottom: 14 }}>
            {isAr ? 'تقرير المحفظة الاستثمارية' : 'INVESTMENT PORTFOLIO REPORT'}
          </div>
          <div style={{ fontSize: 38, fontWeight: 900, color: C.hi, lineHeight: 1.2, marginBottom: 10, fontFamily: 'Cairo, sans-serif' }}>
            {isAr ? 'محفظة ادارة التطوير' : 'Development Management Portfolio'}
          </div>
          <div style={{ fontSize: 14, color: C.md, marginBottom: 36 }}>
            {isAr ? 'رصف للتطوير العقاري' : 'RASF Real Estate Development'}
          </div>

          {/* Gold divider */}
          <div style={{ height: 1, background: `linear-gradient(90deg, ${C.gold}55, transparent)`, marginBottom: 36 }} />

          {/* KPI row */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 36 }}>
            {heroKpis.map((k, i) => (
              <div key={i} style={{
                flex: 1, background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 12, padding: '18px 20px',
              }}>
                <div style={{ fontSize: 9, color: C.lo, letterSpacing: 0.4, marginBottom: 10 }}>{k.label}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</div>
                {k.sub && <div style={{ fontSize: 9, color: C.faint, marginTop: 5 }}>{k.sub}</div>}
              </div>
            ))}
          </div>

          {/* Projects preview */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 22px', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 9, color: C.lo, letterSpacing: 1.5 }}>
                {isAr ? 'المشاريع القائمة' : 'ACTIVE PROJECTS'}
              </span>
            </div>
            <div style={{ padding: '8px 0' }}>
              {projects.slice(0, 7).map((p, i) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 22px',
                  borderTop: i > 0 ? `1px solid ${C.line}` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[p.status] ?? C.blue, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.hi, fontFamily: 'Cairo, sans-serif' }}>{p.name}</span>
                    <span style={{ fontSize: 10, color: C.lo }}>{p.location}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <span style={{ fontSize: 10, color: C.green }}>ROI {fmtPct(p.roi)}</span>
                    <span style={{ fontSize: 10, color: C.purple }}>IRR {fmtPct(p.irr)}</span>
                    <Badge color={STATUS_COLOR[p.status] ?? C.blue}>{isAr ? STATUS_AR[p.status] : STATUS_EN[p.status]}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.md, fontFamily: 'Cairo, sans-serif' }}>
              {isAr ? 'عمر المعيوف' : 'Omar Al-Mayouf'}
            </div>
            <div style={{ fontSize: 10, color: C.lo }}>{isAr ? 'مدير المحفظة' : 'Portfolio Manager'}</div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.md }}>{date}</div>
            <div style={{ fontSize: 9, color: C.lo }}>RASF — رصف</div>
          </div>
        </div>
      </div>

      <PageFooter lang={lang} page={1} total={totalPages} />
    </div>
  );
}

/* ── Page 2: Portfolio Overview ─────────────────────────────────────────────── */
function OverviewPage({ portfolioService, lang, totalPages }) {
  const kpis     = portfolioService.getKPIs();
  const projects = portfolioService.getAllProjects();
  const sens     = portfolioService.getSensitivityScenarios();
  const isAr     = lang === 'ar';

  const kpiCards = [
    { label: isAr ? 'إجمالي قيمة المحفظة'   : 'Total Portfolio Value',  value: kpis.totalValue,              sub: isAr ? 'ألف SAR' : '000 SAR', color: C.gold   },
    { label: isAr ? 'متوسط ROI'              : 'Average ROI',            value: fmtPct(kpis.averageROI),      color: C.green  },
    { label: isAr ? 'متوسط IRR'              : 'Average IRR',            value: fmtPct(kpis.averageIRR),      color: C.purple },
    { label: isAr ? 'متوسط ROE السنوي'       : 'Avg Annual ROE',         value: fmtPct(kpis.averageROEAnnual),color: C.green  },
    { label: isAr ? 'إجمالي مساحة البناء'    : 'Total Above-Grade GBA',  value: kpis.totalAboveGradeGBA,     sub: 'م²',       color: C.blue   },
    { label: isAr ? 'عدد المشاريع'            : 'Active Projects',        value: kpis.projectCount,            color: C.hi     },
  ];

  const sensitivityRows = [
    { label: isAr ? 'متفائل'  : 'Optimistic',  value: fmtPct(sens.optimistic),  color: C.green  },
    { label: isAr ? 'طبيعي'   : 'Normal',       value: fmtPct(sens.normal),       color: C.gold   },
    { label: isAr ? 'متشائم'  : 'Pessimistic',  value: fmtPct(sens.pessimistic), color: C.red    },
  ];

  const sectors = portfolioService.getPortfolioSectorDistribution();

  return (
    <div style={{ width: PW, height: PH, background: C.bg, position: 'relative', overflow: 'hidden', boxSizing: 'border-box' }}>
      <PageHeader
        left="رصف — RASF"
        center={isAr ? 'نظرة عامة على المحفظة' : 'Portfolio Overview'}
        right={isAr ? 'الصفحة 2' : 'Page 2'}
      />

      <div style={{ padding: '28px 40px 60px' }}>

        {/* KPI grid */}
        <div style={{ fontSize: 10, color: C.lo, letterSpacing: 1, marginBottom: 14 }}>
          {isAr ? 'المؤشرات الرئيسية' : 'KEY PERFORMANCE INDICATORS'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          {kpiCards.map((k, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 9, color: C.lo, marginBottom: 8 }}>{k.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
              {k.sub && <div style={{ fontSize: 9, color: C.faint, marginTop: 5 }}>{k.sub}</div>}
            </div>
          ))}
        </div>

        {/* Two columns: sectors + sensitivity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>

          {/* Sector distribution */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14 }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 10, color: C.lo, letterSpacing: 1 }}>{isAr ? 'توزيع القطاعات' : 'SECTOR DISTRIBUTION'}</span>
            </div>
            <div style={{ padding: '12px 20px' }}>
              {sectors.map((s, i) => {
                const barColors = [C.gold, C.purple, C.blue, C.green];
                return (
                  <div key={s.key} style={{ marginBottom: i < sectors.length - 1 ? 12 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: C.md, fontFamily: 'Cairo, sans-serif' }}>{isAr ? s.nameAr : s.nameEn}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: barColors[i % 4] }}>{s.pct}%</span>
                    </div>
                    <div style={{ height: 5, background: C.border, borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${s.pct}%`, background: barColors[i % 4], borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sensitivity */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14 }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 10, color: C.lo, letterSpacing: 1 }}>{isAr ? 'تحليل الحساسية — ROE' : 'SENSITIVITY ANALYSIS — ROE'}</span>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sensitivityRows.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', borderRadius: 10,
                  background: `${s.color}10`,
                  border: `1px solid ${s.color}30`,
                  borderRight: `3px solid ${s.color}`,
                }}>
                  <span style={{ fontSize: 12, color: s.color, fontFamily: 'Cairo, sans-serif' }}>{s.label}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: s.color }}>ROE {s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Projects summary table */}
        <div style={{ fontSize: 10, color: C.lo, letterSpacing: 1, marginBottom: 12 }}>
          {isAr ? 'ملخص المشاريع' : 'PROJECTS SUMMARY'}
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: C.card2 }}>
                {[
                  isAr ? 'المشروع' : 'Project',
                  isAr ? 'الموقع' : 'Location',
                  isAr ? 'الاستثمار (ألف)' : 'Investment (000)',
                  isAr ? 'الإيرادات (ألف)' : 'Revenue (000)',
                  'IRR', 'ROI',
                  isAr ? 'الحالة' : 'Status',
                ].map((h, i) => (
                  <th key={i} style={{ padding: '9px 12px', color: C.lo, fontWeight: 600, fontSize: 9, textAlign: i === 0 ? 'right' : 'center', letterSpacing: 0.4 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} style={{ borderTop: `1px solid ${C.line}` }}>
                  <td style={{ padding: '9px 12px' }}>
                    <div style={{ fontWeight: 700, color: C.hi, fontSize: 12, fontFamily: 'Cairo, sans-serif' }}>{p.name}</div>
                    <div style={{ fontSize: 9, color: C.lo }}>{isAr ? TYPE_AR[p.type] : TYPE_EN[p.type]}</div>
                  </td>
                  <td style={{ padding: '9px 12px', color: C.lo, fontSize: 10, textAlign: 'center' }}>{p.location}</td>
                  <td style={{ padding: '9px 12px', color: C.gold, fontWeight: 700, textAlign: 'center' }}>{fmtK(p.investmentM)}</td>
                  <td style={{ padding: '9px 12px', color: C.green, fontWeight: 700, textAlign: 'center' }}>{fmtK(p.costs?.totalRevenue)}</td>
                  <td style={{ padding: '9px 12px', color: C.purple, fontWeight: 700, textAlign: 'center' }}>{fmtPct(p.irr)}</td>
                  <td style={{ padding: '9px 12px', color: C.green, fontWeight: 700, textAlign: 'center' }}>{fmtPct(p.roi)}</td>
                  <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                    <Badge color={STATUS_COLOR[p.status] ?? C.blue}>{isAr ? STATUS_AR[p.status] : STATUS_EN[p.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PageFooter lang={lang} page={2} total={totalPages} />
    </div>
  );
}

/* ── Project detail page ────────────────────────────────────────────────────── */
function ProjectPage({ project: p, lang, pageNum, totalPages }) {
  const isAr = lang === 'ar';
  const np   = p.netProfit ?? ((p.costs?.totalRevenue ?? 0) - (p.costs?.totalCost ?? 0));
  const tc   = p.costs?.totalCost ?? 0;
  const tr   = p.costs?.totalRevenue ?? 0;
  const moic = tc > 0 ? `${(tr / tc).toFixed(2)}x` : '—';

  const f      = p.financing ?? {};
  const equity = (f.cashSubscriptions ?? 0) + (f.fundManagerSubscription ?? 0)
               + (f.developerCashSubscription ?? 0) + (f.developerInKindSubscription ?? 0)
               + (f.landOwnerInKind ?? 0) + (f.contractorCashSubscription ?? 0);
  const roeAnn = equity > 0 && p.paybackYears > 0
    ? fmtPct((np / equity * 100) / p.paybackYears) : '—';

  const metrics = [
    { l: isAr ? 'إجمالي الاستثمار' : 'Total Investment', v: fmtK(p.investmentM), c: C.gold   },
    { l: isAr ? 'إجمالي الإيرادات' : 'Total Revenue',    v: fmtK(tr),             c: C.green  },
    { l: isAr ? 'صافي الربح'       : 'Net Profit',       v: fmtK(np),             c: np >= 0 ? C.green : C.red },
    { l: 'IRR',                                            v: fmtPct(p.irr),        c: C.purple },
    { l: 'ROI',                                            v: fmtPct(p.roi),        c: C.green  },
    { l: 'ROE ' + (isAr ? 'سنوي' : 'Annual'),             v: roeAnn,               c: C.green  },
    { l: 'MOIC',                                           v: moic,                 c: C.gold   },
    { l: isAr ? 'مدة الاسترداد' : 'Payback Period',      v: `${p.paybackYears} ${isAr ? 'سنة' : 'yrs'}`, c: C.hi },
  ];

  const costRows = [
    { l: isAr ? 'إجمالي الإيرادات' : 'Total Revenue',    v: fmtK(tr),                     c: C.green, bold: true },
    { l: isAr ? 'تكلفة الأرض'      : 'Land Cost',        v: fmtK(p.costs?.landCost) },
    { l: isAr ? 'تكاليف البناء'    : 'Construction',     v: fmtK(p.costs?.constructionCost) },
    { l: isAr ? 'التكاليف الأخرى'  : 'Other Costs',      v: fmtK(p.costs?.otherCost) },
    { l: isAr ? 'تكاليف التشغيل'   : 'Operational',      v: fmtK(p.costs?.operationalCost) },
    { l: isAr ? 'تكاليف التمويل'   : 'Financing Costs',  v: fmtK(p.costs?.financingCost) },
    { l: isAr ? 'تكاليف المطور'    : 'Developer Costs',  v: fmtK(p.costs?.developerCost) },
    { l: isAr ? 'تكاليف الصندوق'   : 'Fund Costs',       v: fmtK(p.costs?.fundCost) },
    { l: isAr ? 'إجمالي التكاليف'  : 'Total Costs',      v: fmtK(tc),                     c: C.md, bold: true },
    { l: isAr ? 'صافي الربح'       : 'Net Profit',       v: fmtK(np),                     c: np >= 0 ? C.green : C.red, bold: true },
  ];

  const areaRows = [
    { l: isAr ? 'مساحة الأرض'         : 'Land Area',       v: p.area },
    { l: isAr ? 'مبني فوق الأرض GBA'  : 'Above Grade GBA', v: p.aboveGradeGBA },
    ...(p.belowGradeGBA && p.belowGradeGBA !== '—'
      ? [{ l: isAr ? 'مساحة القبو' : 'Below Grade', v: p.belowGradeGBA }]
      : []),
    { l: isAr ? 'إجمالي الوحدات' : 'Total Units', v: p.units?.toLocaleString() },
    ...(p.unitsSold > 0 ? [{ l: isAr ? 'الوحدات المباعة' : 'Units Sold', v: p.unitsSold?.toLocaleString() }] : []),
  ].filter(r => r.v && r.v !== '—');

  return (
    <div style={{ width: PW, height: PH, background: C.bg, position: 'relative', overflow: 'hidden', boxSizing: 'border-box' }}>
      <PageHeader
        left="رصف — RASF"
        center={p.name}
        right={isAr ? `الصفحة ${pageNum}` : `Page ${pageNum}`}
      />

      <div style={{ padding: '22px 40px 60px' }}>

        {/* Project meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <Badge color={STATUS_COLOR[p.status] ?? C.blue}>{isAr ? STATUS_AR[p.status] : STATUS_EN[p.status]}</Badge>
          <Badge color={C.purple}>{isAr ? TYPE_AR[p.type] : TYPE_EN[p.type]}</Badge>
          {p.location && <span style={{ fontSize: 11, color: C.lo }}>📍 {p.location}</span>}
          {p.deliveryDate && <span style={{ fontSize: 11, color: C.lo }}>🗓 {p.deliveryDate}</span>}
        </div>

        {/* Metrics grid: 4 columns × 2 rows */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 22 }}>
          {metrics.map((m, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '13px 16px' }}>
              <div style={{ fontSize: 9, color: C.lo, marginBottom: 6 }}>{m.l}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: m.c, lineHeight: 1 }}>{m.v}</div>
            </div>
          ))}
        </div>

        {/* Two columns: cost table + area + components */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* Financial summary */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 10, color: C.lo, letterSpacing: 0.8 }}>
                {isAr ? 'الملخص المالي (ألف SAR)' : 'FINANCIAL SUMMARY (000 SAR)'}
              </span>
            </div>
            <div style={{ padding: '6px 18px 12px' }}>
              {costRows.filter(r => r.v && r.v !== '—').map((r, i) => (
                <Row key={i} label={r.l} value={r.v} color={r.c ?? C.hi} bold={r.bold} topLine={i > 0} />
              ))}
            </div>
          </div>

          {/* Area + components */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Area stats */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
              <div style={{ padding: '12px 18px', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 10, color: C.lo, letterSpacing: 0.8 }}>{isAr ? 'المساحات' : 'AREA SUMMARY'}</span>
              </div>
              <div style={{ padding: '6px 18px 12px' }}>
                {areaRows.map((r, i) => <Row key={i} label={r.l} value={r.v} topLine={i > 0} />)}
              </div>
            </div>

            {/* Component breakdown */}
            {p.componentBreakdown?.filter(c => c.unitCount > 0 || c.gba > 0).length > 0 && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                <div style={{ padding: '12px 18px', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 10, color: C.lo, letterSpacing: 0.8 }}>{isAr ? 'المكونات' : 'COMPONENTS'}</span>
                </div>
                <div style={{ padding: '6px 18px 12px' }}>
                  {p.componentBreakdown.filter(c => c.unitCount > 0 || c.gba > 0).map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: i > 0 ? `1px solid ${C.line}` : 'none' }}>
                      <span style={{ fontSize: 10, color: C.md, fontFamily: 'Cairo, sans-serif' }}>{c.nameAr}</span>
                      <span style={{ fontSize: 10, color: C.hi }}>
                        {c.unitCount > 0 ? `${c.unitCount} ${isAr ? 'وحدة' : 'units'}` : ''}
                        {c.gba > 0 ? ` · ${c.gba?.toLocaleString()} م²` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Funding structure if available */}
        {p.financing && Object.keys(p.financing).length > 0 && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 10, color: C.lo, letterSpacing: 0.8 }}>{isAr ? 'هيكل التمويل (م SAR)' : 'FUNDING STRUCTURE (SAR M)'}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0, padding: '8px 18px 12px' }}>
              {[
                { l: isAr ? 'مالك الأرض'         : 'Land Owner',          v: p.financing.landOwnerInKind },
                { l: isAr ? 'اكتتاب نقدي'         : 'Cash Subscriptions',  v: p.financing.cashSubscriptions },
                { l: isAr ? 'اكتتاب مطور'         : 'Developer Sub.',      v: p.financing.developerCashSubscription },
                { l: isAr ? 'التمويل البنكي'       : 'Bank Financing',      v: p.financing.bankFinancing },
                { l: isAr ? 'بيع على الخارطة'      : 'Off-Plan Sales',      v: p.financing.offplanSales },
                { l: isAr ? 'مصادر أخرى'           : 'Other Sources',       v: p.financing.otherSources },
              ].filter(r => r.v && r.v > 0).map((r, i) => (
                <div key={i} style={{ width: '50%', padding: '4px 0', boxSizing: 'border-box', paddingLeft: i % 2 === 1 ? 20 : 0 }}>
                  <span style={{ fontSize: 10, color: C.lo }}>{r.l}: </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.gold }}>{r.v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} م</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <PageFooter lang={lang} page={pageNum} total={totalPages} />
    </div>
  );
}

export default function ReportSheet({ portfolioService, lang }) {
  const projects   = portfolioService.getAllProjects();
  const totalPages = 2 + projects.length;
  const isAr       = lang === 'ar';
  const now        = new Date();
  const date       = now.toLocaleDateString(
    isAr ? 'ar-SA-u-nu-latn' : 'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' },
  );

  const pageBreak = { breakAfter: 'page', pageBreakAfter: 'always' };

  return (
    <div style={{ width: PW, background: C.bg, fontFamily: 'Cairo, Inter, sans-serif' }}>
      <div style={pageBreak}><CoverPage    portfolioService={portfolioService} lang={lang} date={date}  totalPages={totalPages} /></div>
      <div style={pageBreak}><OverviewPage portfolioService={portfolioService} lang={lang}              totalPages={totalPages} /></div>
      {projects.map((p, i) => (
        <div key={p.id} style={i < projects.length - 1 ? pageBreak : undefined}>
          <ProjectPage project={p} lang={lang} pageNum={i + 3} totalPages={totalPages} />
        </div>
      ))}
    </div>
  );
}
