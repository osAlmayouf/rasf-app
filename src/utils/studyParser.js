import * as XLSX from 'xlsx';

// ─── COMPONENT TYPES ─────────────────────────────────────────────────────────
const COMPONENT_TYPES = [
  { key: 'residential', prefixes: ['سكني'],                nameAr: 'سكني',        nameEn: 'Residential' },
  { key: 'villas',      prefixes: ['فلل'],                  nameAr: 'فلل',          nameEn: 'Villas' },
  { key: 'townhouse',   prefixes: ['تاون هاوس', 'تاونهاوس'], nameAr: 'تاون هاوس',  nameEn: 'Townhouse' },
  { key: 'floors',      prefixes: ['أدوار'],                 nameAr: 'أدوار',        nameEn: 'Floors' },
  { key: 'studios',     prefixes: ['أستوديوهات', 'استوديوهات', 'ستوديو'], nameAr: 'أستوديوهات', nameEn: 'Studios' },
  { key: 'office',      prefixes: ['مكتبي'],                 nameAr: 'مكتبي',        nameEn: 'Office' },
  { key: 'commercial',  prefixes: ['تجاري'],                 nameAr: 'تجاري',        nameEn: 'Commercial' },
  { key: 'hotel',       prefixes: ['فندقي'],                 nameAr: 'فندقي',        nameEn: 'Hotel' },
  { key: 'medical',     prefixes: ['صحي'],                   nameAr: 'صحي',          nameEn: 'Medical' },
  { key: 'other',       prefixes: ['أخرى'],                  nameAr: 'أخرى',         nameEn: 'Other' },
];

// ─── KEYWORD PATTERNS ────────────────────────────────────────────────────────
const PATTERNS = {

  // ── PROJECT INFO ──────────────────────────────────────────────────────────
  projectName:    ['اسم المشروع', 'Project Name', 'اسم الصندوق', 'اسم مشروع', 'اسم العقار'],
  location:       ['موقع المشروع', 'الموقع', 'المدينة', 'المنطقة', 'Location', 'City'],
  projectType:    ['نوع المشروع', 'تصنيف المشروع', 'Project Type'],
  status:         ['حالة المشروع', 'الحالة', 'Project Status'],
  startDate:      ['تاريخ بدء المشروع', 'تاريخ الإطلاق', 'Start Date'],
  deliveryDate:   ['تاريخ التسليم', 'موعد التسليم', 'تاريخ الإنجاز', 'Delivery Date', 'Handover'],
  paybackYears:   ['مدة المشروع المتوقعة', 'مدة المشروع - بالسنين', 'مدة التنفيذ المتوقعة',
                   'مدة الاسترداد', 'Expected implementation duration'],

  // ── MAIN KPIs ─────────────────────────────────────────────────────────────
  investmentM:      ['إجمالي التكاليف الرأسمالية', 'إجمالي التكاليف رأسمالية', 'Total CapEx',
                     'Total capital costs', 'إجمالي تكلفة المشروع', 'Total project cost',
                     'إجمالي الاستثمار', 'حجم الاستثمار', 'قيمة المشروع'],
  totalRevenue:     ['إجمالي الإيرادات', 'الإيرادات (Revenues)', 'Revenue - الايرادات',
                     'إجمالي المبيعات', 'Total Revenue', 'Total Sales'],
  netProfit:        ['صافي الدخل (Net income)', 'صافي الربح', 'الربح الصافي',
                     'Net Profit', 'Net income', 'صافي الدخل'],
  irr:              ['معدل العائد الداخلي', 'IRR', 'Internal Rate of Return'],
  roi:              ['العائد على الإستثمار', 'العائد على الاستثمار', 'ROI',
                     'Return on Investment', 'نسبة العائد'],
  roeAnnual:        ['العائد على الملكية سنوياَ', 'العائد على الملكية السنوي',
                     'ROE Annualy', 'ROE Annual', 'ROE Annually'],
  moic:             ['مضاعف رأس المال', 'MOIC', 'Money-on-Money', 'مضاعف الأموال'],

  // ── COSTS SUMMARY ─────────────────────────────────────────────────────────
  totalCost:        ['إجمالي التكاليف الكاملة', 'اجمالي تكاليف الصندوق', 'Total fund costs',
                     'Total project cost', 'التكلفة الإجمالية للمشروع',
                     'التكلفة الإجمالية + مصاريف الصندوق',
                     'إجمالي التكاليف الكاملة للمشروع'],
  operationalCost:  ['إجمالي التكاليف التشغيلية', 'التكاليف التشغيلية', 'Total OpEx', 'OpEx'],

  // ── COST BREAKDOWN ────────────────────────────────────────────────────────
  landCost:         ['اجمالي تكلفة الأرض', 'إجمالي تكلفة الأرض',
                     'تكلفة الأرض (Land cost)', 'Land Cost', 'Total Land Cost',
                     'Total cost of land', 'إجمالي تكلفة الأرض بعد الضرائب'],
  constructionCost: ['اجمالي تكلفة البناء', 'إجمالي تكاليف البناء',
                     'تكلفة التطوير (Development cost)', 'Total construction cost',
                     'Construction Cost', 'تكلفة تطوير', 'Development cost',
                     'إجمالي تكاليف البناء', 'تكاليف مسطحات البناء'],
  finishingCost:    ['إجمالي تكاليف التشطيب', 'تكلفة التشطيب', 'Finishing Cost'],
  otherCost:        ['مجموع التكاليف الأخرى', 'تكاليف أخرى (Other cost)',
                     'إجمالي التكاليف الأخرى', 'Total other costs', 'soft cost'],
  fundFees:         ['إجمالي تكاليف الصندوق', 'رسوم الصندوق (Fund costs)',
                     'رسوم الصندوق (Fund fees)', 'إجمالي رسوم الصندوق',
                     'Total Fund Fees', 'Fund Fees', 'Fund costs',
                     'إجمالي مصروفات الصندوق'],
  financingCost:    ['رسوم التمويل (Finance fees)', 'فوائد التمويل', 'تكلفة التمويل',
                     'اجمالي تكلفة القرض', 'Total loan cost', 'Financing Fees', 'Financing fee'],
  developerFee:     ['تكاليف المطور (Developer costs)', 'Developer Fee',
                     'أتعاب تطوير', 'رسوم المطور', 'تكاليف المطور'],
  furnishingCost:   ['أثاث الوحدات الفندقية', 'أثاث الوحدات', 'Unit furniture', 'Furnishing cost'],

  // ── DETAILED OTHER COSTS ──────────────────────────────────────────────────
  designCost:       ['التصميم (Design)', 'تكلفة المخططات والتصميم', 'Design Cost', 'التصميم'],
  licenseCost:      ['الرخصة (License)', 'الرخصة وافي', 'رسوم الرخصة', 'License', 'الرخصة'],
  excavationCost:   ['الحفر والمسح والاختبار', 'الحفر-الرخص-التصاميم',
                     'Excavation', 'Drilling', 'الحفر والمسح'],
  supervisionCost:  ['الإشراف الهندسي (supervision)', 'الإشراف الهندسي', 'supervision'],
  insuranceCost:    ['التأمين (Insurance)', 'Insurance on Project', 'Insurance', 'التأمين'],
  fencingCost:      ['التسوير (Fence', 'التسوير', 'Fence'],
  electricityCost:  ['رسوم كهرباء (Electricity fees)', 'رسوم الكهرباء', 'Electricity fees'],
  waterCost:        ['رسوم الماء وصرف الصحي', 'رسوم ماء وصرف',
                     'Water and sewer', 'Water, electricity  and sewer'],
  sortingCost:      ['الفرز (Sorting)', 'الفرز', 'Sorting'],
  marketingCost:    ['التسويق (Marketing)', 'مصاريف التسويق والمبيعات',
                     'Marketing', 'تسويق المبيعات', 'تسويق التأجير', 'تسويق البيع على الخارطة'],
  maintenanceCost:  ['الصيانة (Maintenance)', 'تشغيل وصيانة وضمان',
                     'Maintenance', 'الصيانة والتشغيل'],
  contingencyCost:  ['الاحتياطي (Contingency)', 'الاحتياطي', 'Contingency'],

  // ── FUND-SPECIFIC FEES ────────────────────────────────────────────────────
  structuringFee:   ['رسوم الهيكلة (Structuring Fee)', 'Structuring Fee',
                     'رسوم الهيكلة', 'رسوم إدارة الهيكل'],
  managementFee:    ['رسوم الإدارة (Management fee)', 'Management fee',
                     'رسوم الادراة', 'رسوم إدارة الأصول'],
  arrangementFee:   ['رسوم ترتيب التمويل', 'Debt arranging fee',
                     'Funding Arrangement Fee', 'رسوم ترتيب القرض'],
  custodianFee:     ['رسوم أمين الحفظ (Custodian Fees)', 'Custodian fee', 'رسوم أمين الحفظ'],
  spvFee:           ['رسوم انشاء شركة ذات غرض خاص', 'SPV Establishment fee', 'Custodian - SPV'],
  auditFee:         ['مراجع الحسابات (Auditor)', 'External auditor fee', 'مراجع الحسابات'],
  taxConsultantFee: ['مستشار الضريبة (Tax advisor)', 'VAT Consultant', 'مستشار الضريبة'],
  shariyaFee:       ['مستشار شرعي (Shariya consultant fee)', 'Shariya consultant fee', 'مستشار شرعي'],
  operatorFee:      ['أتعاب المشغل', 'Operator fee'],

  // ── AREAS ─────────────────────────────────────────────────────────────────
  area:          ['مساحة الأرض الإجمالية', 'إجمالي مساحة الأرض', 'Land Area', 'مساحة الأرض'],
  farValue:      ['معامل البناء (FAR)', 'معامل البناء', 'FAR', 'Floor Area Ratio'],
  aboveGradeGBA: ['إجمالي مسطحات البناء فوق الأرض', 'إجمالي المساحة فوق مستوى الأرض', 'GBA Above Grade'],
  belowGradeGBA: ['قبو - إجمالي المساحة', 'إجمالي مسطحات البناء تحت الأرض', 'Basement', 'GBA Below Grade'],
  totalGBA:      ['إجمالي المساحة المبنية', 'إجمالي مسطحات البناء الكلية',
                  'Total BUA - إجمالي مسطحات البناء', 'Total BUA',
                  'إجمالي مسطحات البناء', 'Total GBA', 'Total Built Area',
                  'إجمالي مكونات البناء - GBA', 'إجمالي المساحة التطويرية',
                  'إجمالي المساحة المبنية (GBA)'],
  nsaArea:       ['صافي المساحة القابلة للبيع', 'NSA', 'Net Sellable Area',
                  'المساحة القابلة للبيع', 'إجمالي مكونات البناء - NSA',
                  'إجمالي المساحات القابلة للبيع', 'إجمالي المساحات القابلة للبيع (NSA)'],
  landscapeArea: ['لاند سكيب (Landscape)', 'المسطحات الخارجية', 'Landscape',
                  'لاند سكيب - إجمالي المساحة'],
  avgUnitSize:   ['متوسط مساحة الوحدة', 'Average unit size'],

  // ── UNITS ─────────────────────────────────────────────────────────────────
  units:            ['إجمالي عدد الوحدات', 'Total Units', 'الإجمالي (Total)',
                     'إجمالي عدد الوحدات', 'Total units'],
  unitsSold:        ['الوحدات المباعة', 'Units Sold', 'عدد الوحدات المباعة'],
  avgUnitPrice:     ['متوسط سعر الوحدة', 'Average Unit Price'],
  totalParking:     ['إجمالي المواقف المتوفرة', 'إجمالي المواقف المطلوبة',
                     'إجمالي المواقف', 'Total parking'],

  // ── UNIT COUNTS PER COMPONENT ─────────────────────────────────────────────
  residentialUnits: ['سكني - عدد الوحدات', 'سكني ( Apartments)',
                     'سكني تجاري شقق', 'الوحدات السكنية', 'Residential Units'],
  villaUnits:       ['فلل - عدد الوحدات', 'فلل', 'Villa Units', 'Villas'],
  townhouseUnits:   ['تاون هاوس - عدد الوحدات', 'Townhouse Units'],
  floorsUnits:      ['أدوار - عدد الوحدات', 'Floors Units'],
  studioUnits:      ['أستوديوهات - عدد الوحدات', 'استوديوهات - عدد الوحدات',
                     'Studio Units', 'Apartments (Studio)'],
  officeUnits:      ['مكتبي - عدد الوحدات', 'مكتبي (Office)', 'المكتبي', 'Office Units'],
  commercialUnits:  ['تجاري - عدد الوحدات', 'تجاري (Retail)', 'وحدات تجارية', 'Commercial Units'],
  hotelUnits:       ['فندقي - عدد الوحدات', 'Hotel Units'],
  medicalUnits:     ['صحي - عدد الوحدات', 'Medical Units'],

  // ── SELLING PRICES ────────────────────────────────────────────────────────
  pricePerSqm:      ['سعر المتر المربع', 'سعر البيع للمتر', 'Price per SQM',
                     'التكلفة لكل متر مربع', 'متوسط سعر بيع المتر'],
  landPricePerSqm:  ['سعر متر الأرض', 'Land price per sqm', 'التكلفة للمتر'],

  // ── REVENUE BREAKDOWN ─────────────────────────────────────────────────────
  directSalesRevenue:  ['إجمالي مبيعات البيع المباشر', 'البيع المباشر - قيمة إجمالية',
                        'إجمالي إيرادات البيع المباشر', 'Total direct sales'],
  annualRentalRevenue: ['إجمالي إيرادات التأجير السنوي', 'التأجير السنوي - قيمة إجمالية',
                        'Total annual rental revenue'],
  dailyRentalRevenue:  ['إجمالي إيرادات التأجير اليومي', 'التأجير اليومي - قيمة إجمالية',
                        'Total daily rental revenue'],
  offplanRevenue:      ['إجمالي إيرادات البيع على الخارطة', 'صافي المبيعات على الخارطة',
                        'البيع على الخارطة - قيمة إجمالية', 'Total off-plan revenue'],
  exitValue:           ['إجمالي قيمة المخارجة', 'المخارجة (Buyout)', 'Buyout value',
                        'Exit value', 'المخارجة - قيمة إجمالية'],

  // ── OFF-PLAN DETAILS ──────────────────────────────────────────────────────
  offplanUnits:     ['عدد الوحدات المباعة على الخارطة', 'Off-plan units sold'],
  wafiFees:         ['إجمالي رسوم وافي', 'رسوم وافي', 'Wafi fees'],

  // ── FINANCING STRUCTURE ───────────────────────────────────────────────────
  bankFinancingAmount: ['إجمالي التمويل البنكي', 'التمويل المطلوب',
                        'Bank financing amount', 'أصل التمويل'],
  totalEquity:         ['إجمالي الملكية', 'Total equity', 'الملكية'],
  bankPct:             ['نسبة التمويل البنكي', 'Bank Financing %', 'نسبة التمويل',
                        'التمويل البنكي - (Bank Financing)', 'التمويل البنكي'],
  subscriptionPct:     ['نسبة الاشتراكات النقدية', 'الاشتراكات النقدية ( Cash subscriptions)',
                        'Cash subscriptions %', 'Cash subscriptions',
                        'الاشتراكات النقدية - (Cash Subscription)', 'الاشتراكات النقدية'],
  landEquityPct:       ['نسبة الاشتراك العيني من مالك الأرض', 'الاشتراك العيني من المطور',
                        'Land Equity %', "developer's in-kind contribution",
                        'الأشتراك العيني من مالك الأرض', 'الأشتراك العيني من المطور',
                        'الإشتراك العيني من مالك الأرض'],
  offplanPct:          ['نسبة البيع على الخارطة', 'البيع على الخارطة - سكني', 'Off-plan %',
                        'البيع على الخارطة - (Off-Plan Sales)', 'البيع على الخارطة'],
  annualInterestRate:  ['نسبة فوائد التمويل السنوية', 'Annual interest rate',
                        'نسبة الفائدة السنوية', 'نسبة الفوائد السنوية'],

  // ── TAXES & FEES ──────────────────────────────────────────────────────────
  rettPct:         ['ضريبة التصرفات العقارية (RETT)', 'ضريبة التصرفات العقارية', 'RETT'],
  commissionPct:   ['السعي (Commission)', 'رسوم السعي', 'Commission'],
};

// ─── FIELD TYPE SETS ─────────────────────────────────────────────────────────
const SAR_FIELDS = new Set([
  'investmentM', 'totalRevenue', 'totalCost', 'netProfit', 'operationalCost',
  'landCost', 'constructionCost', 'finishingCost', 'financingCost',
  'otherCost', 'fundFees', 'developerFee', 'furnishingCost',
  'designCost', 'licenseCost', 'excavationCost', 'supervisionCost',
  'insuranceCost', 'fencingCost', 'electricityCost', 'waterCost',
  'sortingCost', 'marketingCost', 'maintenanceCost', 'contingencyCost',
  'structuringFee', 'managementFee', 'arrangementFee', 'custodianFee',
  'spvFee', 'auditFee', 'taxConsultantFee', 'shariyaFee', 'operatorFee',
  'avgUnitPrice', 'pricePerSqm', 'landPricePerSqm',
  'directSalesRevenue', 'annualRentalRevenue', 'dailyRentalRevenue',
  'offplanRevenue', 'exitValue', 'wafiFees', 'bankFinancingAmount', 'totalEquity',
]);

const PCT_FIELDS = new Set([
  'irr', 'roi', 'roeAnnual',
  'bankPct', 'offplanPct', 'subscriptionPct', 'landEquityPct',
  'rettPct', 'commissionPct', 'annualInterestRate',
]);

const NUM_FIELDS = new Set([
  'farValue', 'paybackYears', 'moic',
]);

const UNIT_FIELDS = new Set([
  'units', 'unitsSold', 'offplanUnits', 'totalParking',
  'residentialUnits', 'villaUnits', 'townhouseUnits', 'floorsUnits',
  'studioUnits', 'officeUnits', 'commercialUnits', 'hotelUnits', 'medicalUnits',
]);

const AREA_FIELDS = new Set([
  'area', 'aboveGradeGBA', 'belowGradeGBA', 'totalGBA', 'nsaArea',
  'landscapeArea', 'avgUnitSize',
]);

// ─── STATUS MAP ───────────────────────────────────────────────────────────────
const STATUS_MAP = {
  'نشط': 'active', 'active': 'active',
  'تمويل': 'financing', 'financing': 'financing', 'تحت التمويل': 'financing',
  'تخطيط': 'planning', 'planning': 'planning',
  'مكتمل': 'completed', 'completed': 'completed',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function normalizeNum(v) {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return null;
  const cleaned = v.replace(/[,،\s%()\-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function toPercent(num) {
  if (num == null) return null;
  const pct = num > 0 && num <= 1 ? num * 100 : num;
  return pct > 0 && pct < 500 ? parseFloat(pct.toFixed(2)) : null;
}

function toMillions(raw) {
  if (raw == null || raw <= 0) return null;
  if (raw >= 1_000_000) return parseFloat((raw / 1_000_000).toFixed(2));
  if (raw >= 1 && raw < 500) return raw; // already in millions
  return null;
}

function formatArea(num) {
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' م²';
}

function matchesAny(cellVal, keywords) {
  if (typeof cellVal !== 'string') return false;
  const norm = cellVal.trim().toLowerCase();
  return keywords.some(kw => norm.includes(kw.toLowerCase()));
}

// ─── CELL MAP ─────────────────────────────────────────────────────────────────
function buildCellMap(wb) {
  const bySheet = {};
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws || !ws['!ref']) continue;
    bySheet[sheetName] = [];
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
        if (!cell || cell.v == null) continue;
        bySheet[sheetName].push({ r: R, c: C, v: cell.v, w: cell.w, t: cell.t });
      }
    }
  }
  return bySheet;
}

function getAdjacentValue(bySheet, sheetName, r, c, allKeywords, maxCol = 10, maxRow = 4) {
  const candidates = (bySheet[sheetName] ?? []).filter(cell =>
    (cell.r === r && cell.c > c && cell.c <= c + maxCol) ||
    (cell.c === c && cell.r > r && cell.r <= r + maxRow)
  ).sort((a, b) => {
    const aSameRow = a.r === r ? 0 : 1;
    const bSameRow = b.r === r ? 0 : 1;
    if (aSameRow !== bSameRow) return aSameRow - bSameRow;
    return (Math.abs(a.r - r) + Math.abs(a.c - c)) - (Math.abs(b.r - r) + Math.abs(b.c - c));
  });

  for (const cell of candidates) {
    const v = cell.v;
    if (v == null || v === '' || v === 0 || v === '-') continue;
    if (typeof v === 'string' && allKeywords.some(kw => v.toLowerCase().includes(kw.toLowerCase()))) continue;
    return cell;
  }
  return null;
}

// ─── COMPONENT BREAKDOWN PARSER ───────────────────────────────────────────────
// Parses per-component data using compound label patterns like "سكني - عدد الوحدات"
function parseComponentBreakdown(bySheet, wb, allKeywords) {
  const result = {};

  for (const { key, prefixes, nameAr, nameEn } of COMPONENT_TYPES) {
    const comp = {};

    for (const sheetName of wb.SheetNames) {
      for (const cell of (bySheet[sheetName] ?? [])) {
        if (typeof cell.v !== 'string') continue;
        const label = cell.v.trim();
        const lower = label.toLowerCase();

        // Cell must contain this component's prefix
        const hasPrefix = prefixes.some(p => lower.includes(p.toLowerCase()));
        if (!hasPrefix) continue;

        // Identify which sub-field this compound label represents
        let sfKey = null;
        if (lower.includes('عدد الوحدات للبيع'))                   sfKey = 'saleUnits';
        else if (lower.includes('عدد الوحدات للتأجير'))             sfKey = 'rentUnits';
        else if (lower.includes('عدد الوحدات'))                     sfKey = 'unitCount';
        else if (lower.includes('إجمالي إيرادات التأجير السنوي'))        sfKey = 'annualRentalRevenue';
        else if (lower.includes('إجمالي الإيرادات') && !lower.includes('سنوي')) sfKey = 'dailyAnnualRevenue';
        else if (lower.includes('إجمالي المبيعات'))                         sfKey = 'totalSales';
        else if (lower.includes('إجمالي التكاليف'))                         sfKey = 'totalCost';
        else if (lower.includes('gba') || lower.includes('إجمالي المساحة البنائية')) sfKey = 'gba';
        else if (lower.includes('nsa') || lower.includes('الصافية القابلة للبيع') ||
                 lower.includes('المساحات الصافية القابلة للبيع'))         sfKey = 'nsa';
        else if (lower.includes('مساحة الوحدة'))                           sfKey = 'unitSize';
        else if (lower.includes('تكلفة متر البناء') || lower.includes('تكلفة المتر')) sfKey = 'costPerSqm';
        else if (lower.includes('سعر بيع المتر'))                          sfKey = 'salePricePerSqm';
        else if (lower.includes('تأجير المتر') && !lower.includes('تكلفة')) sfKey = 'rentalRatePerSqm';
        else if (lower.includes('متوسط السعر اليومي'))                      sfKey = 'dailyRatePerUnit';
        else if (lower.includes('التكاليف التشغيلية والإدارية'))            sfKey = 'operatingCostDaily';
        else if (lower.includes('عدد المواقف'))                            sfKey = 'parkingCount';

        // Standalone label (e.g. "سكني (Apartments)" in RASF Summary table):
        // read unit count (+1 col), unit size (+2 col), total cost (+5 col)
        if (!sfKey) {
          const sheetCells = bySheet[sheetName] ?? [];
          const atOffset = (dc) => sheetCells.find(c => c.r === cell.r && c.c === cell.c + dc);
          const unitCell = atOffset(1);
          if (unitCell) {
            const n = normalizeNum(unitCell.v);
            if (n != null && n >= 0 && comp.unitCount == null) comp.unitCount = Math.round(n);
          }
          const sizeCell = atOffset(2);
          if (sizeCell) {
            const n = normalizeNum(sizeCell.v);
            if (n != null && n > 0 && comp.unitSize == null) comp.unitSize = Math.round(n);
          }
          const costCell = atOffset(5);
          if (costCell) {
            const n = normalizeNum(costCell.v);
            if (n != null && n > 0 && comp.totalCost == null) {
              const m = toMillions(n);
              if (m) comp.totalCost = m;
            }
          }
          continue;
        }

        if (comp[sfKey] != null) continue;

        const adj = getAdjacentValue(bySheet, sheetName, cell.r, cell.c, allKeywords);
        if (!adj) continue;
        const n = normalizeNum(adj.v);
        if (n == null || n <= 0) continue;

        if (['totalCost','totalSales','annualRentalRevenue','dailyAnnualRevenue','operatingCostDaily'].includes(sfKey)) {
          const m = toMillions(n);
          if (m) comp[sfKey] = m;
        } else if (['gba','nsa','unitSize'].includes(sfKey)) {
          comp[sfKey] = Math.round(n);
        } else {
          comp[sfKey] = Math.round(n);
        }
      }
    }

    if (Object.keys(comp).length > 0) {
      result[key] = { nameAr, nameEn, ...comp };
    }
  }

  return result;
}

// ─── FINANCING STRUCTURE PARSER ───────────────────────────────────────────────
// Extracts named financing line items (amounts in SAR millions) using exact
// or prefix matching on Arabic labels — separate from the main pattern pass.
const FINANCING_ITEM_PATTERNS = [
  { key: 'cashSubscriptions',           labels: ['الاشتراكات النقدية', 'إجمالي الاشتراكات النقدية'] },
  { key: 'fundManagerSubscription',     labels: ['الاشتراك من مدير الصندوق', 'اشتراك مدير الصندوق'] },
  { key: 'developerCashSubscription',   labels: ['الأشتراك النقدي من المطور', 'الاشتراك النقدي من المطور'] },
  { key: 'developerInKindSubscription', labels: ['الأشتراك العيني من المطور', 'الاشتراك العيني من المطور'] },
  { key: 'landOwnerInKind',             labels: ['الإشتراك العيني من مالك الأرض', 'الاشتراك العيني من مالك الأرض', 'الأشتراك العيني من مالك الأرض'] },
  { key: 'bankFinancing',               labels: ['إجمالي التمويل البنكي'] },
  { key: 'offplanSales',                labels: ['البيع على الخارطة', 'قيم البيع على الخارطة'] },
  { key: 'otherSources',                labels: ['مصادر أخرى'] },
];

// Labels on these cells indicate combined revenue rows (not financing sources) — skip them
const OFFPLAN_EXCLUSIONS = ['وبيع المراحل', 'تسويق', 'صافي المبيعات', 'إجمالي إيرادات'];

function parseFinancingItems(bySheet, wb, allKeywords) {
  const result = {};
  // Prefer "Study" sheet; fall back to others but skip "Sheet1" (often a broken template copy)
  const sheetOrder = wb.SheetNames.filter(n => n !== 'Sheet1').concat(
    wb.SheetNames.filter(n => n === 'Sheet1')
  );

  for (const { key, labels } of FINANCING_ITEM_PATTERNS) {
    let found = false;
    for (const sheetName of sheetOrder) {
      if (found) break;
      for (const cell of (bySheet[sheetName] ?? [])) {
        if (typeof cell.v !== 'string') continue;
        const cellText = cell.v.trim();
        const lower = cellText.toLowerCase();

        // Skip off-plan combined revenue labels
        if (key === 'offplanSales' && OFFPLAN_EXCLUSIONS.some(ex => lower.includes(ex.toLowerCase()))) continue;

        if (!labels.some(l => lower === l.toLowerCase() || lower.startsWith(l.toLowerCase()))) continue;
        const adj = getAdjacentValue(bySheet, sheetName, cell.r, cell.c, allKeywords);
        if (!adj) continue;
        const displayStr = adj.w || String(adj.v);
        if (displayStr.trim().endsWith('%')) continue;
        const n = normalizeNum(adj.v);
        if (n == null || n <= 0) continue;
        const m = toMillions(n);
        if (m && m > 0) { result[key] = m; found = true; break; }
      }
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

// ─── APP SHEET DIRECT PARSER ──────────────────────────────────────────────────
// Reads the structured "APP" sheet (القالب الموحد) where:
//   Column B = label (اسم البند)
//   Column C = value (الناتج)
//   Column F = unit  (ملاحظة / الوحدة): "ريال سعودي" | "نسبة مئوية" | "م²" | "وحدة" | "سنة" | …

const COMP_MAP_APP = [
  { key: 'residential', prefix: 'سكني',      nameAr: 'سكني',       nameEn: 'Residential' },
  { key: 'villas',      prefix: 'فلل',        nameAr: 'فلل',         nameEn: 'Villas'      },
  { key: 'townhouse',   prefix: 'تاون هاوس', nameAr: 'تاون هاوس',  nameEn: 'Townhouse'   },
  { key: 'floors',      prefix: 'أدوار',      nameAr: 'أدوار',       nameEn: 'Floors'      },
  { key: 'studios',     prefix: 'أستوديوهات',nameAr: 'أستوديوهات', nameEn: 'Studios'     },
  { key: 'office',      prefix: 'مكتبي',      nameAr: 'مكتبي',       nameEn: 'Office'      },
  { key: 'commercial',  prefix: 'تجاري',      nameAr: 'تجاري',       nameEn: 'Commercial'  },
  { key: 'hotel',       prefix: 'فندقي',      nameAr: 'فندقي',       nameEn: 'Hotel'       },
  { key: 'medical',     prefix: 'صحي',        nameAr: 'صحي',         nameEn: 'Medical'     },
  { key: 'other',       prefix: 'أخرى',       nameAr: 'أخرى',        nameEn: 'Other'       },
];

// Build label→{v,u} map from the APP sheet rows (B=label, C=value, F=unit)
function buildAppLookup(bySheet) {
  const cells = bySheet['APP'] ?? [];
  const rows  = {};
  for (const cell of cells) {
    if (!rows[cell.r]) rows[cell.r] = {};
    if (cell.c === 1) rows[cell.r].label = typeof cell.v === 'string' ? cell.v.trim() : null;
    if (cell.c === 2) rows[cell.r].raw   = cell.v;
    if (cell.c === 5) rows[cell.r].unit  = typeof cell.v === 'string' ? cell.v.trim() : null;
  }
  const lookup = {};
  for (const { label, raw, unit } of Object.values(rows)) {
    if (!label || label.startsWith('▌') || label === 'اسم البند' || label === '#') continue;
    if (raw == null || raw === '' || raw === 0) continue;
    if (typeof raw === 'string' && (raw.trim() === '' || raw.trim() === '0')) continue;
    // First occurrence wins (earlier rows are more canonical in the APP template)
    if (!lookup[label]) lookup[label] = { v: raw, u: unit || '' };
  }
  return lookup;
}

function _appGet(lk, label)      { return lk[label] ?? null; }
function _appNum(lk, label)      { const e = _appGet(lk,label); return e ? normalizeNum(e.v) : null; }
function appToM(lk, ...labels)   {
  for (const l of labels) {
    const n = _appNum(lk, l);
    if (n != null && n > 0) { const m = toMillions(n); if (m) return m; }
  }
  return null;
}
function appToPct(lk, ...labels) {
  for (const l of labels) {
    const n = _appNum(lk, l);
    if (n == null) continue;
    // APP sheet stores percentages as decimals (0.23 → 23%)
    const pct = n > 0 && n <= 1 ? n * 100 : n;
    if (pct > 0 && pct < 500) return parseFloat(pct.toFixed(2));
  }
  return null;
}
function appToArea(lk, ...labels) {
  for (const l of labels) {
    const n = _appNum(lk, l);
    // Reject values < 100 — they are ratios / coefficients, not real areas
    if (n != null && n >= 100) return formatArea(n);
  }
  return null;
}
function appToInt(lk, ...labels)  {
  for (const l of labels) {
    const n = _appNum(lk, l);
    if (n != null && n > 0) return Math.round(n);
  }
  return null;
}
function appToFloat(lk, ...labels) {
  for (const l of labels) {
    const n = _appNum(lk, l);
    if (n != null && n > 0) return parseFloat(n.toFixed(2));
  }
  return null;
}
function appToStr(lk, ...labels)  {
  const PLACEHOLDERS = new Set(['الموقع','النوع','الحالة','التاريخ','0']);
  for (const l of labels) {
    const e = _appGet(lk, l);
    if (!e) continue;
    const s = String(e.v).trim();
    if (PLACEHOLDERS.has(s) || s.length <= 1 || s.length > 100) continue;
    return s;
  }
  return null;
}

function parseAppSheet(wb, bySheet) {
  if (!wb.SheetNames.includes('APP')) return null;
  const lk = buildAppLookup(bySheet);
  if (Object.keys(lk).length < 5) return null;  // too sparse — not a real APP sheet

  const app = {
    // ── Project info ────────────────────────────────────────────────
    projectName:  appToStr(lk,  'اسم المشروع', 'اسم الصندوق'),
    location:     appToStr(lk,  'موقع المشروع'),
    projectType:  null,
    status:       null,
    startDate:    null,
    deliveryDate: null,

    // ── Main KPIs ────────────────────────────────────────────────────
    investmentM:     appToM(lk,
      'إجمالي التكاليف الرأسمالية (CapEx)',
      'إجمالي التكاليف الرأسمالية',
      'إجمالي تكلفة المشروع',
      'إجمالي مصادر التمويل',
      'حجم الاستثمار',
    ),
    totalRevenue:    appToM(lk,   'إجمالي الإيرادات'),
    netProfit:       appToM(lk,   'صافي الدخل'),
    totalCost:       appToM(lk,   'إجمالي التكاليف الكاملة للمشروع', 'إجمالي تكلفة التطوير'),
    operationalCost: appToM(lk,   'إجمالي التكاليف التشغيلية (OpEx)', 'إجمالي التكاليف التشغيلية'),
    irr:             appToPct(lk, 'معدل العائد الداخلي (IRR)'),
    roi:             appToPct(lk, 'العائد على الاستثمار (ROI)'),
    roeAnnual:       appToPct(lk, 'العائد على الملكية السنوي'),
    moic:            null,
    paybackYears:    (() => {
      // Scan every APP label containing 'مدة'; use unit column (F) to decide months vs years.
      // This handles any label variation without needing an exact match list.
      for (const [label, entry] of Object.entries(lk)) {
        if (!label.includes('مدة')) continue;
        const n = normalizeNum(entry.v);
        if (n == null || n <= 0) continue;
        const unit = (entry.u || '').trim();
        if (unit.includes('شهر') || unit.includes('أشهر')) return parseFloat((n / 12).toFixed(2));
        if (unit.includes('سنة') || n <= 30) return parseFloat(n.toFixed(2));
        return parseFloat((n / 12).toFixed(2)); // >30 without unit → assume months
      }
      return null;
    })(),

    // ── Cost breakdown ───────────────────────────────────────────────
    landCost:         appToM(lk, 'إجمالي تكلفة الأرض بعد الضرائب', 'إجمالي تكلفة الأرض'),
    constructionCost: appToM(lk, 'إجمالي تكلفة البناء', 'إجمالي تكاليف البناء'),
    finishingCost:    null,
    financingCost:    appToM(lk, 'فوائد التمويل'),
    otherCost:        appToM(lk, 'إجمالي التكاليف الأخرى'),
    // Fund fees = رسوم الصندوق + التكاليف الأخرى للصندوق (excludes developer fee تكاليف المطور)
    fundFees: (() => {
      const fees  = _appNum(lk, 'رسوم الصندوق');
      const other = _appNum(lk, 'التكاليف الأخرى للصندوق');
      if (fees != null || other != null) {
        const total = (fees || 0) + (other || 0);
        return total > 0 ? toMillions(total) : null;
      }
      return null;
    })(),
    developerFee:     appToM(lk, 'تكاليف المطور'),
    furnishingCost:   appToM(lk, 'أثاث الوحدات الفندقية', 'أثاث الوحدات'),

    // ── Detailed other costs ─────────────────────────────────────────
    designCost:      appToM(lk, 'التصميم'),
    licenseCost:     appToM(lk, 'الرخصة'),
    excavationCost:  appToM(lk, 'الحفر والمسح والاختبار'),
    supervisionCost: appToM(lk, 'الإشراف الهندسي'),
    insuranceCost:   appToM(lk, 'التأمين'),
    fencingCost:     appToM(lk, 'التسوير'),
    electricityCost: appToM(lk, 'رسوم الكهرباء'),
    waterCost:       appToM(lk, 'رسوم الماء وصرف الصحي'),
    sortingCost:     appToM(lk, 'الفرز'),
    marketingCost:   appToM(lk, 'تسويق المبيعات'),
    maintenanceCost: appToM(lk, 'الصيانة والتشغيل'),
    contingencyCost: appToM(lk, 'الاحتياطي'),

    // Fund fees breakdown — not itemized in APP sheet
    structuringFee: null, managementFee: null, arrangementFee: null,
    custodianFee: null, spvFee: null, auditFee: null,
    taxConsultantFee: null, shariyaFee: null, operatorFee: null,

    // ── Areas ────────────────────────────────────────────────────────
    area:          appToArea(lk,  'مساحة الأرض الإجمالية'),
    farValue:      appToFloat(lk, 'معامل البناء (FAR)'),
    aboveGradeGBA: appToArea(lk,  'إجمالي مسطحات البناء فوق الأرض', 'إجمالي المساحة فوق مستوى الأرض'),
    belowGradeGBA: null,
    totalGBA:      appToArea(lk,  'إجمالي المساحة المبنية (GBA)', 'إجمالي مكونات البناء - GBA', 'إجمالي المساحة التطويرية', 'إجمالي مسطحات البناء الكلية'),
    nsaArea:       appToArea(lk,  'إجمالي المساحات القابلة للبيع (NSA)', 'إجمالي مكونات البناء - NSA'),
    landscapeArea: appToArea(lk,  'لاند سكيب - إجمالي المساحة'),
    avgUnitSize:   appToFloat(lk, 'متوسط مساحة الوحدة'),

    // ── Units ────────────────────────────────────────────────────────
    units:        appToInt(lk, 'إجمالي عدد الوحدات'),
    unitsSold:    null,  // not auto-filled: represents already-sold units (progress), not study sale plan
    totalParking: appToInt(lk, 'إجمالي المواقف المتوفرة'),
    avgUnitPrice: null,

    // ── Per-component unit counts (filled from componentBreakdown below) ──
    residentialUnits: null, villaUnits: null, townhouseUnits: null,
    floorsUnits: null, studioUnits: null, officeUnits: null,
    commercialUnits: null, hotelUnits: null, medicalUnits: null,

    // ── Selling prices ───────────────────────────────────────────────
    pricePerSqm:     appToInt(lk, 'متوسط سعر بيع المتر'),
    landPricePerSqm: appToInt(lk, 'التكلفة للمتر'),

    // ── Revenue breakdown ────────────────────────────────────────────
    directSalesRevenue:  appToM(lk, 'إجمالي مبيعات البيع المباشر',   'البيع المباشر - قيمة إجمالية'),
    annualRentalRevenue: appToM(lk, 'إجمالي إيرادات التأجير السنوي',  'التأجير السنوي - قيمة إجمالية'),
    dailyRentalRevenue:  appToM(lk, 'إجمالي إيرادات التأجير اليومي',  'التأجير اليومي - قيمة إجمالية'),
    offplanRevenue:      appToM(lk, 'صافي المبيعات على الخارطة',      'البيع على الخارطة - قيمة إجمالية', 'إجمالي إيرادات البيع على الخارطة'),
    exitValue:           appToM(lk, 'إجمالي قيمة المخارجة (الرسملة)', 'المخارجة (Buyout) - قيمة إجمالية'),
    offplanUnits:        null,
    wafiFees:            null,

    // ── Financing ────────────────────────────────────────────────────
    bankFinancingAmount: appToM(lk,   'إجمالي التمويل البنكي', 'التمويل المطلوب'),
    totalEquity:         appToM(lk,   'إجمالي الملكية'),
    bankPct:             appToPct(lk, 'نسبة التمويل البنكي'),
    subscriptionPct:     appToPct(lk, 'نسبة الاشتراكات النقدية'),
    landEquityPct:       appToPct(lk, 'نسبة الاشتراك العيني من مالك الأرض', 'نسبة الاشتراك العيني من المطور'),
    offplanPct:          appToPct(lk, 'نسبة البيع على الخارطة'),
    annualInterestRate:  null,
    rettPct: null, commissionPct: null,

    financing: null,
    componentBreakdown: {},
    rawHits: [],
  };

  // Build financing structure items
  const finItems = [
    ['cashSubscriptions',           'الاشتراكات النقدية'],
    ['fundManagerSubscription',     'الاشتراك من مدير الصندوق'],
    ['developerCashSubscription',   'الاشتراك النقدي من المطور'],
    ['developerInKindSubscription', 'الاشتراك العيني من المطور'],
    ['landOwnerInKind',             'الاشتراك العيني من مالك الأرض'],
    ['bankFinancing',               'إجمالي التمويل البنكي'],
    ['offplanSales',                'البيع على الخارطة (هيكلة)'],
    ['otherSources',                'مصادر أخرى'],
  ];
  const fin = {};
  for (const [fKey, label] of finItems) {
    const m = appToM(lk, label);
    if (m && m > 0) fin[fKey] = m;
  }
  if (Object.keys(fin).length > 0) app.financing = fin;

  // Build per-component breakdown
  const UNIT_MAP = { residential: 'residentialUnits', villas: 'villaUnits', townhouse: 'townhouseUnits',
    floors: 'floorsUnits', studios: 'studioUnits', office: 'officeUnits',
    commercial: 'commercialUnits', hotel: 'hotelUnits', medical: 'medicalUnits' };

  for (const { key, prefix, nameAr, nameEn } of COMP_MAP_APP) {
    const getN = (sfx) => { const e = _appGet(lk, `${prefix} - ${sfx}`); return e ? normalizeNum(e.v) : null; };
    const unitCount  = getN('عدد الوحدات');
    const totalCost  = (() => { const n = getN('إجمالي التكاليف'); return n && n > 0 ? toMillions(n) : null; })();
    const gba        = (() => { const n = getN('إجمالي المساحة البنائية (GBA)'); return n && n > 0 ? Math.round(n) : null; })();
    const nsa        = (() => { const n = getN('المساحات الصافية القابلة للبيع (NSA)'); return n && n > 0 ? Math.round(n) : null; })();
    const unitSize   = (() => { const n = getN('مساحة الوحدة'); return n && n >= 20 ? parseFloat(n.toFixed(1)) : null; })();
    const saleUnits    = (() => { const n = getN('عدد الوحدات للبيع'); return n && n > 0 ? Math.round(n) : null; })();
    const rentUnits    = (() => { const n = getN('عدد الوحدات للتأجير'); return n && n > 0 ? Math.round(n) : null; })();
    const totalSales   = (() => { const n = getN('إجمالي المبيعات'); return n && n > 0 ? toMillions(n) : null; })();
    const annRental    = (() => { const n = getN('إجمالي إيرادات التأجير السنوي'); return n && n > 0 ? toMillions(n) : null; })();
    const salePrice    = (() => { const n = getN('سعر بيع المتر'); return n && n > 0 ? Math.round(n) : null; })();
    const parking      = (() => { const n = getN('عدد المواقف'); return n && n > 0 ? Math.round(n) : null; })();
    const rentalRate   = (() => { const n = getN('تأجير المتر'); return n && n > 0 ? Math.round(n) : null; })();
    const dailyRate    = (() => { const n = getN('متوسط السعر اليومي'); return n && n > 0 ? Math.round(n) : null; })();
    const dailyRevenue = (() => { const n = getN('إجمالي الإيرادات'); return n && n > 0 ? toMillions(n) : null; })();
    const opCostDaily  = (() => { const n = getN('التكاليف التشغيلية والإدارية'); return n && n > 0 ? toMillions(n) : null; })();

    if (unitCount || totalCost || gba || annRental || dailyRevenue) {
      app.componentBreakdown[key] = {
        nameAr, nameEn,
        ...(unitCount    != null && { unitCount    }),
        ...(totalCost    != null && { totalCost    }),
        ...(gba          != null && { gba          }),
        ...(nsa          != null && { nsa          }),
        ...(unitSize     != null && { unitSize     }),
        ...(saleUnits    != null && { saleUnits    }),
        ...(rentUnits    != null && { rentUnits    }),
        ...(totalSales   != null && { totalSales   }),
        ...(annRental    != null && { annualRentalRevenue: annRental }),
        ...(salePrice    != null && { salePricePerSqm: salePrice }),
        ...(rentalRate   != null && { rentalRatePerSqm: rentalRate }),
        ...(dailyRate    != null && { dailyRatePerUnit: dailyRate }),
        ...(dailyRevenue != null && { dailyAnnualRevenue: dailyRevenue }),
        ...(opCostDaily  != null && { operatingCostDaily: opCostDaily }),
        ...(parking      != null && { parkingCount: parking }),
      };
      // Propagate to top-level unit count field
      const topKey = UNIT_MAP[key];
      if (topKey && unitCount) app[topKey] = unitCount;
    }
  }

  // rawHits for the preview panel
  app.rawHits = Object.entries(app)
    .filter(([k, v]) => v != null && !['rawHits','financing','componentBreakdown'].includes(k))
    .map(([k, v]) => ({ field: k, label: k, value: String(v) }));

  return app;
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export async function parseStudyFile(file) {
  const result = {
    // project info
    projectName: null, location: null, projectType: null, status: null,
    startDate: null, deliveryDate: null, paybackYears: null,

    // main KPIs
    investmentM: null, totalRevenue: null, netProfit: null,
    totalCost: null, operationalCost: null,
    irr: null, roi: null, roeAnnual: null, moic: null,

    // cost breakdown
    landCost: null, constructionCost: null, finishingCost: null,
    financingCost: null, otherCost: null, fundFees: null,
    developerFee: null, furnishingCost: null,

    // detailed other costs
    designCost: null, licenseCost: null, excavationCost: null,
    supervisionCost: null, insuranceCost: null, fencingCost: null,
    electricityCost: null, waterCost: null, sortingCost: null,
    marketingCost: null, maintenanceCost: null, contingencyCost: null,

    // fund fees breakdown
    structuringFee: null, managementFee: null, arrangementFee: null,
    custodianFee: null, spvFee: null, auditFee: null,
    taxConsultantFee: null, shariyaFee: null, operatorFee: null,

    // areas
    area: null, farValue: null,
    aboveGradeGBA: null, belowGradeGBA: null, totalGBA: null,
    nsaArea: null, landscapeArea: null, avgUnitSize: null,

    // units aggregate
    units: null, unitsSold: null, avgUnitPrice: null, totalParking: null,

    // units per component
    residentialUnits: null, villaUnits: null, townhouseUnits: null,
    floorsUnits: null, studioUnits: null, officeUnits: null,
    commercialUnits: null, hotelUnits: null, medicalUnits: null,

    // selling prices
    pricePerSqm: null, landPricePerSqm: null,

    // revenue breakdown
    directSalesRevenue: null, annualRentalRevenue: null,
    dailyRentalRevenue: null, offplanRevenue: null, exitValue: null,

    // off-plan
    offplanUnits: null, wafiFees: null,

    // financing
    bankFinancingAmount: null, totalEquity: null,
    bankPct: null, offplanPct: null, subscriptionPct: null,
    landEquityPct: null, annualInterestRate: null,

    // taxes
    rettPct: null, commissionPct: null,

    // financing structure (keyed by English field name, SAR millions)
    financing: null,

    // per-component breakdown (array)
    componentBreakdown: {},

    rawHits: [],
  };

  try {
    const buf     = await file.arrayBuffer();
    const wb      = XLSX.read(buf, { type: 'array', cellText: true, cellDates: true });
    const bySheet = buildCellMap(wb);
    const allKeywords = Object.values(PATTERNS).flat();

    // ── Zero pass: APP sheet direct mapping (القالب الموحد) ──────────────────
    // If the file has an "APP" sheet, use it as authoritative source first.
    // Any field populated here is skipped in the fuzzy-matching pass below.
    const appData = parseAppSheet(wb, bySheet);
    if (appData) {
      for (const [k, v] of Object.entries(appData)) {
        if (v != null && k !== 'rawHits') result[k] = v;
      }
      result.rawHits = [...appData.rawHits];
    }

    // ── First pass: flat pattern matching (skips fields already set by APP) ──
    for (const sheetName of wb.SheetNames) {
      for (const cell of (bySheet[sheetName] ?? [])) {
        const label = typeof cell.v === 'string' ? cell.v.trim() : String(cell.v);

        for (const [field, keywords] of Object.entries(PATTERNS)) {
          if (result[field] != null) continue;
          if (!matchesAny(label, keywords)) continue;

          // Text-only fields: tight search (adjacent col/row only) to avoid false matches
          const isTextField = field === 'projectName' || field === 'location' || field === 'projectType';
          const adj = getAdjacentValue(bySheet, sheetName, cell.r, cell.c, allKeywords,
            isTextField ? 3 : 10, isTextField ? 2 : 4);
          if (!adj) continue;

          const raw     = adj.v;
          const display = adj.w || String(raw);

          if (field === 'projectName' || field === 'location' || field === 'projectType') {
            if (typeof raw === 'string' && raw.trim().length > 1 && raw.trim().length < 100)
              result[field] = raw.trim();

          } else if (field === 'deliveryDate' || field === 'startDate') {
            if (raw instanceof Date) {
              result[field] = `Q${Math.ceil((raw.getMonth() + 1) / 3)} ${raw.getFullYear()}`;
            } else {
              const s = String(raw).trim();
              // Reject pure label strings (no digit = just a column header like "END DATE")
              if (s.length > 0 && s.length < 25 && /\d/.test(s)) result[field] = s;
            }

          } else if (field === 'status') {
            result.status = STATUS_MAP[String(raw).trim().toLowerCase()] ?? null;

          } else if (SAR_FIELDS.has(field)) {
            // Skip cells that are percentage-formatted (e.g. "18%" from capital structure)
            const displayStr = adj.w || String(raw);
            if (displayStr.trim().endsWith('%')) break;
            const millions = toMillions(normalizeNum(raw));
            if (millions && millions > 0) result[field] = millions;

          } else if (PCT_FIELDS.has(field)) {
            const pct = toPercent(normalizeNum(raw));
            if (pct != null) result[field] = pct;

          } else if (NUM_FIELDS.has(field)) {
            const num = normalizeNum(raw);
            if (num != null && num > 0) result[field] = parseFloat(num.toFixed(2));

          } else if (UNIT_FIELDS.has(field)) {
            const num = normalizeNum(raw);
            if (num != null && num > 0) result[field] = Math.round(num);

          } else if (AREA_FIELDS.has(field)) {
            const num = normalizeNum(raw);
            if (num != null && num > 0) result[field] = formatArea(num);
          }

          result.rawHits.push({ field, label, value: display, sheet: sheetName });
          break;
        }
      }
    }

    // ── Second pass: per-component breakdown ─────────────────────────────────
    // If APP sheet was used, trust its componentBreakdown (already set above).
    // Only run fuzzy breakdown when no APP sheet is present.
    if (!appData) {
      result.componentBreakdown = parseComponentBreakdown(bySheet, wb, allKeywords);
    }

    // ── Third pass: financing structure items ─────────────────────────────────
    result.financing = parseFinancingItems(bySheet, wb, allKeywords);

    // If APP sheet was used, unitsSold must never be auto-filled (it represents
    // units already sold as progress, not the study's sale plan)
    if (appData) result.unitsSold = null;

  } catch (err) {
    console.error('studyParser error:', err);
  }

  return result;
}
