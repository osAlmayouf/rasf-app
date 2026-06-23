export default function ProgressBar({ value, className = '', showLabel = false, style = {} }) {
  if (showLabel) {
    return (
      <div className={`flex items-center gap-2 ${className}`} style={style}>
        <div className="progress" style={{ width: 80 }}>
          <div className="progress-fill" style={{ width: `${value}%` }} />
        </div>
        <span className="text-xs" style={{ color: '#7A6E67' }}>{Number(value).toFixed(1)}%</span>
      </div>
    );
  }

  return (
    <div className={`progress ${className}`} style={style}>
      <div className="progress-fill" style={{ width: `${value}%` }} />
    </div>
  );
}
