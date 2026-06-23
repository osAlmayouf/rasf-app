export default function GlassCard({ children, className = '', strong = false, rounded = '2xl', padding = 'p-4' }) {
  return (
    <div
      className={`rounded-${rounded} ${padding} ${className}`}
      style={{
        background: strong ? 'var(--bg-card-strong)' : 'var(--bg-card)',
        border: `1px solid ${strong ? 'var(--border-soft)' : 'var(--border)'}`,
      }}
    >
      {children}
    </div>
  );
}
