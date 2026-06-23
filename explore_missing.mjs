import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { join } from 'path';

const DIR = 'C:\\Users\\Abu34\\OneDrive\\سطح المكتب\\app\\الداراسات';

const SEARCH = [
  'مساحة', 'area', 'وحدات', 'units', 'فوق', 'تحت', 'أرضي', 'سكني', 'أستوديو',
  'تجاري', 'مكتبي', 'فندقي', 'GBA', 'NSA', 'BUA', 'GFA',
];

function searchFile(filename) {
  const buf = readFileSync(join(DIR, filename));
  const wb  = XLSX.read(buf, { type: 'buffer', cellText: true });

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📊 ${filename}`);
  console.log(`${'─'.repeat(60)}`);

  for (const sn of wb.SheetNames) {
    const ws = wb.Sheets[sn];
    if (!ws || !ws['!ref']) continue;
    const range = XLSX.utils.decode_range(ws['!ref']);
    const hits = [];

    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
        if (!cell || cell.v == null) continue;
        const v = String(cell.v).trim();
        if (!v) continue;
        const low = v.toLowerCase();
        if (SEARCH.some(kw => low.includes(kw.toLowerCase()))) {
          // look for adjacent numeric value
          let num = null;
          for (let dc = 1; dc <= 10; dc++) {
            const adj = ws[XLSX.utils.encode_cell({ r: R, c: C + dc })];
            if (adj && adj.v != null && typeof adj.v === 'number') { num = adj.v; break; }
            if (adj && adj.v != null && typeof adj.v === 'string') {
              const n = parseFloat(adj.v.replace(/[,،\s]/g, ''));
              if (!isNaN(n)) { num = n; break; }
            }
          }
          if (!num) {
            for (let dr = 1; dr <= 4; dr++) {
              const adj = ws[XLSX.utils.encode_cell({ r: R + dr, c: C })];
              if (adj && adj.v != null && typeof adj.v === 'number') { num = adj.v; break; }
            }
          }
          const colLetter = XLSX.utils.encode_col(C);
          hits.push(`  [${sn}] ${colLetter}${R+1}: "${v.substring(0,50)}" → ${num != null ? num.toLocaleString() : '(no num)'}`);
        }
      }
    }
    if (hits.length > 0) {
      console.log(`\n  📋 Sheet: ${sn}`);
      hits.slice(0, 40).forEach(h => console.log(h));
    }
  }
}

const FILES = ['QUR.xlsm','Radian.xlsm','الخليج.xlsm','الوزارات.xlsm','انسباير.xlsm'];
for (const f of FILES) {
  try { searchFile(f); } catch(e) { console.log(`❌ ${f}: ${e.message}`); }
}
