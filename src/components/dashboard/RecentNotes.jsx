import { useState, useEffect } from 'react';
import { useApp }  from '../../contexts/useApp';
import GlassCard   from '../common/GlassCard';

function fmtDateTime(iso, lang) {
  const d = new Date(iso);
  const locale   = lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US';
  const datePart = d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
  const timePart = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${datePart} — ${timePart}`;
}

export default function RecentNotes() {
  const { t, lang, notesService, portfolioService, setPage, setSelectedProjectId, setOuterProjectTab } = useApp();
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    notesService.getAllNotes().then(allNotes => {
      const portfolioNotes = allNotes.filter(note => {
        if (note.deletedFromPortfolio) return false;
        const proj = portfolioService?.getProject(note.projectId);
        return proj && proj.status !== 'pipeline' && proj.status !== 'archived';
      });
      setNotes(portfolioNotes);
    });
  }, [notesService, portfolioService]);

  const handleClick = (note) => {
    setSelectedProjectId(note.projectId);
    setOuterProjectTab('active');
    setPage('project');
  };

  return (
    <GlassCard style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="section-hd mb-4">{t('recentNotesT')}</div>

      {notes.length === 0 ? (
        <div
          className="text-center py-6"
          style={{ color: 'var(--text-faint)', fontSize: 13 }}
        >
          {t('recentNotesEmpty')}
        </div>
      ) : (
        <div
          className="space-y-2"
          style={{ maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}
        >
          {notes.map(note => {
            const project = portfolioService?.getProject(note.projectId);
            return (
              <button
                key={note.id}
                onClick={() => handleClick(note)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'right',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-faint)',
                  borderRadius: 12,
                  padding: '11px 14px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--rasf-primary)';
                  e.currentTarget.style.background   = 'var(--bg-card-strong)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-faint)';
                  e.currentTarget.style.background   = 'var(--bg-card)';
                }}
              >
                {/* Project name + timestamp row */}
                <div className="flex justify-between items-center mb-1 gap-2">
                  <span style={{ color: 'var(--text-muted)', fontSize: 10, flexShrink: 0 }}>
                    {fmtDateTime(note.createdAt, lang)}
                  </span>
                  <span style={{ color: 'var(--rasf-primary)', fontSize: 11, fontWeight: 600 }}>
                    {project?.name ?? note.projectId}
                  </span>
                </div>

                {/* Note text */}
                <p
                  style={{
                    color: 'var(--text-lo)',
                    fontSize: 12,
                    lineHeight: 1.6,
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textAlign: 'right',
                  }}
                >
                  {note.text}
                </p>

                {/* Author */}
                <div style={{ marginTop: 5, textAlign: 'left' }}>
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--text-faint)',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-faint)',
                      borderRadius: 5,
                      padding: '1px 7px',
                    }}
                  >
                    {note.addedBy}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
