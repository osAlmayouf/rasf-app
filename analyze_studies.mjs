import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { join } from 'path';

const FILES = [
  'QUR.xlsm',
  'Radian.xlsm',
  'الخليج.xlsm',
  'الوزارات.xlsm',
  'انسباير.xlsm',
];
const DIR = 'C:\\Users\\Abu34\\OneDrive\\سطح المكتب\\app\\الداراسات';

const PATTERNS = {
  projectName:     ['اسم المشروع', 'Project Name', 'اسم الصندوق', 'اسم مشروع', 'اسم العقار'],
  location:        ['موقع المشروع', 'الموقع', 'المدينة', 'المنطقة', 'Location', 'City'],
  status:          ['حالة المشروع', 'الحالة', 'Project Status'],
  projectType:     ['نوع المشروع', 'تصنيف المشروع', 'Project Type'],
  startDate:       ['تاريخ بدء المشروع', 'تاريخ الإطلاق', 'Start Date'],
  deliveryDate:    ['تاريخ التسليم', 'موعد التسليم', 'تاريخ الإنجاز', 'Delivery Date', 'Handover'],
  paybackYears:    ['مدة المشروع المتوقعة', 'مدة المشروع - بالسنين', 'مدة التنفيذ المتوقعة', 'Expected implementation duration'],

  investmentM:     ['إجمالي التكاليف الرأسمالية', 'إجمالي التكاليف رأسمالية', 'Total CapEx',
                    'إجمالي تكلفة المشروع', 'Total project cost', 'إجمالي الاستثمار', 'حجم الاستثمار'],
  totalRevenue:    ['إجمالي الإيرادات', 'الإيرادات (Revenues)', 'Revenue - الايرادات', 'إجمالي المبيعات'],
  netProfit:       ['صافي الدخل (Net income)', 'صافي الدخل', 'صافي الربح', 'الربح الصافي', 'Net Profit', 'Net income'],
  irr:             ['معدل العائد الداخلي', 'IRR', 'Internal Rate of Return'],
  roi:             ['العائد على الإستثمار', 'العائد على الاستثمار', 'ROI', 'Return on Investment'],
  roeAnnual:       ['العائد على الملكية سنوياَ', 'العائد على الملكية السنوي', 'ROE Annual', 'ROE Annually', 'ROE Annualy'],
  moic:            ['مضاعف رأس المال', 'MOIC', 'Money-on-Money'],

  totalCost:       ['إجمالي التكاليف الكاملة', 'إجمالي التكاليف الكاملة للمشروع', 'اجمالي تكاليف الصندوق'],
  landCost:        ['اجمالي تكلفة الأرض', 'إجمالي تكلفة الأرض', 'تكلفة الأرض (Land cost)', 'Land Cost'],
  constructionCost:['اجمالي تكلفة البناء', 'إجمالي تكاليف البناء', 'Total construction cost'],
  financingCost:   ['رسوم التمويل (Finance fees)', 'فوائد التمويل', 'تكلفة التمويل', 'اجمالي تكلفة القرض'],
  fundFees:        ['إجمالي تكاليف الصندوق', 'إجمالي رسوم الصندوق', 'Total Fund Fees'],

  area:            ['مساحة الأرض الإجمالية', 'إجمالي مساحة الأرض', 'Land Area', 'مساحة الأرض'],
  farValue:        ['معامل البناء (FAR)', 'معامل البناء', 'FAR'],
  totalGBA:        ['إجمالي المساحة المبنية', 'إجمالي مسطحات البناء الكلية', 'Total BUA', 'إجمالي مسطحات البناء',
                    'إجمالي مكونات البناء - GBA', 'إجمالي المساحة التطويرية'],
  nsaArea:         ['صافي المساحة القابلة للبيع', 'NSA', 'Net Sellable Area', 'إجمالي المساحات القابلة للبيع (NSA)'],
  aboveGradeGBA:   ['إجمالي مسطحات البناء فوق الأرض', 'إجمالي المساحة فوق مستوى الأرض'],
  belowGradeGBA:   ['قبو - إجمالي المساحة', 'إجمالي مسطحات البناء تحت الأرض'],

  units:           ['إجمالي عدد الوحدات', 'Total Units', 'الإجمالي (Total)'],
  residentialUnits:['سكني - عدد الوحدات', 'سكني ( Apartments)'],
  studioUnits:     ['أستوديوهات - عدد الوحدات', 'استوديوهات - عدد الوحدات'],
  officeUnits:     ['مكتبي - عدد الوحدات', 'مكتبي (Office)'],
  commercialUnits: ['تجاري - عدد الوحدات', 'تجاري (Retail)'],
  hotelUnits:      ['فندقي - عدد الوحدات'],

  bankPct:         ['نسبة التمويل البنكي', 'Bank Financing %', 'نسبة التمويل',
                    'التمويل البنكي - (Bank Financing)', 'التمويل البنكي'],
  subscriptionPct: ['نسبة الاشتراكات النقدية', 'Cash subscriptions %',
                    'الاشتراكات النقدية - (Cash Subscription)', 'الاشتراكات النقدية'],
  landEquityPct:   ['نسبة الاشتراك العيني من مالك الأرض', 'نسبة الاشتراك العيني من المطور',
                    'الأشتراك العيني من مالك الأرض', 'الأشتراك العيني من المطور',
                    'الإشتراك العيني من مالك الأرض'],
  offplanPct:      ['نسبة البيع على الخارطة', 'Off-plan %',
                    'البيع على الخارطة - (Off-Plan Sales)', 'البيع على الخارطة'],

  totalEquity:     ['إجمالي الملكية'],
  bankFinancingAmount: ['إجمالي التمويل البنكي', 'التمويل المطلوب'],
  annualRentalRevenue: ['إجمالي إيرادات التأجير السنوي'],
  dailyRentalRevenue:  ['إجمالي إيرادات التأجير اليومي'],
  directSalesRevenue:  ['إجمالي مبيعات البيع المباشر', 'البيع المباشر - قيمة إجمالية'],
  offplanRevenue:      ['إجمالي إيرادات البيع على الخارطة', 'صافي المبيعات على الخارطة'],
  exitValue:           ['إجمالي قيمة المخارجة'],
};

function matchesAny(val, keywords) {
  if (typeof val !== 'string') return false;
  const norm = val.trim().toLowerCase();
  return keywords.some(kw => norm.includes(kw.toLowerCase()));
}

function normalizeNum(v) {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return null;
  const n = parseFloat(v.replace(/[,،\s%()\-]/g, ''));
  return isNaN(n) ? null : n;
}

function toPercent(num) {
  if (num == null) return null;
  const pct = num > 0 && num <= 1 ? num * 100 : num;
  return pct > 0 && pct < 500 ? +pct.toFixed(2) : null;
}

function toMillions(raw) {
  if (raw == null || raw <= 0) return null;
  if (raw >= 1_000_000) return +(raw / 1_000_000).toFixed(2);
  if (raw >= 1 && raw < 500) return raw; // already in millions
  return null;
}

const SAR_FIELDS  = new Set(['investmentM','totalRevenue','netProfit','totalCost','landCost','constructionCost','financingCost','fundFees','totalEquity','bankFinancingAmount','annualRentalRevenue','dailyRentalRevenue','directSalesRevenue','offplanRevenue','exitValue']);
const PCT_FIELDS  = new Set(['irr','roi','roeAnnual','bankPct','offplanPct','subscriptionPct','landEquityPct']);
const NUM_FIELDS  = new Set(['farValue','paybackYears','moic']);
const UNIT_FIELDS = new Set(['units','residentialUnits','studioUnits','officeUnits','commercialUnits','hotelUnits']);
const AREA_FIELDS = new Set(['area','totalGBA','nsaArea','aboveGradeGBA','belowGradeGBA']);

function analyzeFile(filename) {
  const path = join(DIR, filename);
  const buf  = readFileSync(path);
  const wb   = XLSX.read(buf, { type: 'buffer', cellText: true, cellDates: true });

  const allKeywords = Object.values(PATTERNS).flat();

  const bySheet = {};
  for (const sn of wb.SheetNames) {
    const ws = wb.Sheets[sn];
    if (!ws || !ws['!ref']) continue;
    bySheet[sn] = [];
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
        if (!cell || cell.v == null) continue;
        bySheet[sn].push({ r: R, c: C, v: cell.v, w: cell.w });
      }
    }
  }

  function getAdj(sheetName, r, c, maxCol = 10, maxRow = 4) {
    const candidates = (bySheet[sheetName] ?? []).filter(cell =>
      (cell.r === r && cell.c > c && cell.c <= c + maxCol) ||
      (cell.c === c && cell.r > r && cell.r <= r + maxRow)
    ).sort((a, b) => {
      const ar = a.r === r ? 0 : 1, br = b.r === r ? 0 : 1;
      if (ar !== br) return ar - br;
      return (Math.abs(a.r-r)+Math.abs(a.c-c)) - (Math.abs(b.r-r)+Math.abs(b.c-c));
    });
    for (const cell of candidates) {
      const v = cell.v;
      if (v == null || v === '' || v === 0 || v === '-') continue;
      if (typeof v === 'string' && allKeywords.some(kw => v.toLowerCase().includes(kw.toLowerCase()))) continue;
      return cell;
    }
    return null;
  }

  const result = {};
  const hits   = [];

  for (const sn of wb.SheetNames) {
    for (const cell of (bySheet[sn] ?? [])) {
      const label = typeof cell.v === 'string' ? cell.v.trim() : String(cell.v);

      for (const [field, keywords] of Object.entries(PATTERNS)) {
        if (result[field] != null) continue;
        if (!matchesAny(label, keywords)) continue;

        const isTextField = field === 'projectName' || field === 'location' || field === 'projectType';
        const adj = getAdj(sn, cell.r, cell.c, isTextField ? 3 : 10, isTextField ? 2 : 4);
        if (!adj) continue;
        const raw = adj.v;
        const disp = adj.w || String(raw);

        if (field === 'startDate' || field === 'deliveryDate') {
          if (raw instanceof Date)
            result[field] = `Q${Math.ceil((raw.getMonth()+1)/3)} ${raw.getFullYear()}`;
          else { const s = String(raw).trim(); if (s.length > 0 && s.length < 25 && /\d/.test(s)) result[field] = s; }
        } else if (field === 'projectName' || field === 'location' || field === 'projectType') {
          if (typeof raw === 'string' && raw.trim().length > 0 && raw.trim().length < 100)
            result[field] = raw.trim();
        } else if (SAR_FIELDS.has(field)) {
          // Skip percentage-formatted cells
          if (disp.trim().endsWith('%')) break;
          const m = toMillions(normalizeNum(raw));
          if (m && m > 0) result[field] = m;
        } else if (PCT_FIELDS.has(field)) {
          const p = toPercent(normalizeNum(raw));
          if (p != null) result[field] = p;
        } else if (NUM_FIELDS.has(field)) {
          const n = normalizeNum(raw);
          if (n != null && n > 0) result[field] = +n.toFixed(2);
        } else if (UNIT_FIELDS.has(field)) {
          const n = normalizeNum(raw);
          if (n != null && n > 0) result[field] = Math.round(n);
        } else if (AREA_FIELDS.has(field)) {
          const n = normalizeNum(raw);
          if (n != null && n > 0) result[field] = `${Math.round(n).toLocaleString()} م²`;
        }

        if (result[field] != null)
          hits.push({ field, label: label.substring(0,50), value: disp.substring(0,30), sheet: sn });
        break;
      }
    }
  }

  return { result, hits, sheets: wb.SheetNames };
}

for (const file of FILES) {
  console.log('\n' + '═'.repeat(70));
  console.log(`📊  ${file}`);
  console.log('═'.repeat(70));

  try {
    const { result, hits, sheets } = analyzeFile(file);

    console.log(`\n📋  الأوراق: ${sheets.join(' | ')}`);
    console.log(`\n✅  البيانات المستخرجة (${hits.length} حقل):\n`);

    const sections = {
      '🏢 معلومات المشروع':   ['projectName','location','projectType','startDate','deliveryDate','paybackYears'],
      '💰 المؤشرات المالية':  ['investmentM','totalRevenue','netProfit','irr','roi','roeAnnual','moic'],
      '📐 المساحات':          ['area','farValue','aboveGradeGBA','belowGradeGBA','totalGBA','nsaArea'],
      '🏠 الوحدات':           ['units','residentialUnits','studioUnits','officeUnits','commercialUnits','hotelUnits'],
      '💵 مصادر الإيرادات':   ['directSalesRevenue','annualRentalRevenue','dailyRentalRevenue','offplanRevenue','exitValue'],
      '🏦 التمويل':           ['bankPct','subscriptionPct','landEquityPct','offplanPct','bankFinancingAmount','totalEquity'],
      '🧾 ملخص التكاليف':    ['totalCost','landCost','constructionCost','financingCost','fundFees'],
    };

    for (const [sec, fields] of Object.entries(sections)) {
      const rows = fields.filter(f => result[f] != null);
      if (rows.length === 0) continue;
      console.log(`  ${sec}`);
      for (const f of rows) {
        const v = result[f];
        const suffix =
          SAR_FIELDS.has(f)  ? ' M ر.س' :
          PCT_FIELDS.has(f)  ? '%' :
          AREA_FIELDS.has(f) ? '' :
          UNIT_FIELDS.has(f) ? ' وحدة' : '';
        console.log(`    ${f.padEnd(22)}: ${v}${suffix}`);
      }
      console.log();
    }

    const missing = Object.keys(PATTERNS).filter(f => result[f] == null);
    if (missing.length > 0)
      console.log(`  ⚠️  حقول لم تُستخرج (${missing.length}): ${missing.join(', ')}`);

  } catch (err) {
    console.log(`  ❌ خطأ: ${err.message}`);
  }
}
