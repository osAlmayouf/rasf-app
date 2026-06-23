export const fmtPct = v => (v != null && v !== '' ? `${Number(v).toFixed(1)}%` : '—');

export const fmtMonthYear = iso => {
  if (!iso) return '—';
  const [y, m] = iso.split('-');
  return `${m}/${y}`;
};

// Convert SAR millions → thousands (ألف ريال) with comma separators
// fmtK(1127) = "1,127,000" | fmtK(26.36) = "26,360" | fmtK(0.5) = "500"
export const fmtK = (millions) => {
  if (millions == null || millions === '') return '—';
  const v = Number(millions);
  if (isNaN(v) || v === 0) return '—';
  const thousands = parseFloat((v * 1000).toFixed(1));
  const str = thousands % 1 === 0 ? String(Math.round(thousands)) : thousands.toFixed(1);
  const [int, dec] = str.split('.');
  const formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec ? `${formatted}.${dec}` : formatted;
};
