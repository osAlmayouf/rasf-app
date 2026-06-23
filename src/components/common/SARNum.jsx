import { useRef, useEffect, useState } from 'react';
import { useApp } from '../../contexts/useApp';
import { fmtSARMode, fmtSARFull } from '../../utils/fmtMode';
import SARSymbol from './SARSymbol';

/**
 * Mode-aware SAR number display.
 *
 * thousands (default): shows value in ألف ريال scale ("1,127,000")
 *                      tooltip reveals the full exact SAR amount on hover
 * full:                shows the actual SAR amount ("1,127,000,000")
 *
 * Animates on every mode switch via CSS keyframe.
 */
export default function SARNum({ millions, showSymbol = true, symbolSize = '0.8em', className, style }) {
  const { displayMode, lang } = useApp();
  const [animKey, setAnimKey] = useState(0);
  const prevMode = useRef(displayMode);

  useEffect(() => {
    if (prevMode.current !== displayMode) {
      setAnimKey(k => k + 1);
      prevMode.current = displayMode;
    }
  }, [displayMode]);

  const display  = fmtSARMode(millions, displayMode);
  // Tooltip in thousands mode shows the full SAR value so users can verify the exact amount
  const tooltip  = displayMode === 'thousands' ? fmtSARFull(millions, lang) : undefined;

  if (display === '—') return <span className={className} style={style}>—</span>;

  return (
    <span
      className={className}
      title={tooltip}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 3,
        cursor: tooltip ? 'help' : undefined,
        ...style,
      }}
    >
      <span key={animKey} className="sar-num-anim">
        {display}
      </span>
      {showSymbol && <SARSymbol size={symbolSize} style={{ opacity: 0.75 }} />}
    </span>
  );
}
