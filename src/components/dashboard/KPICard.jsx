import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import ProgressBar from '../common/ProgressBar';

// حجم خط القيمة حسب طول النص (الأرقام الطويلة تأخذ خطًا أصغر ليدخل داخل البطاقة)
function fontForLength(len) {
  if (len <= 8)  return 32;
  if (len <= 10) return 28;
  if (len <= 12) return 24;
  if (len <= 14) return 20;
  return 18;
}

/**
 * KPI metric card.
 *
 * @param {{ label, value, unit, trend, trendColor, progress, progressHint, tooltip, valueClass }} props
 *
 * tooltip  — when provided (executive mode), shown as a `title` on the value.
 * valueClass — optional CSS class on the value element (e.g. "gold").
 * The value span re-mounts (triggering .sar-num-anim) whenever `value` changes.
 * Font size adapts to the value length, then shrinks further if it still overflows
 * the card — so full-number amounts stay inside the box.
 */
export default function KPICard({
  label,
  value,
  unit,
  trend,
  trendColor = 'var(--rasf-primary)',
  progress,
  tooltip,
  valueClass = '',
}) {
  const [animKey, setAnimKey] = useState(0);
  const prevValue = useRef(value);
  const wrapRef = useRef(null);
  const spanRef = useRef(null);

  const text      = value == null ? '' : String(value);
  const startFont = fontForLength(text.length);

  useEffect(() => {
    if (prevValue.current !== value) {
      setAnimKey(k => k + 1);
      prevValue.current = value;
    }
  }, [value]);

  // تصغير إضافي بالقياس لو ما زال الرقم أعرض من البطاقة
  useLayoutEffect(() => {
    const wrap = wrapRef.current, span = spanRef.current;
    if (!wrap || !span) return;
    span.style.fontSize = `${startFont}px`;
    const avail = wrap.clientWidth;
    const natural = span.scrollWidth;
    if (avail > 0 && natural > avail) {
      span.style.fontSize = `${Math.max(13, Math.floor(startFont * (avail / natural)))}px`;
    }
  }, [value, animKey, startFont]);

  return (
    <div className="kpi">
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 12 }}>
        {label}
      </div>

      <div
        ref={wrapRef}
        title={tooltip}
        style={{
          fontSize: startFont, fontWeight: 800, color: 'var(--text-hi)',
          lineHeight: 1.1, letterSpacing: '-0.5px',
          cursor: tooltip ? 'help' : undefined,
          overflow: 'hidden',
        }}
      >
        <span
          ref={spanRef}
          key={animKey}
          className={`sar-num-anim ${valueClass}`}
          style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
        >
          {value}
        </span>
      </div>

      {unit && (
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginTop: 5, letterSpacing: '0.3px' }}>
          {unit}
        </div>
      )}

      {trend && (
        <div style={{ fontSize: 12, fontWeight: 600, color: trendColor, marginTop: 14 }}>
          {trend}
        </div>
      )}

      {progress != null && (
        <ProgressBar value={progress} className="mt-3" />
      )}
    </div>
  );
}
