import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

const FILE = 'C:\\Users\\Abu34\\OneDrive\\سطح المكتب\\app\\الداراسات\\الخليج.xlsm';
const wb = XLSX.read(readFileSync(FILE), { type: 'buffer', cellText: true, cellDates: true });

// Search for cells containing "اسم" in Study sheet — show context
const ws = wb.Sheets['Study'];
const range = XLSX.utils.decode_range(ws['!ref']);
console.log('\n=== Cells containing "اسم" in Study sheet ===');
for (let R = range.s.r; R <= Math.min(range.e.r, 80); R++) {
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
    if (!cell || cell.v == null) continue;
    const val = String(cell.v);
    if (val.includes('اسم') || val.includes('Project Name') || val.includes('اسم الصندوق')) {
      // Show this cell and neighbors in same row
      const rowCells = [];
      for (let DC = -2; DC <= 12; DC++) {
        const nc = ws[XLSX.utils.encode_cell({ r: R, c: C + DC })];
        if (!nc || nc.v == null) continue;
        const nv = String(nc.v).replace(/\n/g,' ').substring(0,35);
        rowCells.push(`${XLSX.utils.encode_col(C+DC)}${R+1}[${nv}]`);
      }
      console.log(rowCells.join('  '));
    }
  }
}

// Also show first 15 rows of Study fully
console.log('\n=== Study sheet rows 1-15 ===');
for (let R = 0; R < 15; R++) {
  const rowCells = [];
  for (let C = 0; C <= 12; C++) {
    const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
    if (!cell || cell.v == null) continue;
    const val = String(cell.v).replace(/\n/g,' ').substring(0,40);
    if (/[؀-ۿA-Za-z0-9%.]/.test(val))
      rowCells.push(`${XLSX.utils.encode_col(C)}${R+1}[${val}]`);
  }
  if (rowCells.length) console.log(rowCells.join('  '));
}
