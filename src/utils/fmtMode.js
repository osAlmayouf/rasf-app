import { fmtK } from './fmt';

// @typedef {'thousands' | 'full'} DisplayMode

/**
 * Format a SAR value stored in millions.
 *
 * thousands (default): v × 1,000  → "1,127,000"          displayed as ألف ريال
 * full:                v × 1,000,000 → "1,127,000,000"   actual SAR amount
 */
export function fmtSARMode(millions, mode) {
  if (millions == null) return '—';
  const v = Number(millions);
  if (isNaN(v) || v === 0) return '—';

  if (mode === 'full') {
    const full = Math.round(v * 1_000_000);
    return full.toLocaleString('en-US');
  }

  return fmtK(v);
}

/**
 * Full SAR value string — used as tooltip in thousands mode.
 */
export function fmtSARFull(millions, lang) {
  if (millions == null) return '—';
  const v = Number(millions);
  if (isNaN(v) || v === 0) return '—';
  const s = Math.round(v * 1_000_000).toLocaleString('en-US');
  return lang === 'ar' ? `${s} ريال` : `${s} SAR`;
}

/**
 * Strip trailing unit hint in parentheses from a label when in full mode.
 * Works for both Arabic "(ألف)" patterns and English "(SAR 000)" patterns.
 * Only removes the LAST parenthesised group so other parentheses are preserved.
 */
export function stripUnit(label, mode) {
  if (mode !== 'full' || !label) return label;
  return label.replace(/\s*\([^)]*(?:ألف|SAR 000|SAR thousands|thousands)[^)]*\)\s*$/, '').trim();
}

/**
 * Append a thousands-unit hint to a label in thousands mode.
 * No-op in full mode — so labels read naturally without "(ألف)" when showing full SAR.
 *
 * addUnit('الصافي', 'thousands', 'ar') → 'الصافي (ألف)'
 * addUnit('الصافي', 'full',      'ar') → 'الصافي'
 */
export function addUnit(label, mode, lang) {
  if (!label || mode === 'full') return label;
  return label + (lang === 'ar' ? ' (ألف)' : ' (000)');
}

/**
 * Y-axis tick formatter for Chart.js.
 *
 * thousands: v × 1,000      → comma-separated thousands
 * full:      v × 1,000,000  → comma-separated full SAR
 */
export function fmtYMode(v, mode) {
  if (v === 0) return '0';
  const sign = v < 0 ? '-' : '';
  const abs  = Math.abs(v);
  if (mode === 'full') {
    return sign + Math.round(abs * 1_000_000).toLocaleString('en-US');
  }
  return sign + Math.round(abs * 1000).toLocaleString('en-US');
}
