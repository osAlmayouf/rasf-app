import { useState, useEffect, useCallback } from 'react';
import { ActivityService } from '../../services/ActivityService';
import { FolderKanban, ArrowUpDown, ScrollText, FileText, Image, StickyNote, Activity, RefreshCw, Loader } from 'lucide-react';

// أيقونة ولون كل نوع عملية
const TYPE_META = {
  project:  { icon: FolderKanban, color: '#A4907E' },
  status:   { icon: ArrowUpDown,  color: '#f59e0b' },
  contract: { icon: ScrollText,   color: '#8b5cf6' },
  file:     { icon: FileText,     color: '#3b82f6' },
  image:    { icon: Image,        color: '#10b981' },
  note:     { icon: StickyNote,   color: '#6b7280' },
};

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ar-SA-u-nu-latn', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
};

export default function ActivityLogPage() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setRows(await ActivityService.getAll());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const q = query.trim();
  const filtered = q
    ? rows.filter(r => `${r.performed_by} ${r.action} ${r.entity_name ?? ''} ${r.details ?? ''}`.includes(q))
    : rows;

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="section-hd">سجل العمليات</div>
          <div className="section-sub">{rows.length} عملية</div>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="بحث باسم الموظف أو العملية…"
            className="text-sm rounded-lg px-3 py-2"
            style={{ background: 'var(--bg-card-strong)', border: '1px solid var(--border)', outline: 'none', color: 'var(--text-hi)', minWidth: 220 }}
          />
          <button onClick={load} title="تحديث" className="rounded-lg px-3 py-2"
            style={{ background: 'var(--bg-card-strong)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader size={26} style={{ animation: 'spin 1s linear infinite', color: 'var(--rasf-primary)' }} />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-faint)', fontSize: 13 }}>
          {rows.length === 0 ? 'لا توجد عمليات مسجّلة بعد.' : 'لا نتائج مطابقة للبحث.'}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-card-strong)' }}>
                {['العملية', 'المشروع / العنصر', 'الموظف', 'التاريخ والوقت'].map(h => (
                  <th key={h} className="text-right px-5 py-3" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const meta = TYPE_META[r.entity_type] ?? { icon: Activity, color: 'var(--text-muted)' };
                const Icon = meta.icon;
                return (
                  <tr key={r.id} style={{ borderTop: '1px solid var(--border-faint)' }}>
                    <td className="px-5 py-3">
                      <span style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: 'var(--bg-card-strong)', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: meta.color }}>
                          <Icon size={14} />
                        </span>
                        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-hi)' }}>{r.action}</span>
                          {r.details && (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{r.details}</span>
                          )}
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-lo)' }}>{r.entity_name ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: 'var(--rasf-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>
                          {(r.performed_by ?? '؟')[0]}
                        </span>
                        <span style={{ color: 'var(--text-hi)', fontWeight: 500 }}>{r.performed_by}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDateTime(r.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
