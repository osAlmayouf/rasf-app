import { fmtPct, fmtK } from '../../utils/fmt';
import { PHASE_KEYS, PHASE_WEIGHTS, phaseStatusOf, progressFromPhases } from '../../utils/phaseProgress';

/* تقرير مشروع للطباعة/PDF — ثيم فاتح مطابق للوضع الفاتح للموقع (خلفية كريمية تُطبع نظيفة ويمكن الكتابة عليها) */
const C = {
  bg:      '#E2DBD3', panel: '#FAF0E6', panel2: '#F0E8DC', band: '#EAE1D7',
  border:  '#DBD1C5', borderSoft: '#C9BBAB', line: 'rgba(71,53,48,0.10)',
  beige:   '#8A6D51', brown: '#473530',   // beige = اللون المميّز (كراميل)، brown = بني غامق
  hi:      '#211E1B', md: '#473530', lo: '#5C4A3E', muted: '#7A6E64', faint: '#9A8A7C',
  // نغمات دلالية — كلها من درجات هوية الموقع (بني/كراميل/توب)، بلا ألوان خارجية
  pos:     '#5C4030', accent: '#8A6D51', deep: '#473530', soft: '#A4907E',
};
const PW = 794, PH = 1123; // A4 @96dpi

const STATUS_AR = { active: 'نشط', financing: 'تمويل', planning: 'تخطيط', completed: 'مكتمل', pipeline: 'تحت الدراسة', archived: 'مؤرشف' };
const STATUS_EN = { active: 'Active', financing: 'Financing', planning: 'Planning', completed: 'Completed', pipeline: 'Pipeline', archived: 'Archived' };
const TYPE_AR   = { luxury_residential: 'سكني فاخر', commercial: 'تجاري', mixed: 'متعدد الاستخدامات', residential: 'سكني', hotel: 'فندقي', industrial: 'صناعي', infrastructure: 'بنية تحتية' };
const TYPE_EN   = { luxury_residential: 'Luxury Residential', commercial: 'Commercial', mixed: 'Mixed-Use', residential: 'Residential', hotel: 'Hotel', industrial: 'Industrial', infrastructure: 'Infrastructure' };
const PHASE_AR  = { ph1: 'دراسة الجدوى', ph2: 'التصميم', ph3: 'موافقات حكومية', ph4: 'موافقات بنكية/تمويلية', ph5: 'تحويل المشروع للعمليات' };
const PHASE_EN  = { ph1: 'Feasibility Study', ph2: 'Design', ph3: 'Government Approvals', ph4: 'Financing Approvals', ph5: 'Transfer to Operations' };
const GATE = {
  done:    { ar: 'منجز',   en: 'Done',        color: C.pos },
  active:  { ar: 'جارٍ',    en: 'In progress', color: C.beige },
  pending: { ar: 'لم يبدأ', en: 'Not started', color: C.faint },
};

/* ألوان الرسوم — نغمات دافئة داكنة تُقرأ بوضوح على الخلفية الكريمية الفاتحة */
const COST_COLORS   = ['#473530', '#8A6D51', '#6B5545', '#A4907E', '#B0906F', '#5A4535', '#C4A98C'];
const REV_COLORS    = ['#473530', '#8A6D51', '#A4907E', '#6B5545', '#B0906F'];
const FUND_COLORS   = ['#473530', '#6B5545', '#8A6D51', '#A4907E', '#B0906F', '#5A4535', '#8B7566', '#C4A98C'];
const EQUITY_COLORS = ['#473530', '#8A6D51', '#6B5545', '#A4907E', '#B0906F'];

// بنود هيكل التمويل — مطابقة لتبويب هيكل التمويل (تُقرأ من project.financing)
const FIN_ITEMS = [
  { key: 'bankFinancing',               ar: 'التمويل البنكي',            en: 'Bank Financing',        equity: false },
  { key: 'offplanSales',                ar: 'البيع على الخارطة',         en: 'Off-plan Sales',        equity: false },
  { key: 'landOwnerInKind',             ar: 'اشتراك عيني — مالك الأرض',  en: 'Landowner In-kind',     equity: true  },
  { key: 'cashSubscriptions',           ar: 'الاشتراكات النقدية',        en: 'Cash Subscriptions',    equity: true  },
  { key: 'fundManagerSubscription',     ar: 'اشتراك مدير الصندوق',       en: 'Fund Manager Sub.',     equity: true  },
  { key: 'developerCashSubscription',   ar: 'اشتراك المطوّر النقدي',      en: 'Developer Cash Sub.',   equity: true  },
  { key: 'developerInKindSubscription', ar: 'اشتراك المطوّر العيني',      en: 'Developer In-kind Sub.', equity: true  },
  { key: 'otherSources',                ar: 'مصادر أخرى',               en: 'Other Sources',         equity: false },
];

const fmtArea = (n) => (Number(n) > 0 ? `${Number(n).toLocaleString('en-US')} م²` : '—');

/* ── Donut chart (SVG — يطبع متجهي وحاد) ─────────────────────────────────── */
function Donut({ segments, size = 128, thickness = 22, center, centerSub }) {
  const data  = segments.filter(s => (s.value ?? 0) > 0);
  const total = data.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.panel2} strokeWidth={thickness} />
        {total > 0 && data.map((seg, i) => {
          const len = (seg.value / total) * circ;
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={seg.color} strokeWidth={thickness}
              strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-acc} strokeLinecap="butt" />
          );
          acc += len;
          return el;
        })}
      </g>
      <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" fill={C.hi} fontSize="15" fontWeight="800">{center}</text>
      {centerSub && <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fill={C.faint} fontSize="8.5">{centerSub}</text>}
    </svg>
  );
}

function DonutSection({ title, segments, colors, totalLabel, totalColor = C.hi, isAr }) {
  const data  = segments.map((s, i) => ({ ...s, color: colors[i % colors.length] })).filter(s => (s.value ?? 0) > 0);
  const total = data.reduce((s, x) => s + x.value, 0);
  if (total <= 0) return null;
  return (
    <Section title={title}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 13, padding: 16 }}>
        <Donut segments={data} center={fmtK(total)} centerSub={isAr ? 'ريال' : 'SAR'} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {data.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 11, color: C.lo }}>{s.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.hi }}>{fmtK(s.value)}</span>
              <span style={{ fontSize: 9.5, color: C.faint, minWidth: 34, textAlign: 'left' }}>{((s.value / total) * 100).toFixed(0)}%</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 4, paddingTop: 8, borderTop: `1.5px solid ${C.borderSoft}` }}>
            <span style={{ flex: 1, fontSize: 11.5, fontWeight: 800, color: C.hi }}>{totalLabel}</span>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: totalColor }}>{fmtK(total)} <span style={{ fontSize: 8.5, color: C.faint }}>ريال</span></span>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ── Primitives ───────────────────────────────────────────────────────────── */
function Badge({ color = C.beige, children }) {
  return (
    <span style={{ display: 'inline-block', padding: '4px 13px', borderRadius: 20, fontSize: 10, fontWeight: 700, color, background: `${color}20`, border: `1px solid ${color}55` }}>
      {children}
    </span>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 22, breakInside: 'avoid' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 4, height: 15, borderRadius: 2, background: `linear-gradient(${C.beige}, ${C.brown})` }} />
        <div style={{ fontSize: 13, fontWeight: 800, color: C.hi }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

function Metric({ label, value, unit, color = C.hi }) {
  return (
    <div style={{ flex: 1, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: '13px 15px' }}>
      <div style={{ fontSize: 9.5, color: C.muted, marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {unit && <div style={{ fontSize: 9, color: C.faint, marginTop: 3 }}>{unit}</div>}
    </div>
  );
}

function Detail({ label, value }) {
  if (value == null || value === '' || value === '—' || value === 0) return null;
  return (
    <div style={{ padding: '9px 12px', background: C.panel, border: `1px solid ${C.border}`, borderRadius: 9 }}>
      <div style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: C.hi }}>{value}</div>
    </div>
  );
}

function MiniHeader({ p, isAr, subtitle }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src={`${import.meta.env.BASE_URL}rasf-logo.png`} alt="RASF" style={{ width: 30, height: 30, borderRadius: 7 }} />
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: C.hi }}>{p.name}</div>
          <div style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>{subtitle}</div>
        </div>
      </div>
      <div style={{ fontSize: 9, color: C.faint }}>{isAr ? 'رصف للاستثمار' : 'RASF Investment'}</div>
    </div>
  );
}

/* ── Report ───────────────────────────────────────────────────────────────── */
export default function ProjectReportSheet({ project: p, lang = 'ar' }) {
  const isAr = lang === 'ar';
  const now  = new Date().toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const netProfit = p.netProfit ?? ((p.costs?.totalRevenue ?? 0) - (p.costs?.totalCost ?? 0));
  const totalRev  = p.costs?.totalRevenue ?? 0;
  const totalCost = p.costs?.totalCost ?? 0;
  const margin    = totalRev ? (netProfit / totalRev) * 100 : null;

  const phases   = p.phases?.length ? p.phases : PHASE_KEYS.map(key => ({ key, status: 'pending' }));
  const progress = progressFromPhases(phases) ?? p.progress ?? 0;
  const money    = (v) => fmtK(v);

  // مكوّنات المشروع (مساحات البناء GBA + مساحة البيع NSA + الوحدات)
  const comps = (Array.isArray(p.componentBreakdown) ? p.componentBreakdown : [])
    .map(b => ({
      name:  isAr ? (b.nameAr || b.nameEn || b.key || b.labelKey || '—') : (b.nameEn || b.nameAr || b.key || b.labelKey || '—'),
      gba:   Number(b.gba || b.area || 0),
      nsa:   Number(b.nsa || 0),
      units: Number(b.unitCount || b.units || 0),
    }))
    .filter(c => c.gba > 0 || c.nsa > 0 || c.units > 0);
  const totGba   = comps.reduce((s, c) => s + c.gba, 0);
  const totNsa   = comps.reduce((s, c) => s + c.nsa, 0);
  const totUnits = comps.reduce((s, c) => s + c.units, 0);

  const costSegs = [
    { label: isAr ? 'الأرض' : 'Land',            value: p.costs?.landCost },
    { label: isAr ? 'البناء والتطوير' : 'Construction', value: p.costs?.constructionCost },
    { label: isAr ? 'التمويل' : 'Financing',      value: p.costs?.financingCost },
    { label: isAr ? 'المطوّر' : 'Developer',      value: p.costs?.developerCost },
    { label: isAr ? 'الصندوق' : 'Fund',           value: p.costs?.fundCost },
    { label: isAr ? 'التشغيل' : 'Operational',    value: p.costs?.operationalCost },
    { label: isAr ? 'أخرى' : 'Other',             value: p.costs?.otherCost },
  ];
  const revSegs = [
    { label: isAr ? 'مبيعات مباشرة' : 'Direct Sales', value: p.costs?.directSalesRevenue },
    { label: isAr ? 'بيع على الخارطة' : 'Off-plan',    value: p.costs?.offplanRevenue },
    { label: isAr ? 'إيجاري سنوي' : 'Annual Rental',   value: p.costs?.annualRentalRevenue },
    { label: isAr ? 'إيجاري يومي' : 'Daily Rental',    value: p.costs?.dailyRentalRevenue },
    { label: isAr ? 'قيمة الخروج' : 'Exit Value',      value: p.costs?.exitValue },
  ];
  // هيكل التمويل — المصدر الأساسي project.financing (مطابق للتطبيق)، مع رجوع لـ funding القديم
  const fin      = p.financing ?? {};
  const finItems = FIN_ITEMS.map(d => ({ ...d, value: Number(fin[d.key] ?? 0) })).filter(i => i.value > 0);
  const fundSegs = finItems.length
    ? finItems.map(i => ({ label: isAr ? i.ar : i.en, value: i.value }))
    : [
        { label: isAr ? 'تمويل بنكي' : 'Bank Financing', value: p.funding?.bank },
        { label: isAr ? 'تمويل الأرض' : 'Land Funding',   value: p.funding?.land },
        { label: isAr ? 'اكتتاب/اشتراكات' : 'Subscription', value: p.funding?.subscription },
        { label: isAr ? 'بيع على الخارطة' : 'Off-plan',   value: p.funding?.offplan },
      ];
  const equitySegs = finItems.filter(i => i.equity).map(i => ({ label: isAr ? i.ar : i.en, value: i.value }));

  const page = { width: PW, minHeight: PH, background: C.bg, boxSizing: 'border-box', position: 'relative', overflow: 'hidden' };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ width: PW, background: C.bg, color: C.hi, fontFamily: "'Almarai', 'Inter', sans-serif" }}>

      {/* ═══ PAGE 1 — نظرة عامة ═══ */}
      <div style={{ ...page, breakAfter: 'page', display: 'flex', flexDirection: 'column' }}>
        {/* Hero band */}
        <div style={{ background: `linear-gradient(135deg, ${C.panel} 0%, ${C.band} 100%)`, borderBottom: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ height: 5, background: `linear-gradient(90deg, ${C.brown}, ${C.beige} 50%, ${C.brown})` }} />
          <div style={{ position: 'absolute', top: -120, insetInlineEnd: -100, width: 360, height: 360, borderRadius: '50%', background: `radial-gradient(circle, ${C.beige}14 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ padding: '26px 44px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={`${import.meta.env.BASE_URL}rasf-logo.png`} alt="RASF" style={{ width: 46, height: 46, borderRadius: 9 }} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: C.hi }}>رصف للاستثمار</div>
                  <div style={{ fontSize: 9.5, color: C.lo, marginTop: 2 }}>{isAr ? 'نظام تطوير الأعمال' : 'Business Development System'}</div>
                </div>
              </div>
              <div style={{ textAlign: isAr ? 'left' : 'right' }}>
                <div style={{ fontSize: 9, color: C.faint }}>{isAr ? 'تاريخ التقرير' : 'Report date'}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.beige, marginTop: 2 }}>{now}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 9.5, color: C.beige, fontWeight: 700, letterSpacing: 2 }}>{isAr ? 'تقرير المشروع' : 'PROJECT REPORT'}</span>
              {p.projectCode && (
                <span style={{ fontSize: 9.5, fontWeight: 700, color: C.brown, background: `${C.beige}22`, border: `1px solid ${C.beige}66`, borderRadius: 5, padding: '2px 9px', letterSpacing: 0.5, direction: 'ltr' }}>
                  {isAr ? 'كود: ' : 'Code: '}{p.projectCode}
                </span>
              )}
            </div>
            <div style={{ fontSize: 29, fontWeight: 900, color: C.hi, marginTop: 5, lineHeight: 1.12 }}>{p.name}</div>
            <div style={{ fontSize: 12.5, color: C.lo, marginTop: 6 }}>{p.location}{p.subtitle ? ` · ${p.subtitle}` : ''}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 13, flexWrap: 'wrap' }}>
              <Badge color={C.deep}>{(isAr ? STATUS_AR : STATUS_EN)[p.status] ?? p.status}</Badge>
              {p.type && <Badge color={C.accent}>{(isAr ? TYPE_AR : TYPE_EN)[p.type] ?? p.type}</Badge>}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px 44px 34px' }}>
          {/* Hero metrics */}
          <div style={{ display: 'flex', gap: 12 }}>
            <Metric label={isAr ? 'قيمة الاستثمار' : 'Investment'} value={money(p.investmentM)} unit={isAr ? 'ريال' : 'SAR'} color={C.beige} />
            <Metric label={isAr ? 'إجمالي الإيراد' : 'Total Revenue'} value={money(totalRev)} unit={isAr ? 'ريال' : 'SAR'} color={C.pos} />
            <Metric label={isAr ? 'صافي الربح' : 'Net Profit'} value={money(netProfit)} unit={isAr ? 'ريال' : 'SAR'} color={C.pos} />
            <Metric label="IRR" value={fmtPct(p.irr)} color={C.accent} />
          </div>

          {/* Returns strip */}
          <div style={{ display: 'flex', marginTop: 12, background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
            {[
              { l: 'ROI', v: fmtPct(p.roi) },
              { l: 'IRR', v: fmtPct(p.irr) },
              { l: 'ROE', v: fmtPct(p.roeAnnual) },
              { l: 'MOIC', v: totalCost > 0 ? `${(totalRev / totalCost).toFixed(2)}x` : '—' },
              { l: isAr ? 'فترة الاسترداد' : 'Payback', v: p.paybackYears != null ? `${p.paybackYears} ${isAr ? 'سنة' : 'yr'}` : '—' },
            ].map((x, i) => (
              <div key={x.l} style={{ flex: 1, textAlign: 'center', padding: '11px 6px', borderInlineStart: i ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.beige }}>{x.v}</div>
                <div style={{ fontSize: 9, color: C.muted, marginTop: 3 }}>{x.l}</div>
              </div>
            ))}
          </div>

          {/* Project details */}
          <Section title={isAr ? 'تفاصيل المشروع' : 'Project Details'}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              <Detail label={isAr ? 'مساحة الأرض' : 'Land Area'} value={p.area} />
              <Detail label={isAr ? 'مسطحات فوق الأرض' : 'Above-grade GBA'} value={p.aboveGradeGBA} />
              <Detail label={isAr ? 'القبو' : 'Basement'} value={p.belowGradeGBA} />
              <Detail label={isAr ? 'إجمالي المسطحات' : 'Total GBA'} value={p.totalGBA} />
              <Detail label={isAr ? 'المساحة البيعية' : 'Net Sellable Area'} value={p.nsaArea || (totNsa > 0 ? fmtArea(totNsa) : null)} />
              <Detail label={isAr ? 'معامل البناء (FAR)' : 'FAR'} value={p.farValue && p.farValue !== '—' ? `${p.farValue}x` : null} />
              <Detail label={isAr ? 'عدد الوحدات' : 'Units'} value={p.units} />
              <Detail label={isAr ? 'متوسط سعر الوحدة' : 'Avg Unit Price'} value={p.avgUnitPrice ? `${money(p.avgUnitPrice)} ريال` : null} />
              <Detail label={isAr ? 'تاريخ الفرصة' : 'Opportunity Date'} value={p.opportunityDate} />
              <Detail label={isAr ? 'تاريخ التسليم' : 'Delivery Date'} value={p.deliveryDate} />
              <Detail label={isAr ? 'تاريخ البدء' : 'Start Date'} value={p.startDate} />
              <Detail label={isAr ? 'آخر تحديث' : 'Last Update'} value={p.lastUpdated} />
            </div>
          </Section>

          {/* Components & areas */}
          {comps.length > 0 && (
            <Section title={isAr ? 'مكوّنات المشروع ومساحاتها' : 'Project Components & Areas'}>
              <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'flex', padding: '9px 14px', background: C.panel2, fontSize: 9.5, fontWeight: 700, color: C.muted }}>
                  <span style={{ flex: 2 }}>{isAr ? 'المكوّن' : 'Component'}</span>
                  <span style={{ flex: 1.1, textAlign: 'center' }}>{isAr ? 'المسطحات' : 'GBA'}</span>
                  <span style={{ flex: 1.1, textAlign: 'center' }}>{isAr ? 'المساحة البيعية' : 'Sellable (NSA)'}</span>
                  <span style={{ flex: 0.7, textAlign: 'center' }}>{isAr ? 'الوحدات' : 'Units'}</span>
                </div>
                {comps.map((c, i) => (
                  <div key={i} style={{ display: 'flex', padding: '9px 14px', fontSize: 11, borderTop: `1px solid ${C.line}`, background: i % 2 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                    <span style={{ flex: 2, fontWeight: 700, color: C.hi }}>{c.name}</span>
                    <span style={{ flex: 1.1, textAlign: 'center', color: C.lo }}>{fmtArea(c.gba)}</span>
                    <span style={{ flex: 1.1, textAlign: 'center', color: C.beige, fontWeight: 600 }}>{fmtArea(c.nsa)}</span>
                    <span style={{ flex: 0.7, textAlign: 'center', color: C.lo }}>{c.units || '—'}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', padding: '10px 14px', fontSize: 11.5, fontWeight: 800, borderTop: `1.5px solid ${C.borderSoft}`, background: C.panel2 }}>
                  <span style={{ flex: 2, color: C.hi }}>{isAr ? 'الإجمالي' : 'Total'}</span>
                  <span style={{ flex: 1.1, textAlign: 'center', color: C.hi }}>{fmtArea(totGba)}</span>
                  <span style={{ flex: 1.1, textAlign: 'center', color: C.beige }}>{fmtArea(totNsa)}</span>
                  <span style={{ flex: 0.7, textAlign: 'center', color: C.hi }}>{totUnits || p.units || '—'}</span>
                </div>
              </div>
            </Section>
          )}

        </div>
      </div>

      {/* ═══ PAGE 2 — المراحل + التكاليف والإيرادات ═══ */}
      <div style={{ ...page, breakAfter: 'page', padding: '38px 44px 30px', display: 'flex', flexDirection: 'column' }}>
        <MiniHeader p={p} isAr={isAr} subtitle={isAr ? 'المراحل والتكاليف والإيرادات' : 'Phases, Cost & Revenue'} />

        {/* توزيع الأقسام عموديًا لتملأ الصفحة بتباعد متوازن (بدل فجوة كبيرة أسفلها) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Phases — progress ring + gates */}
          <Section title={isAr ? 'مراحل المشروع' : 'Project Phases'}>
            <div style={{ display: 'flex', gap: 18, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 13, padding: 16, alignItems: 'center' }}>
              <Donut
                segments={[{ value: progress, color: C.beige }, { value: Math.max(0, 100 - progress), color: 'transparent' }]}
                center={`${progress}%`} centerSub={isAr ? 'إنجاز' : 'done'} size={116} thickness={18}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {phases.map((ph, i) => {
                  const key = PHASE_KEYS[i] ?? ph.key;
                  const g   = GATE[phaseStatusOf(ph)] ?? GATE.pending;
                  return (
                    <div key={ph.key ?? i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: `${g.color}22`, border: `1.5px solid ${g.color}66`, color: g.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 800 }}>{`0${i + 1}`}</div>
                      <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: C.hi }}>{(isAr ? PHASE_AR : PHASE_EN)[key] ?? key}</div>
                      <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, minWidth: 40, textAlign: 'center' }}>{PHASE_WEIGHTS[key] ?? PHASE_WEIGHTS[ph.key] ?? 0}%</div>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: g.color, background: `${g.color}18`, border: `1px solid ${g.color}44`, borderRadius: 5, padding: '2px 9px', minWidth: 56, textAlign: 'center' }}>{isAr ? g.ar : g.en}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Section>

          <DonutSection title={isAr ? 'هيكل التكاليف' : 'Cost Structure'} segments={costSegs} colors={COST_COLORS} totalLabel={isAr ? 'إجمالي التكاليف' : 'Total Cost'} totalColor={C.beige} isAr={isAr} />
          <DonutSection title={isAr ? 'هيكل الإيرادات' : 'Revenue Structure'} segments={revSegs} colors={REV_COLORS} totalLabel={isAr ? 'إجمالي الإيرادات' : 'Total Revenue'} totalColor={C.pos} isAr={isAr} />
        </div>

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 9, color: C.faint }}>رصف — RASF Development Management</div>
          <div style={{ fontSize: 9, color: C.faint }}>{p.name} · {now}</div>
        </div>
      </div>

      {/* ═══ PAGE 3 — التمويل والملكية والربحية ═══ */}
      <div style={{ ...page, padding: '38px 44px 30px', display: 'flex', flexDirection: 'column' }}>
        <MiniHeader p={p} isAr={isAr} subtitle={isAr ? 'التمويل والملكية والربحية' : 'Funding, Equity & Profitability'} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <DonutSection title={isAr ? 'هيكل التمويل' : 'Funding Structure'} segments={fundSegs} colors={FUND_COLORS} totalLabel={isAr ? 'إجمالي التمويل' : 'Total Funding'} totalColor={C.beige} isAr={isAr} />
          <DonutSection title={isAr ? 'هيكل الملكية' : 'Equity Structure'} segments={equitySegs} colors={EQUITY_COLORS} totalLabel={isAr ? 'إجمالي حقوق الملكية' : 'Total Equity'} totalColor={C.beige} isAr={isAr} />

          {/* Profitability summary */}
          <Section title={isAr ? 'ملخص الربحية' : 'Profitability Summary'}>
            <div style={{ display: 'flex', gap: 12 }}>
              <Metric label={isAr ? 'إجمالي الإيراد' : 'Revenue'} value={money(totalRev)} unit={isAr ? 'ريال' : 'SAR'} color={C.pos} />
              <Metric label={isAr ? 'إجمالي التكاليف' : 'Cost'} value={money(totalCost)} unit={isAr ? 'ريال' : 'SAR'} color={C.beige} />
              <Metric label={isAr ? 'صافي الربح' : 'Net Profit'} value={money(netProfit)} unit={isAr ? 'ريال' : 'SAR'} color={C.pos} />
              <Metric label={isAr ? 'هامش الربح' : 'Margin'} value={margin != null ? fmtPct(margin) : '—'} color={C.accent} />
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 9, color: C.faint }}>رصف — RASF Development Management</div>
          <div style={{ fontSize: 9, color: C.faint }}>{p.name} · {now}</div>
        </div>
      </div>
    </div>
  );
}
