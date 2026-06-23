import { Fragment } from 'react';
import { useApp } from '../../contexts/useApp';
import { LIFECYCLE_STEPS } from '../../data/seedData';
import GlassCard from '../common/GlassCard';

const phKeys = ['lc1', 'lc2', 'lc3', 'lc4', 'lc5'];

export default function Lifecycle() {
  const { t } = useApp();

  return (
    <GlassCard>
      <div className="section-hd mb-1">{t('dLcT')}</div>
      <div className="section-sub mb-5">{t('dLcS')}</div>

      <div className="flex items-center gap-2">
        {LIFECYCLE_STEPS.map((step, i) => {
          const isActive = step.state === 'active';
          const isDone   = step.state === 'done';
          const cls      = isDone ? 'done' : isActive ? 'active-step' : '';

          return (
            <Fragment key={step.key}>
              <div className={`lifecycle-step ${cls}`}>
                <div className="text-xs mb-1" style={{ color: '#7A6E67' }}>{t(`${phKeys[i]}ph`)}</div>
                <div className={`font-semibold text-sm ${isActive ? 'gold' : ''}`}>{t(`${phKeys[i]}n`)}</div>
                {isDone   && <div className="text-green-400 mt-2 text-xs">✓</div>}
                {isActive && <div className="mt-2 text-xs gold">●</div>}
              </div>
              {i < LIFECYCLE_STEPS.length - 1 && (
                <div className="lifecycle-arrow">›</div>
              )}
            </Fragment>
          );
        })}
      </div>
    </GlassCard>
  );
}

