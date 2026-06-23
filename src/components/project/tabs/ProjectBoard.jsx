import { useState, useEffect } from 'react';
import { useApp } from '../../../contexts/useApp';
import GlassCard from '../../common/GlassCard';
import ProjectNotes from './ProjectNotes';
import { Ruler, BarChart2, Building2, SquareParking, Home, Check } from 'lucide-react';

const PHASE_KEYS = ['ph1', 'ph2', 'ph3', 'ph4', 'ph5'];

// أوزان البنود لكل نوع مشروع (ph1…ph5)
const TYPE_WEIGHTS = {
  residential:        { ph1: 5, ph2: 10, ph3: 20, ph4: 55, ph5: 10 },
  commercial:         { ph1: 5, ph2: 12, ph3: 18, ph4: 55, ph5: 10 },
  industrial:         { ph1: 8, ph2: 15, ph3: 25, ph4: 42, ph5: 10 },
  infrastructure:     { ph1: 10, ph2: 20, ph3: 35, ph4: 25, ph5: 10 },
  // قيم قديمة — تُعامَل كتجاري
  luxury_residential: { ph1: 5, ph2: 10, ph3: 20, ph4: 55, ph5: 10 },
  mixed:              { ph1: 5, ph2: 12, ph3: 18, ph4: 55, ph5: 10 },
  hotel:              { ph1: 5, ph2: 12, ph3: 18, ph4: 55, ph5: 10 },
};

// يحسب نسبة الإنجاز الإجمالية من نسب المراحل وأوزان نوع المشروع
function calcWeightedProgress(type, pcts) {
  const w = TYPE_WEIGHTS[type] ?? TYPE_WEIGHTS.commercial;
  const total = PHASE_KEYS.reduce((sum, k) => sum + ((pcts[k] ?? 0) * w[k]) / 100, 0);
  return parseFloat(total.toFixed(1));
}

function phaseState(pct) {
  if (pct === 100) return 'done';
  if (pct > 0)     return 'active';
  return 'pending';
}

const STATE_STYLES = {
  done:    { dot: '#10b981', dotBg: 'rgba(16,185,129,0.12)',  dotBorder: 'rgba(16,185,129,0.3)',  label: 'var(--text-muted)', badge: 'rgba(16,185,129,0.1)',  badgeText: '#10b981' },
  active:  { dot: 'var(--rasf-primary)', dotBg: 'var(--rasf-primary-dim)', dotBorder: 'var(--rasf-primary)', label: 'var(--text-med)', badge: 'var(--rasf-primary-dim)', badgeText: 'var(--rasf-primary)' },
  pending: { dot: 'var(--pending-dot)', dotBg: 'var(--pending-dotbg)', dotBorder: 'var(--pending-dotbrd)', label: 'var(--text-muted)', badge: 'var(--pending-badge)', badgeText: 'var(--text-muted)' },
};

export default function ProjectBoard({ project }) {
  const { t, lang, portfolioService, refreshPortfolio } = useApp();

  const isAr = lang === 'ar';
  const statusLabel = { done: isAr ? 'مكتمل' : 'Done', pending: isAr ? 'لم يبدأ' : 'Not started' };

  const [phasePcts, setPhasePcts] = useState(
    () => Object.fromEntries(project.phases.map(p => [p.key, p.progress]))
  );
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setPhasePcts(Object.fromEntries(project.phases.map(p => [p.key, p.progress])));
    setDirty(false);
  }, [project.id]);

  const handlePctChange = (key, raw) => {
    const val = Math.min(100, Math.max(0, Number(raw) || 0));
    setPhasePcts(prev => ({ ...prev, [key]: val }));
    setDirty(true);
  };

  const handleSave = () => {
    // تحديث نسب المراحل في بيانات المشروع
    const updatedPhases = project.phases.map(p => ({
      ...p,
      progress: phasePcts[p.key] ?? p.progress,
    }));
    // إعادة حساب نسبة الإنجاز الإجمالية بالأوزان المناسبة لنوع المشروع
    const newProgress = calcWeightedProgress(project.type, phasePcts);
    portfolioService.updateProject(project.id, {
      phases:   updatedPhases,
      progress: newProgress,
    });
    refreshPortfolio();
    setDirty(false);
  };

  const hasBasement = project.belowGradeGBA && project.belowGradeGBA !== '—';

  const kpis = [
    { labelKey: 'pk1', value: project.area,          icon: <Ruler size={16} /> },
    { labelKey: 'pk3', value: project.farValue,      icon: <BarChart2 size={16} />, suffix: 'x' },
    { labelKey: 'pk4', value: project.aboveGradeGBA, icon: <Building2 size={16} /> },
    ...(hasBasement ? [{ labelKey: 'pk5', value: project.belowGradeGBA, icon: <SquareParking size={16} /> }] : []),
    { labelKey: 'pk2', value: project.units,          icon: <Home size={16} />, suffix: isAr ? ' وحدة' : ' units' },
  ];

  return (
    <div>
      {/* 5 KPI cards */}
      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: `repeat(${kpis.length}, 1fr)` }}>
        {kpis.map(k => (
          <div key={k.labelKey} className="kpi flex flex-col gap-1">
            <div style={{ color: 'var(--rasf-primary)', display: 'flex' }}>{k.icon}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{t(k.labelKey)}</div>
            <div className="text-base font-bold mt-auto leading-tight" style={{ color: 'var(--text-hi)' }}>
              {k.value != null && k.value !== '—' && k.value !== 0
                ? `${k.value}${k.suffix ?? ''}`
                : '—'}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '3fr 1.4fr' }}>
        {/* Timeline */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="section-hd mb-0.5">{t('bdTlT')}</div>
              {t('bdTlS') && <div className="section-sub">{t('bdTlS')}</div>}
            </div>
            {dirty && (
              <button
                onClick={handleSave}
                className="text-xs font-bold px-4 py-1.5 rounded-lg"
                style={{ background: 'var(--rasf-primary-dim)', border: '1px solid var(--rasf-primary)', color: 'var(--rasf-primary)' }}
              >
                {isAr ? 'حفظ التغييرات' : 'Save Changes'}
              </button>
            )}
          </div>

          <div className="space-y-0">
            {project.phases.map((phase, i) => {
              const pct    = phasePcts[phase.key] ?? phase.progress;
              const state  = phaseState(pct);
              const s      = STATE_STYLES[state];
              const isLast = i === project.phases.length - 1;

              return (
                <div key={phase.key} className="flex gap-4">
                  {/* dot + connector */}
                  <div className="flex flex-col items-center" style={{ width: 32, flexShrink: 0 }}>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: s.dotBg, border: `1.5px solid ${s.dotBorder}`, color: s.dot }}
                    >
                      {state === 'done' ? <Check size={14} /> : `0${i + 1}`}
                    </div>
                    {!isLast && (
                      <div style={{ width: 1, flex: 1, minHeight: 12, background: state === 'done' ? 'rgba(16,185,129,0.2)' : 'var(--glass-line)', margin: '3px 0' }} />
                    )}
                  </div>

                  {/* content */}
                  <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-4'}`}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-semibold" style={{ color: s.label }}>
                        {t(PHASE_KEYS[i])}
                      </span>

                      {/* Editable percentage — all phases */}
                      <div className="flex items-center gap-1 flex-shrink-0 ms-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={pct}
                          onChange={e => handlePctChange(phase.key, e.target.value)}
                          style={{
                            width: 48,
                            background: 'var(--rasf-primary-dim)',
                            border: `1px solid ${s.dotBorder}`,
                            borderRadius: 6,
                            color: s.badgeText,
                            fontSize: 12,
                            fontWeight: 600,
                            textAlign: 'center',
                            padding: '2px 4px',
                            outline: 'none',
                            fontFamily: 'inherit',
                          }}
                        />
                        <span style={{ color: s.badgeText, fontSize: 12, fontWeight: 600 }}>%</span>
                      </div>
                    </div>

                    {phase.start && phase.end && (
                      <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                        {phase.start} — {phase.end}
                      </div>
                    )}

                    {pct > 0 && (
                      <div style={{ height: 4, background: 'var(--glass-line)', borderRadius: 3, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%', borderRadius: 3,
                            width: `${pct}%`,
                            background: state === 'done'
                              ? 'linear-gradient(90deg,#10b981,#34d399)'
                              : 'linear-gradient(90deg, var(--rasf-primary), var(--text-hi))',
                            transition: 'width .4s ease',
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Notes */}
        <ProjectNotes project={project} />
      </div>
    </div>
  );
}

