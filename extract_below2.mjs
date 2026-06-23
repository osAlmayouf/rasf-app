import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { join } from 'path';

const DIR = 'C:\\Users\\Abu34\\OneDrive\\سطح المكتب\\app\\الداراسات';
const FILES = ['QUR.xlsm','Radian.xlsm','الخليج.xlsm','الوزارات.xlsm','انسباير.xlsm'];

function cell(ws, r, c) {
  const k = XLSX.utils.encode_cell({ r, c });
  const ce = ws[k];
  return ce ? ce.v : null;
}

for (const filename of FILES) {
  console.log(`\n== ${filename} ==`);
  const buf = readFileSync(join(DIR, filename));
  const wb  = XLSX.read(buf, { type: 'buffer' });
  const study = wb.Sheets['Study'];
  if (!study) { console.log('  No Study sheet'); continue; }

  const range = XLSX.utils.decode_range(study['!ref']);
  const keywords = ['تحت الأرض','قبو','Basement','Below Grade','BGA','below grade','parking','باركنج','مواقف'];
  let found = false;
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const v = cell(study, r, c);
      if (!v) continue;
      const s = String(v);
      if (keywords.some(kw => s.toLowerCase().includes(kw.toLowerCase()))) {
        // look for adjacent number
        for (let dc = 1; dc <= 15; dc++) {
          const adj = cell(study, r, c + dc);
          if (adj && typeof adj === 'number' && adj > 100) {
            console.log(`  row${r+1} col${XLSX.utils.encode_col(c)}: "${s.substring(0,50)}" → ${Math.round(adj).toLocaleString()}`);
            found = true;
            break;
          }
        }
      }
    }
  }
  if (!found) console.log('  (no basement/below-grade keywords found in Study sheet)');
}
