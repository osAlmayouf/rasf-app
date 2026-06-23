import { useApp } from '../../contexts/useApp';
import GlassCard from '../common/GlassCard';

function fmtDate(iso, lang) {
  const d = new Date(iso);
  const locale = lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US';
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

export default function RecentNotes() {
  const { t, lang, notesService, portfolioService, setPage, setSelectedProjectId } = useApp();
  const notes = notesService.getRecentPortfolioNotes(3);

  const handleClick = (note) => {
    setSelectedProjectId(note.projectId);
    setPage('projects');
  };

  return (
    <GlassCard>
      <div className="section-hd mb-4">{t('recentNotesT')}</div>

      {notes.length === 0 ? (
        <div
          className="text-center py-6"
          style={{ color: 'var(--text-faint)', fontSize: 13 }}
        >
          {t('recentNotesEmpty')}
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map(note => {
            const project = portfolioService.getProject(note.projectId);
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
                <div className="flex justify-between items-center mb-1">
                  <span style={{ color: 'var(--text-muted)', fontSize: 10, flexShrink: 0 }}>
                    {fmtDate(note.createdAt, lang)}
                  </span>
                  <span style={{ color: 'var(--rasf-primary)', fontSize: 11, fontWeight: 600 }}>
                    {project?.name ?? note.projectId}
                  </span>
                </div>
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
              </button>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
