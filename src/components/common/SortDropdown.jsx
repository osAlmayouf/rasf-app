import { useState, useRef, useEffect } from 'react';
import { ArrowUp, ArrowUpDown, ChevronDown, Check } from 'lucide-react';

// قائمة منسدلة لترتيب الجداول: تعرض حقل الترتيب الحالي واتجاهه،
// وعند فتحها تُظهر خيارات الترتيب. اختيار الحقل النشط يعكس الاتجاه.
export default function SortDropdown({ options, sortKey, sortDir, onSort, label = 'ترتيب حسب' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const current = options.find(o => o.key === sortKey);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
          background: 'var(--bg-card-strong)',
          border: `1px solid ${open ? 'var(--rasf-primary)' : 'var(--border-mid)'}`,
          color: 'var(--text-hi)',
        }}
      >
        <ArrowUpDown size={13} style={{ color: 'var(--text-muted)' }} />
        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}:</span>
        <span>{current?.label ?? '—'}</span>
        <ArrowUp
          size={12}
          style={{ color: 'var(--rasf-primary)', transform: sortDir === 'desc' ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}
        />
        <ChevronDown size={13} style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', insetInlineEnd: 0, zIndex: 50,
            minWidth: 180, padding: 4, borderRadius: 10,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          }}
        >
          {options.map(opt => {
            const active = opt.key === sortKey;
            return (
              <button
                key={opt.key}
                onClick={() => { onSort(opt.key); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                  width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', transition: 'background .12s', textAlign: 'right',
                  background: active ? 'var(--rasf-primary-dim)' : 'transparent',
                  border: 'none', color: active ? 'var(--rasf-primary)' : 'var(--text-muted)',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-card-strong)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {active && (
                    <ArrowUp size={12} style={{ transform: sortDir === 'desc' ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
                  )}
                  {opt.label}
                </span>
                {active && <Check size={14} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
