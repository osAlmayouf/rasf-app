import { useState, useEffect, useCallback } from 'react';
import { useApp }  from '../../../contexts/useApp';
import { useAuth } from '../../../contexts/useAuth';
import GlassCard   from '../../common/GlassCard';

function fmtDateTime(iso, lang) {
  const d = new Date(iso);
  const locale   = lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US';
  const datePart = d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  const timePart = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${datePart} — ${timePart}`;
}

export default function ProjectNotes({ project }) {
  const { t, lang, notesService } = useApp();
  const { profile }               = useAuth();
  const [notes,   setNotes]   = useState([]);
  const [adding,  setAdding]  = useState(false);
  const [draft,   setDraft]   = useState('');
  const [saving,  setSaving]  = useState(false);

  const fetchNotes = useCallback(async () => {
    const data = await notesService.getNotesForProject(project.id);
    setNotes(data);
  }, [notesService, project.id]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleSave = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await notesService.addNote(project.id, draft.trim(), profile);
      setDraft('');
      setAdding(false);
      await fetchNotes();
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (noteId) => {
    await notesService.removeFromPortfolio(noteId);
    await fetchNotes();
  };

  return (
    <div className="space-y-4">

      {/* Header card with "Add" button / inline form */}
      <GlassCard>
        <div className="flex justify-between items-center mb-4">
          <div className="section-hd">{t('notesTitle')}</div>
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              style={{
                background: 'var(--rasf-primary-dim)',
                border: '1px solid var(--rasf-primary)',
                color: 'var(--rasf-primary)',
                borderRadius: 10,
                padding: '6px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t('notesAdd')}
            </button>
          )}
        </div>

        {adding && (
          <div className="space-y-3">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder={t('notesPlaceholder')}
              rows={4}
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1px solid var(--rasf-primary)',
                borderRadius: 12,
                padding: '12px 14px',
                color: 'var(--text-hi)',
                fontSize: 14,
                lineHeight: 1.7,
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setAdding(false); setDraft(''); }}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  borderRadius: 8,
                  padding: '6px 16px',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {t('notesCancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={!draft.trim() || saving}
                style={{
                  background: draft.trim() && !saving ? 'var(--rasf-primary)' : 'var(--rasf-primary-dim)',
                  border: 'none',
                  color: draft.trim() && !saving ? 'var(--bg-app)' : 'var(--text-faint)',
                  borderRadius: 8,
                  padding: '6px 22px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: draft.trim() && !saving ? 'pointer' : 'not-allowed',
                }}
              >
                {saving ? '...' : t('notesSave')}
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div
          className="glass rounded-2xl p-10 text-center"
          style={{ color: 'var(--text-faint)', fontSize: 14 }}
        >
          {t('notesEmpty')}
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => {
            const deleted = note.deletedFromPortfolio;
            return (
              <div
                key={note.id}
                style={{
                  background: deleted ? 'var(--bg-subtle)' : 'var(--bg-card-strong)',
                  border: deleted ? '1px solid var(--border-faint)' : '1px solid var(--border-soft)',
                  borderRadius: 16,
                  padding: '16px 18px',
                  opacity: deleted ? 0.55 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        color: deleted ? 'var(--text-muted)' : 'var(--text-hi)',
                        fontSize: 14,
                        lineHeight: 1.75,
                        margin: 0,
                        textDecoration: deleted ? 'line-through' : 'none',
                        textDecorationColor: 'var(--border-mid)',
                        wordBreak: 'break-word',
                      }}
                    >
                      {note.text}
                    </p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {/* Author */}
                      <span style={{ color: 'var(--rasf-primary)', fontSize: 11, fontWeight: 600 }}>
                        {note.addedBy}
                      </span>
                      <span style={{ color: 'var(--border-mid)', fontSize: 11 }}>·</span>
                      <span style={{ color: '#7A6E67', fontSize: 11 }}>
                        {fmtDateTime(note.createdAt, lang)}
                      </span>
                      {deleted && (
                        <span
                          style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.18)',
                            color: '#ef4444',
                            borderRadius: 6,
                            padding: '1px 8px',
                            fontSize: 10,
                            fontWeight: 500,
                          }}
                        >
                          {t('notesDeletedBadge')}
                        </span>
                      )}
                    </div>
                  </div>

                  {!deleted && (
                    <button
                      onClick={() => handleRemove(note.id)}
                      title={t('notesRemove')}
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: 11,
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: 'transparent',
                        border: '1px solid transparent',
                        cursor: 'pointer',
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)';
                        e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {t('notesRemove')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
