import { Fragment, useState } from 'react';
import { useApp } from '../../contexts/useApp';
import { ProjectStatus } from '../../models/Project';
import GlassCard from '../common/GlassCard';
import { Check, X, Circle } from 'lucide-react';

const PHASE_KEYS = ['lc1', 'lc2', 'lc3', 'lc4', 'lc5'];
const TOTAL = PHASE_KEYS.length;

// Derive the number of completed phases from the project's status
function defaultCompleted(status) {
  switch (status) {
    case ProjectStatus.PLANNING:  return 1;
    case ProjectStatus.FINANCING: return 2;
    case ProjectStatus.ACTIVE:    return 3;
    case ProjectStatus.COMPLETED: return TOTAL;
    default:                      return 0;
  }
}

// localStorage key scoped to each project
const storageKey = (projectId) => `lifecycle_completed_${projectId}`;

function loadCompleted(projectId, status) {
  try {
    const stored = localStorage.getItem(storageKey(projectId));
    if (stored !== null) return Number(stored);
  } catch {}
  return defaultCompleted(status);
}

function saveCompleted(projectId, value) {
  try {
    localStorage.setItem(storageKey(projectId), String(value));
  } catch {}
}

// خط سير المشروع
export default function ProjectLifecycle({ projectId, status }) {
  const { t } = useApp();

  // Initialise once: prefer saved value, fall back to status-derived default
  const [completed, setCompleted] = useState(() => loadCompleted(projectId, status));

  // Index of the phase showing confirmation buttons (null = none)
  const [pendingIdx, setPendingIdx] = useState(null);

  const phaseState = (i) => {
    if (i < completed)                 return 'done';
    if (i === completed && i < TOTAL)  return 'active';
    return 'pending';
  };

  const handleClick = (i) => {
    const s = phaseState(i);
    if (s === 'active' || (s === 'done' && i === completed - 1)) {
      setPendingIdx(prev => (prev === i ? null : i));
    }
  };

  const handleConfirm = (i) => {
    const next = phaseState(i) === 'active' ? i + 1 : i;
    setCompleted(next);
    saveCompleted(projectId, next);   // ← persist across navigations & refreshes
    setPendingIdx(null);
  };

  return (
    <GlassCard className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="section-hd">{t('dLcT')}</div>
          <div className="section-sub">{t('dLcS')}</div>
        </div>
      </div>

      <div className="flex items-stretch" style={{ gap: 6 }}>
        {PHASE_KEYS.map((ph, i) => {
          const s         = phaseState(i);
          const isDone    = s === 'done';
          const isActive  = s === 'active';
          const clickable = isActive || (isDone && i === completed - 1);
          const isPending = pendingIdx === i;

          return (
            <Fragment key={ph}>
              <div
                className={`lifecycle-step ${isDone ? 'done' : isActive ? 'active-step' : ''}`}
                style={{ minWidth: 0, cursor: clickable ? 'pointer' : 'default', userSelect: 'none' }}
                onClick={() => { if (!isPending) handleClick(i); }}
              >
                <div className="text-xs mb-1" style={{ color: isDone ? '#10b981' : isActive ? 'var(--rasf-primary)' : 'var(--text-faint)' }}>
                  {t(`${ph}ph`)}
                </div>
                <div className="font-semibold text-sm" style={{ color: isDone ? '#10b981' : isActive ? 'var(--rasf-primary)' : 'var(--text-muted)' }}>
                  {t(`${ph}n`)}
                </div>

                <div className="mt-2 text-xs">
                  {isPending ? (
                    <div className="flex flex-col gap-1 mt-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleConfirm(i)}
                        style={{
                          background: isDone ? '#dc2626' : '#10b981',
                          color: '#fff', border: 'none', borderRadius: 5,
                          padding: '3px 5px', fontSize: 10, cursor: 'pointer',
                          fontWeight: 700, lineHeight: 1.4, whiteSpace: 'nowrap',
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          {isDone ? <><X size={10} /> تراجع عن الاكتمال</> : <><Check size={10} /> تأكيد الاكتمال</>}
                        </span>
                      </button>
                      <button
                        onClick={() => setPendingIdx(null)}
                        style={{
                          background: 'var(--border)', color: 'var(--text-muted)',
                          border: 'none', borderRadius: 5, padding: '3px 5px',
                          fontSize: 10, cursor: 'pointer', lineHeight: 1.4, whiteSpace: 'nowrap',
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                        }}
                      >
                        <X size={10} /> إلغاء
                      </button>
                    </div>
                  ) : (
                    <>
                      {isDone   && <Check size={12} style={{ color: '#10b981' }} />}
                      {isActive && <span style={{ color: 'var(--rasf-primary)', fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 3 }}><Circle size={7} fill="currentColor" /> جارٍ</span>}
                      {!isDone && !isActive && <span style={{ color: 'var(--text-faint)' }}>—</span>}
                    </>
                  )}
                </div>
              </div>

              {i < TOTAL - 1 && <div className="lifecycle-arrow">›</div>}
            </Fragment>
          );
        })}
      </div>
    </GlassCard>
  );
}
