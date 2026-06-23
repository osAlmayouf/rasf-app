import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { join } from 'path';

const DIR = 'C:\\Users\\Abu34\\OneDrive\\سطح المكتب\\app\\الداراسات';
const FILES = [
  { file: 'اسار.xlsm',    id: 'asaar'     },
  { file: 'جدة.xlsm',     id: 'jeddah'    },
  { file: 'QUR.xlsm',     id: 'qur229'    },
  { file: 'Radian.xlsm',  id: 'radian'    },
  { file: 'الخليج.xlsm',  id: 'alkhalij'  },
  { file: 'الوزارات.xlsm',id: 'alwizarat' },
  { file: 'انسباير.xlsm', id: 'inspire'   },
];

const PATTERNS = {
  totalRevenue:    ['إجمالي الإيرادات', 'الإيرادات (Revenues)', 'Revenue - الايرادات', 'إجمالي المبيعات'],
  netProfit:       ['صافي الدخل (Net income)', 'صافي الدخل', 'صافي الربح', 'الربح الصافي', 'Net Profit'],
  totalCost:       ['إجمالي التكاليف الكاملة', 'إجمالي التكاليف الكاملة للمشروع', 'اجمالي تكاليف الصندوق', 'إجمالي تكاليف المشروع'],
  landCost:        ['اجمالي تكلفة الأرض', 'إجمالي تكلفة الأرض', 'تكلفة الأرض (Land cost)', 'Land Cost', 'Total Land Cost', 'إجمالي تكلفة الأرض بعد الضرائب'],
  constructionCost:['اجمالي تكلفة البناء', 'إجمالي تكاليف البناء', 'Total construction cost', 'تكلفة التطوير (Development cost)', 'تكاليف مسطحات البناء'],
  financingCost:   ['رسوم التمويل (Finance fees)', 'فوائد التمويل', 'تكلفة التمويل', 'اجمالي تكلفة القرض', 'Financing Fees'],
  developerFee:    ['تكاليف المطور (Developer costs)', 'Developer Fee', 'أتعاب تطوير', 'رسوم المطور', 'تكاليف المطور', 'Developer costs'],
  fundFees:        ['إجمالي تكاليف الصندوق', 'رسوم الصندوق (Fund costs)', 'رسوم الصندوق (Fund fees)',
                    'إجمالي رسوم الصندوق', 'Total Fund Fees', 'Fund Fees', 'Fund costs', 'إجمالي مصروفات الصندوق'],
  otherCost:       ['مجموع التكاليف الأخرى', 'تكاليف أخرى (Other cost)', 'إجمالي التكاليف الأخرى',
                    'Total other costs', 'soft cost', 'التكاليف الأخرى (Other costs)', 'تكاليف أخرى للصندوق',
                    'التكاليف الأخرى للصندوق', 'Other costs'],
  operationalCost: ['إجمالي التكاليف التشغيلية', 'التكاليف التشغيلية', 'Total OpEx', 'OpEx'],
};

function matchesAny(val, keywords) {
  if (typeof val !== 'string') return false;
  const norm = val.trim().toLowerCase();
  return keywords.some(kw => norm.includes(kw.toLowerCase()));
}

function toMillions(v) {
  if (v == null || typeof v !== 'number' || v <= 0) return null;
  if (v >= 1_000_000) return +(v / 1_000_000).toFixed(2);
  if (v >= 1 && v < 10_000) return +v.toFixed(2);
  return null;
}

function parseFile(filename) {
  const buf = readFileSync(join(DIR, filename));
  const wb  = XLSX.read(buf, { type: 'buffer', cellText: true });

  const cells = [];
  for (const sn of wb.SheetNames) {
    const ws = wb.Sheets[sn];
    if (!ws || !ws['!ref']) continue;
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
        if (cell?.v != null) cells.push({ sn, r: R, c: C, v: cell.v, w: cell.w });
      }
    }
  }

  const allKw = Object.values(PATTERNS).flat();

  function getAdj(sn, r, c) {
    return cells
      .filter(x => x.sn === sn && ((x.r === r && x.c > c && x.c <= c + 12) || (x.c === c && x.r > r && x.r <= r + 5)))
      .sort((a, b) => {
        const ar = a.r === r ? 0 : 1, br = b.r === r ? 0 : 1;
        if (ar !== br) return ar - br;
        return (Math.abs(a.r-r)+Math.abs(a.c-c)) - (Math.abs(b.r-r)+Math.abs(b.c-c));
      })
      .find(x => {
        if (x.v == null || x.v === '' || x.v === 0 || x.v === '-') return false;
        if (typeof x.v === 'string' && allKw.some(kw => x.v.toLowerCase().includes(kw.toLowerCase()))) return false;
        return true;
      });
  }

  const result = {};
  const hits   = [];

  for (const cell of cells) {
    const label = typeof cell.v === 'string' ? cell.v.trim() : '';
    for (const [field, keywords] of Object.entries(PATTERNS)) {
      if (result[field] != null) continue;
      if (!matchesAny(label, keywords)) continue;
      const adj = getAdj(cell.sn, cell.r, cell.c);
      if (!adj) continue;
      const m = toMillions(typeof adj.v === 'number' ? adj.v : parseFloat(String(adj.v).replace(/[,،\s]/g, '')));
      if (m) { result[field] = m; hits.push({ field, label: label.slice(0,50), val: m, sheet: cell.sn }); }
      break;
    }
  }

  return { result, hits };
}

for (const { file, id } of FILES) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📁 ${file}  [${id}]`);
  try {
    const { result, hits } = parseFile(file);
    const fields = ['totalRevenue','totalCost','landCost','constructionCost','financingCost','developerFee','fundFees','otherCost','operationalCost','netProfit'];
    for (const f of fields) {
      const v = result[f];
      const hit = hits.find(h => h.field === f);
      console.log(`  ${f.padEnd(20)}: ${v != null ? v + ' M' : '—'} ${hit ? `  ← "${hit.label.slice(0,30)}" [${hit.sheet}]` : ''}`);
    }
    // Check if sum adds up
    const land = result.landCost || 0;
    const con  = result.constructionCost || 0;
    const fin  = result.financingCost || 0;
    const dev  = result.developerFee || 0;
    const fund = result.fundFees || 0;
    const oth  = result.otherCost || 0;
    const total = result.totalCost || 0;
    const sumKnown = land + con + fin + dev + fund + oth;
    const remainder = total > 0 ? +(total - land - con - fin - dev - fund - oth).toFixed(2) : null;
    console.log(`\n  مجموع المعروف: ${sumKnown.toFixed(2)} M  |  الإجمالي: ${total} M  |  المتبقي غير مصنف: ${remainder ?? '?'} M`);
  } catch(e) {
    console.log(`  ❌ ${e.message}`);
  }
}
