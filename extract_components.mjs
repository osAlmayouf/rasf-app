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
function num(v) {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') { const n = parseFloat(v.replace(/[,،\s]/g,'')); return isNaN(n) ? null : n; }
  return null;
}
function toM(v) {
  const n = num(v);
  if (!n) return null;
  if (n >= 1_000_000) return +(n/1_000_000).toFixed(2);
  if (n >= 1 && n < 500) return n;
  return null;
}

for (const filename of FILES) {
  console.log(`\n${'═'.repeat(60)}\n📊 ${filename}\n${'═'.repeat(60)}`);
  const buf = readFileSync(join(DIR, filename));
  const wb  = XLSX.read(buf, { type: 'buffer', cellText: true });

  // ── Study sheet: areas from row 43 ─────────────────────────
  const study = wb.Sheets['Study'];
  if (study) {
    const r43 = 42; // 0-indexed row 43
    // C43=land area, L43=above grade GBA
    const landArea     = num(cell(study, r43, 2));  // col C
    const aboveGBA     = num(cell(study, r43, 11)); // col L
    const belowGBA     = num(cell(study, r43, 21)); // col V (check)
    console.log(`\n📐 Study row 43:`);
    console.log(`  Land Area (C43):        ${landArea?.toLocaleString()} م²`);
    console.log(`  Above Grade GBA (L43):  ${aboveGBA?.toLocaleString()} م²`);
    // Check for NSA
    // Try row 58 (for inspire-type files)
    for (let c = 0; c < 30; c++) {
      const v = cell(study, 57, c);
      if (v && String(v).includes('NSA')) {
        console.log(`  Row58 col${c+1}: "${String(v).substring(0,40)}" → ${num(cell(study,57,c+1))}`);
      }
    }

    // انسباير component table at rows 60-70
    console.log(`\n  انسباير-style component table (rows 60-70):`);
    for (let r = 59; r <= 70; r++) {
      const label = cell(study, r, 1); // col B
      if (label && typeof label === 'string' && label.trim()) {
        const gbaPct  = num(cell(study, r, 2)); // C
        const gba     = num(cell(study, r, 3)); // D
        const nsaPct  = num(cell(study, r, 4)); // E
        const nsa     = num(cell(study, r, 5)); // F
        const unitSz  = num(cell(study, r, 6)); // G
        const units   = num(cell(study, r, 7)); // H
        if (gbaPct || gba || units)
          console.log(`    B${r+1}: "${String(label).substring(0,25)}" | GBA%=${gbaPct} GBA=${gba} NSA=${nsa} unitSz=${unitSz} units=${units}`);
      }
    }

    // Unit counts rows 130-140 (انسباير)
    console.log(`  انسباير unit table (rows 130-140):`);
    for (let r = 129; r <= 140; r++) {
      const label = cell(study, r, 1); // B
      if (label && typeof label === 'string' && label.trim()) {
        const units = num(cell(study, r, 2)); // C
        const nsa   = num(cell(study, r, 4)); // E
        const unitSz= num(cell(study, r, 5)); // F
        if (units || nsa)
          console.log(`    B${r+1}: "${String(label).substring(0,25)}" units=${units} NSA=${nsa} size=${unitSz}`);
      }
    }
  }

  // ── Summary sheet ───────────────────────────────────────────
  const summ = wb.Sheets['Summary'];
  if (!summ) { console.log('  ⚠️  No Summary sheet'); continue; }

  // Area from H9
  const areaH9 = num(cell(summ, 8, 7)); // H9 (0-indexed: r=8, c=7)
  console.log(`\n📐 Summary H9 area: ${areaH9?.toLocaleString()}`);

  // Units from C24, D24
  const totalUnits = num(cell(summ, 23, 2)); // C24
  const unitArea   = num(cell(summ, 23, 3)); // D24
  console.log(`  C24 total units: ${totalUnits}, D24 avg unit size: ${unitArea}`);

  // Component table rows 26-35 (B=label, C=units, D=unitSize, G=cost_or_area, H=?, I=pct, J=SAR)
  console.log(`\n  Component table (rows 26-35):`);
  for (let r = 25; r <= 35; r++) {
    const label = cell(summ, r, 1); // B
    if (!label || typeof label !== 'string') continue;
    const vals = [];
    for (let c = 2; c <= 12; c++) {
      const v = cell(summ, r, c);
      if (v != null) vals.push(`col${c+1}=${typeof v === 'number' ? v.toLocaleString() : String(v).substring(0,15)}`);
    }
    if (vals.length)
      console.log(`    B${r+1}: "${label.replace(/\n/g,' ').substring(0,30)}" | ${vals.join(', ')}`);
  }

  // Check rows around 24 for header context
  console.log(`\n  Headers around row 24-26:`);
  for (let r = 22; r <= 27; r++) {
    for (let c = 1; c <= 12; c++) {
      const v = cell(summ, r, c);
      if (v && typeof v === 'string' && v.trim().length > 3)
        console.log(`    ${XLSX.utils.encode_cell({r,c})}: "${v.replace(/\n/g,' ').substring(0,40)}"`);
    }
  }
}
