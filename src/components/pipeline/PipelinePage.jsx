import { useState, useEffect } from 'react';
import { useApp } from '../../contexts/useApp';
import { fmtPct, fmtMonthYear } from '../../utils/fmt';
import { addUnit } from '../../utils/fmtMode';
import GlassCard from '../common/GlassCard';
import Tag from '../common/Tag';
import SARNum from '../common/SARNum';
import { Search, Archive, ArrowUp, ArrowUpDown, ChevronDown, ChevronRight, MessageSquare } from 'lucide-react';

function fmtDate(iso, lang) {
  const d = new Date(iso);
  return d.toLocaleDateString(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const TYPE_LABEL_MAP = {
  residential: 'typeRes', commercial: 'typeCom', industrial: 'typeInd', infrastructure: 'typeInfra',
  luxury_residential: 'typeCom', mixed: 'typeCom', hotel: 'typeCom',
};

const SORT_OPTIONS = [
  { key: 'opportunityDate', label: 'تاريخ الفرصة' },
  { key: 'lastUpdated',     label: 'آخر تحديث'    },
  { key: 'investmentM',     label: 'حجم الاستثمار' },
];

function SortToggle({ active, dir, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
        cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
        background: active ? 'var(--rasf-primary-dim)' : 'transparent',
        border: `1px solid ${active ? 'var(--rasf-primary)' : 'var(--border-mid)'}`,
        color: active ? 'var(--rasf-primary)' : 'var(--text-muted)',
      }}
    >
      {label}
      <span style={{ fontSize: 9, opacity: active ? 1 : 0.4 }}>
        {active
        ? <ArrowUp size={10} style={{ transform: dir === 'desc' ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
        : <ArrowUpDown size={10} style={{ opacity: 0.4 }} />}
      </span>
    </button>
  );
}

export default function PipelinePage() {
  const { t, lang, portfolioService, notesService, refreshPortfolio, setPage, setSelectedProjectId, setOuterProjectTab, displayMode } = useApp();
  const [confirm, setConfirm]           = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [sortKey, setSortKey]           = useState('opportunityDate');
  const [sortDir, setSortDir]           = useState('asc');
  const [notesByProject, setNotesByProject] = useState({});

  const projects = portfolioService.getPipelineProjects();
  const archived = portfolioService.getArchivedProjects();

  useEffect(() => {
    if (!projects.length) return;
    Promise.all(
      projects.map(p =>
        notesService.getNotesForProject(p.id).then(notes => ({ id: p.id, notes }))
      )
    ).then(results => {
      const map = {};
      results.forEach(({ id, notes }) => {
        const active = notes.filter(n => !n.deletedFromPortfolio).slice(0, 3);
        if (active.length > 0) map[id] = active;
      });
      setNotesByProject(map);
    });
  }, [projects.map(p => p.id).join(',')]); // eslint-disable-line

  const activeProjects = [...projects].sort((a, b) => {
    let va = a[sortKey] ?? (sortKey === 'investmentM' ? 0 : '9999-99-99');
    let vb = b[sortKey] ?? (sortKey === 'investmentM' ? 0 : '9999-99-99');
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });

  function handleSort(key) {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  const openDetail = (id) => { setSelectedProjectId(id); setOuterProjectTab('pipeline'); setPage('project'); };

  const handleConfirm = () => {
    if (!confirm) return;
    if (confirm.action === 'archive') {
      portfolioService.archiveProject(confirm.id);
    } else if (confirm.action === 'promote') {
      portfolioService.promoteProject(confirm.id);
      setSelectedProjectId(confirm.id);
      setPage('project');
    } else if (confirm.action === 'restore') {
      portfolioService.restoreProject(confirm.id);
    }
    refreshPortfolio();
    setConfirm(null);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Confirm modal */}
      {confirm && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.6)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setConfirm(null)}
        >
          <div
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 28, minWidth: 320, maxWidth: 420,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-base font-bold mb-2" style={{ color: 'var(--text-hi)' }}>
              {confirm.action === 'archive'  && t('plArchiveConfirm')}
              {confirm.action === 'promote'  && t('plPromoteConfirm')}
              {confirm.action === 'restore'  && t('plRestore')}
            </div>
            <div className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
              {confirm.action === 'archive'  && t('plArchiveNote')}
              {confirm.action === 'promote'  && t('plPromoteNote')}
              {confirm.action === 'restore'  && t('plArchiveNote')}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 9, fontWeight: 700, fontSize: 13,
                  background: confirm.action === 'archive' ? '#6B5545'
                            : confirm.action === 'promote' ? 'var(--rasf-primary)'
                            : '#4f8ef7',
                  color: '#fff', border: 'none', cursor: 'pointer',
                }}
              >
                {confirm.action === 'archive' && t('plArchive')}
                {confirm.action === 'promote' && t('plPromote')}
                {confirm.action === 'restore' && t('plRestore')}
              </button>
              <button
                onClick={() => setConfirm(null)}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 9, fontWeight: 600, fontSize: 13,
                  background: 'var(--bg-app)', border: '1px solid var(--border)',
                  color: 'var(--text-muted)', cursor: 'pointer',
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div>
        <div className="section-hd">{t('ptPipeline')}</div>
        <div className="section-sub">{t('pipelineSubtitle') || 'المشاريع قيد الدراسة والتقييم'}</div>
      </div>

      {/* Empty state */}
      {activeProjects.length === 0 && archived.length === 0 && (
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search size={48} style={{ marginBottom: 16, opacity: 0.25, color: 'var(--rasf-primary)' }} />
            <div className="section-hd mb-2">{t('pipelineEmpty')}</div>
            <div className="section-sub" style={{ maxWidth: 420 }}>{t('pipelineEmptySub')}</div>
          </div>
        </GlassCard>
      )}

      {/* Two-column layout: table (left) + notes (right) */}
      {activeProjects.length > 0 && (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

      {/* Left column: table + archived */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Projects table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          {/* Table header */}
          <div className="flex justify-between items-center px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <div className="section-hd">{t('ptPipeline')}</div>
              <div className="section-sub">{t('pipelineSubtitle') || 'المشاريع قيد الدراسة والتقييم'}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {SORT_OPTIONS.map(opt => (
                <SortToggle
                  key={opt.key}
                  label={opt.label}
                  active={sortKey === opt.key}
                  dir={sortDir}
                  onClick={() => handleSort(opt.key)}
                />
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-card-strong)' }}>
                  <th className="text-right px-4 py-3"
                    style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.6px', width: 40 }}>
                    #
                  </th>
                  <th className="text-right px-6 py-3"
                    style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                    {t('th1')}
                  </th>
                  <th className="text-right px-6 py-3"
                    style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.6px' }}>
                    تاريخ الفرصة
                  </th>
                  <th className="text-right px-6 py-3"
                    style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.6px' }}>
                    {addUnit(t('plTotalInv'), displayMode, lang)}
                  </th>
                  {['ROI', 'IRR', 'ROE'].map(k => (
                    <th key={k} className="text-right px-6 py-3"
                      style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.6px' }}>
                      {k}
                    </th>
                  ))}
                  <th className="text-right px-6 py-3"
                    style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.6px' }}>
                    الحالة
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {activeProjects.map((p, idx) => (
                  <tr
                    key={p.id}
                    className="border-t"
                    style={{ borderColor: 'var(--border)', background: idx % 2 === 0 ? 'var(--bg-row-a)' : 'var(--bg-row-b)' }}
                  >
                    <td className="px-4 py-4">
                      <div
                        style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: 'var(--bg-tag-warm)', border: '1px solid var(--border-tag-warm)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color: 'var(--rasf-primary)',
                        }}
                      >
                        {idx + 1}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div style={{ fontWeight: 700, color: 'var(--text-hi)', fontSize: 13 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{p.location}</div>
                      {p.type && (
                        <div style={{ marginTop: 5 }}>
                          <Tag variant="purple">{t(TYPE_LABEL_MAP[p.type] ?? 'typeCom')}</Tag>
                        </div>
                      )}
                      {p.lastUpdated && (
                        <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>آخر تحديث:</span>
                          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{fmtMonthYear(p.lastUpdated)}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4" style={{ fontSize: 12, color: 'var(--text-lo)', whiteSpace: 'nowrap' }}>
                      {fmtMonthYear(p.opportunityDate)}
                    </td>

                    <td className="px-6 py-4" style={{ fontWeight: 700, color: 'var(--text-hi)', fontSize: 13, whiteSpace: 'nowrap' }}>
                      <SARNum millions={p.investmentM} symbolSize="0.85em" />
                    </td>

                    <td className="px-6 py-4" style={{ fontWeight: 800, color: 'var(--rasf-primary)', fontSize: 14 }}>{fmtPct(p.roi)}</td>
                    <td className="px-6 py-4" style={{ fontWeight: 700, color: 'var(--text-hi)', fontSize: 13 }}>{fmtPct(p.irr)}</td>
                    <td className="px-6 py-4" style={{ fontWeight: 600, color: 'var(--text-lo)', fontSize: 13 }}>{fmtPct(p.roeAnnual)}</td>

                    <td className="px-6 py-4">
                      <Tag variant="blue">{t('statusPipeline')}</Tag>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openDetail(p.id)}
                          style={{
                            background: 'transparent', border: '1px solid var(--border-mid)', color: 'var(--text-muted)',
                            borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 600,
                            cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--rasf-primary)'; e.currentTarget.style.color = 'var(--rasf-primary)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-mid)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                          فتح
                        </button>
                        <button
                          onClick={() => setConfirm({ id: p.id, action: 'promote' })}
                          style={{
                            background: 'var(--rasf-primary)', color: 'var(--bg-app)',
                            border: 'none', borderRadius: 6,
                            padding: '4px 12px', fontSize: 11, fontWeight: 700,
                            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'opacity .15s',
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          <ArrowUp size={11} />
                          {t('plPromote')}
                        </button>
                        <button
                          onClick={() => setConfirm({ id: p.id, action: 'archive' })}
                          style={{
                            background: 'var(--bg-app)', color: 'var(--text-muted)',
                            border: '1px solid var(--border)', borderRadius: 6,
                            padding: '4px 10px', fontSize: 11, fontWeight: 600,
                            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s',
                            display: 'flex', alignItems: 'center',
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--rasf-accent)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                        >
                          <Archive size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      {/* Archived section */}
      {archived.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, marginBottom: 12,
            }}
          >
            {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            {t('plArchived')}
            <span
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 20, padding: '1px 9px', fontSize: 11,
              }}
            >
              {archived.length}
            </span>
          </button>

          {showArchived && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              <table className="w-full text-sm">
                <tbody>
                  {archived.map((p, idx) => (
                    <tr
                      key={p.id}
                      className="border-t"
                      style={{
                        borderColor: 'var(--border)',
                        background: idx % 2 === 0 ? 'var(--bg-row-a)' : 'var(--bg-row-b)',
                        opacity: 0.7,
                      }}
                    >
                      <td className="px-4 py-3">
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg-app)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)' }}>
                          <Archive size={14} />
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-bold text-sm" style={{ color: 'var(--text-hi)' }}>{p.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.location}</div>
                      </td>
                      <td className="px-6 py-3" style={{ fontSize: 12, color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
                        <SARNum millions={p.investmentM} symbolSize="0.8em" />
                      </td>
                      <td className="px-6 py-3" style={{ fontSize: 12, color: 'var(--text-muted)' }}>IRR {fmtPct(p.irr)}</td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => setConfirm({ id: p.id, action: 'restore' })}
                          style={{
                            background: 'var(--bg-app)', border: '1px solid var(--border)',
                            borderRadius: 7, padding: '5px 12px', fontSize: 11, fontWeight: 600,
                            color: '#4f8ef7', cursor: 'pointer',
                          }}
                        >
                          {t('plRestore')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      </div>{/* end left column */}

      {/* Right column: Notes panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 14, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <MessageSquare size={14} style={{ color: 'var(--rasf-primary)', flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-hi)' }}>
              {lang === 'ar' ? 'آخر الملاحظات' : 'Latest Notes'}
            </span>
          </div>

          {/* Notes per project */}
          <div style={{ padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {activeProjects.filter(p => notesByProject[p.id]?.length > 0).length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-faint)', fontSize: 12 }}>
                {lang === 'ar' ? 'لا توجد ملاحظات بعد' : 'No notes yet'}
              </div>
            ) : (
              activeProjects.filter(p => notesByProject[p.id]?.length > 0).map(project => (
                <div key={project.id}>
                  {/* Project name */}
                  <button
                    onClick={() => { setSelectedProjectId(project.id); setOuterProjectTab('pipeline'); setPage('project'); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%',
                    }}
                  >
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--rasf-primary)', display: 'inline-block',
                    }} />
                    <span style={{ color: 'var(--rasf-primary)', fontWeight: 700, fontSize: 12 }}>
                      {project.name}
                    </span>
                  </button>

                  {/* Last 3 notes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {notesByProject[project.id].map(note => (
                      <div
                        key={note.id}
                        style={{
                          background: 'var(--bg-card-strong)',
                          border: '1px solid var(--border-faint)',
                          borderRadius: 9, padding: '8px 11px',
                        }}
                      >
                        <p style={{
                          color: 'var(--text-hi)', fontSize: 11.5, lineHeight: 1.65,
                          margin: 0, textAlign: 'right',
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {note.text}
                        </p>
                        <div style={{ marginTop: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 9.5, color: 'var(--text-faint)' }}>
                            {fmtDate(note.createdAt, lang)}
                          </span>
                          <span style={{
                            fontSize: 9.5, color: 'var(--rasf-primary)', fontWeight: 600,
                            background: 'var(--rasf-primary-dim)',
                            border: '1px solid var(--border-tag-warm)',
                            borderRadius: 4, padding: '1px 6px',
                          }}>
                            {note.addedBy}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>{/* end right column */}

      </div>)}{/* end two-column grid */}

    </div>
  );
}
