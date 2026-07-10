import { useState, useEffect } from 'react';
import { useApp } from '../../../contexts/useApp';
import { useAuth } from '../../../contexts/useAuth';
import { ActivityService } from '../../../services/ActivityService';
import GlassCard from '../../common/GlassCard';
import ProjectNotes from './ProjectNotes';
import { Ruler, BarChart2, Building2, SquareParking, Home, Check } from 'lucide-react';
import { PHASE_KEYS, PHASE_WEIGHTS, PHASE_STATUS, phaseStatusOf, progressFromPhases } from '../../../utils/phaseProgress';

const STUDY_PHASE_KEYS = ['sp1', 'sp2', 'sp3', 'sp4'];
const DEFAULT_STUDY_PHASES = STUDY_PHASE_KEYS.map(key => ({ key, status: PHASE_STATUS.PENDING }));

// خيارات بوابة الحالة لكل بند
const GATE_OPTIONS = [
  { value: PHASE_STATUS.PENDING, labelKey: 'gatePending' },
  { value: PHASE_STATUS.ACTIVE,  labelKey: 'gateActive'  },
  { value: PHASE_STATUS.DONE,    labelKey: 'gateDone'    },
];

const STATE_STYLES = {
  done:    { dot: '#10b981', dotBg: 'rgba(16,185,129,0.12)',  dotBorder: 'rgba(16,185,129,0.3)',  label: 'var(--text-muted)', badge: 'rgba(16,185,129,0.1)',  badgeText: '#10b981' },
  active:  { dot: 'var(--rasf-primary)', dotBg: 'var(--rasf-primary-dim)', dotBorder: 'var(--rasf-primary)', label: 'var(--text-med)', badge: 'var(--rasf-primary-dim)', badgeText: 'var(--rasf-primary)' },
  pending: { dot: 'var(--pending-dot)', dotBg: 'var(--pending-dotbg)', dotBorder: 'var(--pending-dotbrd)', label: 'var(--text-muted)', badge: 'var(--pending-badge)', badgeText: 'var(--text-muted)' },
};

function resolveStudyPhases(project) {
  const hasStudyKeys = project.phases.length > 0 && STUDY_PHASE_KEYS.includes(project.phases[0]?.key);
  return hasStudyKeys ? project.phases : DEFAULT_STUDY_PHASES;
}

// أزرار بوابة الحالة (لم يبدأ / جارٍ / منجز)
function GateButtons({ status, onChange, t }) {
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      {GATE_OPTIONS.map(opt => {
        const on  = status === opt.value;
        const oss = STATE_STYLES[opt.value];
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6,
              cursor: 'pointer', transition: 'all .15s',
              border: `1px solid ${on ? oss.dotBorder : 'var(--border)'}`,
              background: on ? oss.badge : 'transparent',
              color: on ? oss.badgeText : 'var(--text-muted)',
            }}
          >
            {t(opt.labelKey)}
          </button>
        );
      })}
    </div>
  );
}

// صف بند واحد على الخط الزمني مع بوابات الحالة
function PhaseRow({ index, isLast, labelKey, weight, status, onChange, t }) {
  const s = STATE_STYLES[status];
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center" style={{ width: 32, flexShrink: 0 }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: s.dotBg, border: `1.5px solid ${s.dotBorder}`, color: s.dot }}>
          {status === 'done' ? <Check size={14} /> : `0${index + 1}`}
        </div>
        {!isLast && (
          <div style={{ width: 1, flex: 1, minHeight: 12, background: status === 'done' ? 'rgba(16,185,129,0.2)' : 'var(--glass-line)', margin: '3px 0' }} />
        )}
      </div>
      <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-4'}`}>
        <div className="flex justify-between items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold" style={{ color: s.label }}>
            {t(labelKey)}
            {weight != null && (
              <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: 11, marginInlineStart: 6 }}>
                {weight}%
              </span>
            )}
          </span>
          <GateButtons status={status} onChange={onChange} t={t} />
        </div>
      </div>
    </div>
  );
}

export default function ProjectBoard({ project }) {
  const { t, lang, portfolioService, refreshPortfolio } = useApp();
  const { profile } = useAuth();

  const isAr       = lang === 'ar';
  const isPipeline = project.status === 'pipeline';

  // ── Active project phases (بوابات: منجز/جارٍ/لم يبدأ) ───────────────────
  const [phaseStatuses, setPhaseStatuses] = useState(
    () => Object.fromEntries(project.phases.map(p => [p.key, phaseStatusOf(p)]))
  );
  const [dirty, setDirty] = useState(false);

  // ── Pipeline study phases (بوابات: منجز/جارٍ/لم يبدأ) ───────────────────
  const [studyStatuses, setStudyStatuses] = useState(
    () => Object.fromEntries(resolveStudyPhases(project).map(p => [p.key, phaseStatusOf(p)]))
  );
  const [studyDirty, setStudyDirty] = useState(false);

  useEffect(() => {
    if (isPipeline) {
      setStudyStatuses(Object.fromEntries(resolveStudyPhases(project).map(p => [p.key, phaseStatusOf(p)])));
      setStudyDirty(false);
    } else {
      setPhaseStatuses(Object.fromEntries(project.phases.map(p => [p.key, phaseStatusOf(p)])));
      setDirty(false);
    }
  }, [project.id]); // eslint-disable-line

  // وصف حالة البوابة بالعربي (منجز / جارٍ / لم يبدأ)
  const gateLabel = (s) =>
    t(s === PHASE_STATUS.DONE ? 'gateDone' : s === PHASE_STATUS.ACTIVE ? 'gateActive' : 'gatePending');

  const handleStatusChange = (key, status) => {
    setPhaseStatuses(prev => ({ ...prev, [key]: status }));
    setDirty(true);
  };

  const handleSave = () => {
    const updatedPhases = project.phases.map(p => ({ ...p, status: phaseStatuses[p.key] ?? phaseStatusOf(p) }));
    const newProgress   = progressFromPhases(updatedPhases);
    // نلتقط البنود المتغيّرة فقط: "التصميم: جارٍ ← منجز"
    const changes = project.phases
      .map((p, i) => {
        const from = phaseStatusOf(p);
        const to   = phaseStatuses[p.key] ?? from;
        return from === to ? null : `${t(PHASE_KEYS[i])}: ${gateLabel(from)} ← ${gateLabel(to)}`;
      })
      .filter(Boolean);
    portfolioService.updateProject(project.id, { phases: updatedPhases, progress: newProgress });
    if (changes.length) {
      ActivityService.log(profile, 'تحديث مراحل المشروع', {
        entityType: 'status', entityName: project.name, projectId: project.id,
        details: `${changes.join(' · ')} (الإنجاز ${newProgress}%)`,
      });
    }
    refreshPortfolio();
    setDirty(false);
  };

  const handleStudyStatusChange = (key, status) => {
    setStudyStatuses(prev => ({ ...prev, [key]: status }));
    setStudyDirty(true);
  };

  const handleStudySave = () => {
    const prevStudy = Object.fromEntries(resolveStudyPhases(project).map(p => [p.key, phaseStatusOf(p)]));
    const updatedPhases = STUDY_PHASE_KEYS.map(key => ({ key, status: studyStatuses[key] ?? PHASE_STATUS.PENDING }));
    const changes = STUDY_PHASE_KEYS
      .map(key => {
        const from = prevStudy[key] ?? PHASE_STATUS.PENDING;
        const to   = studyStatuses[key] ?? PHASE_STATUS.PENDING;
        return from === to ? null : `${t(key)}: ${gateLabel(from)} ← ${gateLabel(to)}`;
      })
      .filter(Boolean);
    portfolioService.updateProject(project.id, { phases: updatedPhases });
    if (changes.length) {
      ActivityService.log(profile, 'تحديث مراحل الدراسة', {
        entityType: 'status', entityName: project.name, projectId: project.id,
        details: changes.join(' · '),
      });
    }
    refreshPortfolio();
    setStudyDirty(false);
  };

  const hasBasement = project.belowGradeGBA && project.belowGradeGBA !== '—';

  const kpis = [
    { labelKey: 'pk1', value: project.area,          icon: <Ruler size={16} /> },
    { labelKey: 'pk3', value: project.farValue,      icon: <BarChart2 size={16} />, suffix: 'x' },
    { labelKey: 'pk4', value: project.aboveGradeGBA, icon: <Building2 size={16} /> },
    ...(hasBasement ? [{ labelKey: 'pk5', value: project.belowGradeGBA, icon: <SquareParking size={16} /> }] : []),
    { labelKey: 'pk2', value: project.units, icon: <Home size={16} />, suffix: isAr ? ' وحدة' : ' units' },
  ];

  const saveBtn = (onClick) => (
    <button
      onClick={onClick}
      className="text-xs font-bold px-4 py-1.5 rounded-lg"
      style={{ background: 'var(--rasf-primary-dim)', border: '1px solid var(--rasf-primary)', color: 'var(--rasf-primary)' }}
    >
      {isAr ? 'حفظ التغييرات' : 'Save Changes'}
    </button>
  );

  return (
    <div>
      {/* KPI cards */}
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

      {/* Phases + Notes — same layout for both pipeline and active */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '3fr 1.4fr' }}>
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="section-hd mb-0.5">
              {isPipeline
                ? (isAr ? 'مراحل الدراسة والتقييم' : 'Study & Evaluation Phases')
                : t('bdTlT')}
            </div>
            {isPipeline ? (studyDirty && saveBtn(handleStudySave)) : (dirty && saveBtn(handleSave))}
          </div>

          <div className="space-y-0">
            {isPipeline ? (
              STUDY_PHASE_KEYS.map((key, i) => (
                <PhaseRow
                  key={key}
                  index={i}
                  isLast={i === STUDY_PHASE_KEYS.length - 1}
                  labelKey={key}
                  status={studyStatuses[key] ?? PHASE_STATUS.PENDING}
                  onChange={(st) => handleStudyStatusChange(key, st)}
                  t={t}
                />
              ))
            ) : (
              project.phases.map((phase, i) => (
                <PhaseRow
                  key={phase.key}
                  index={i}
                  isLast={i === project.phases.length - 1}
                  labelKey={PHASE_KEYS[i]}
                  weight={PHASE_WEIGHTS[phase.key] ?? 0}
                  status={phaseStatuses[phase.key] ?? phaseStatusOf(phase)}
                  onChange={(st) => handleStatusChange(phase.key, st)}
                  t={t}
                />
              ))
            )}
          </div>
        </GlassCard>

        <ProjectNotes project={project} />
      </div>
    </div>
  );
}

