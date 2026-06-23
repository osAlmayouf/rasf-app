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

  const keywords = ['تحت الأرض','قبو','Basement','Below','BGA'];
  for (let r = 38; r <= 55; r++) {
    for (let c = 0; c <= 30; c++) {
      const v = cell(study, r, c);
      if (!v) continue;
      const s = String(v);
      if (keywords.some(kw => s.toLowerCase().includes(kw.toLowerCase()))) {
        for (let dc = 1; dc <= 15; dc++) {
          const adj = cell(study, r, c + dc);
          if (adj && typeof adj === 'number' && adj > 0) {
            console.log(`  row${r+1} col${c+1}: "${s.substring(0,40)}" → ${adj.toLocaleString()}`);
            break;
          }
        }
      }
    }
  }

  console.log('  Row 43 dump:');
  for (let c = 0; c <= 25; c++) {
    const v = cell(study, 42, c);
    if (v != null) console.log(`    ${XLSX.utils.encode_col(c)}43: ${String(v).substring(0,30)}`);
  }
}
