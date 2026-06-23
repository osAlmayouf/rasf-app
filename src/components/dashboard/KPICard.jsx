import { useEffect, useRef, useState } from 'react';
import ProgressBar from '../common/ProgressBar';

/**
 * KPI metric card.
 *
 * @param {{ label, value, unit, trend, trendColor, progress, progressHint, tooltip, valueClass }} props
 *
 * tooltip  — when provided (executive mode), shown as a `title` on the value
 *            and a subtle cursor:help hint, so hovering reveals the exact number.
 * valueClass — optional CSS class on the value element (e.g. "gold").
 * The value span re-mounts (triggering .sar-num-anim) whenever `value` changes.
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

  useEffect(() => {
    if (prevValue.current !== value) {
      setAnimKey(k => k + 1);
      prevValue.current = value;
    }
  }, [value]);

  return (
    <div className="kpi">
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 12 }}>
        {label}
      </div>

      <div
        title={tooltip}
        style={{
          fontSize: 32, fontWeight: 800, color: 'var(--text-hi)',
          lineHeight: 1.1, letterSpacing: '-0.5px',
          cursor: tooltip ? 'help' : undefined,
        }}
      >
        <span key={animKey} className={`sar-num-anim ${valueClass}`}>
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
