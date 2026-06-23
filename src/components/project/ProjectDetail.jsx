import { useState, useEffect } from 'react';
import { useApp } from '../../contexts/useApp';
import { fmtPct, fmtMonthYear } from '../../utils/fmt';
import { stripUnit } from '../../utils/fmtMode';
import Tag            from '../common/Tag';
import { X, ArrowUp, Archive } from 'lucide-react';
import SARNum         from '../common/SARNum';
import PipelinePage   from '../pipeline/PipelinePage';
import ProjectBoard   from './tabs/ProjectBoard';
import FinancialAnalysis from './tabs/FinancialAnalysis';
import ProjectComponents from './tabs/ProjectComponents';
import FundingStructure  from './tabs/FundingStructure';
import CashFlows         from './tabs/CashFlows';
import ProjectFiles      from './tabs/ProjectFiles';
import Distributions     from './tabs/Distributions';
import Revenue           from './tabs/Revenue';
import ProjectLifecycle  from './ProjectLifecycle';

const TABS = [
  { id: 'board',  labelKey: 'tbBoard',  Component: ProjectBoard       },
  { id: 'fin',    labelKey: 'tbFin',    Component: FinancialAnalysis  },
  { id: 'fund',   labelKey: 'tbFund',   Component: FundingStructure   },
  { id: 'dist',   labelKey: 'tbDist',   Component: Distributions      },
  { id: 'revenue', labelKey: 'tbRevenue', Component: Revenue            },
  { id: 'comp',   labelKey: 'tbComp',   Component: ProjectComponents  },
  { id: 'cash',   labelKey: 'tbCash',   Component: CashFlows          },
  { id: 'files',  labelKey: 'tbFiles2', Component: ProjectFiles       },
];

const STATUS_VARIANT   = { pipeline: 'blue', financing: 'amber', active: 'green', planning: 'blue', completed: 'purple' };
const STATUS_LABEL_MAP = { pipeline: 'statusPipeline', financing: 'statusFin', active: 'statusActive', planning: 'statusPlan', completed: 'statusComp' };
const TYPE_LABEL_MAP   = { residential: 'typeRes', commercial: 'typeCom', industrial: 'typeInd', infrastructure: 'typeInfra', luxury_residential: 'typeCom', mixed: 'typeCom', hotel: 'typeCom' };

export default function ProjectDetail() {
  const { t, portfolioService, selectedProjectId, setSelectedProjectId, setPage, refreshPortfolio, pendingTab, setPendingTab, displayMode, outerProjectTab, setOuterProjectTab } = useApp();
  const [activeTab, setActiveTab]             = useState('board');
  const outerTab    = outerProjectTab;
  const setOuterTab = setOuterProjectTab;

  useEffect(() => {
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  }, [pendingTab, setPendingTab]);
  const [confirmDeleteId, setConfirmDeleteId]   = useState(null);
  const [confirmAction, setConfirmAction]       = useState(null); // 'promote' | 'archive'
  const [editing, setEditing]                   = useState(false);
  const [editName, setEditName]               = useState('');
  const [editLocation, setEditLocation]       = useState('');
  const [editType, setEditType]               = useState('');
  const allProjects = portfolioService.getAllProjects();
  const project = portfolioService.getProject(selectedProjectId ?? allProjects[0]?.id);

  // Selector shows only projects in the same status group as the current project
  const isPipeline    = project?.status === 'pipeline';
  const selectorLabel = isPipeline ? 'مشاريع تحت الدراسة' : 'المشاريع القائمة';
  const selectorProjects = isPipeline
    ? portfolioService.getPipelineProjects()
    : allProjects.filter(p => p.status !== 'pipeline' && p.status !== 'archived');

  const TYPE_OPTIONS = [
    { value: 'residential',    label: 'سكني' },
    { value: 'commercial',     label: 'تجاري / متعدد الاستخدام' },
    { value: 'industrial',     label: 'صناعي' },
    { value: 'infrastructure', label: 'بنية تحتية' },
  ];

  const startEdit = () => {
    setEditName(project.name);
    setEditLocation(project.location ?? '');
    setEditType(project.type ?? 'residential');
    setEditing(true);
  };

  const saveEdit = () => {
    if (editName.trim()) {
      const updates = { name: editName.trim(), location: editLocation.trim(), type: editType };

      // إذا تغيّر النوع، أعد حساب نسبة الإنجاز بأوزان النوع الجديد
      if (editType !== project.type && project.phases?.length) {
        const weights = {
          residential:        { ph1: 5, ph2: 10, ph3: 20, ph4: 55, ph5: 10 },
          commercial:         { ph1: 5, ph2: 12, ph3: 18, ph4: 55, ph5: 10 },
          industrial:         { ph1: 8, ph2: 15, ph3: 25, ph4: 42, ph5: 10 },
          infrastructure:     { ph1: 10, ph2: 20, ph3: 35, ph4: 25, ph5: 10 },
        };
        const w = weights[editType] ?? weights.commercial;
        const pcts = Object.fromEntries(project.phases.map(p => [p.key, p.progress]));
        const newProgress = parseFloat(
          ['ph1','ph2','ph3','ph4','ph5']
            .reduce((sum, k) => sum + ((pcts[k] ?? 0) * (w[k] ?? 0)) / 100, 0)
            .toFixed(1)
        );
        updates.progress = newProgress;
      }

      portfolioService.updateProject(project.id, updates);
      refreshPortfolio();
    }
    setEditing(false);
  };

  const cancelEdit = () => setEditing(false);

  const handlePipelineAction = (action) => {
    if (action === 'promote') {
      portfolioService.promoteProject(project.id);
    } else if (action === 'archive') {
      portfolioService.archiveProject(project.id);
      const remaining = portfolioService.getAllProjects();
      if (remaining.length > 0) setSelectedProjectId(remaining[0].id);
      else setPage('pipeline');
    }
    refreshPortfolio();
    setConfirmAction(null);
  };

  const ActiveComponent = TABS.find(tb => tb.id === activeTab)?.Component;

  const handleDelete = (id) => {
    portfolioService.removeProject(id);
    refreshPortfolio();
    setConfirmDeleteId(null);
    if (selectedProjectId === id) {
      const remaining = portfolioService.getAllProjects();
      if (remaining.length > 0) setSelectedProjectId(remaining[0].id);
      else setPage('dashboard');
    }
  };

  const OUTER_TABS = [
    { key: 'active',   label: t('nDashPortfolio') },
    { key: 'pipeline', label: t('nPipelineDash')  },
  ];

  return (
    <div>
      {/* Outer tab switcher */}
      <div
        style={{
          display: 'inline-flex', gap: 2,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 10, padding: 4, marginBottom: 20,
        }}
      >
        {OUTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setOuterTab(tab.key)}
            style={{
              padding: '6px 20px', borderRadius: 7, fontSize: 13, fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all .18s',
              background: outerTab === tab.key ? 'var(--rasf-primary)' : 'transparent',
              color: outerTab === tab.key ? 'var(--bg-app)' : 'var(--text-muted)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Pipeline tab */}
      {outerTab === 'pipeline' && <PipelinePage />}

      {/* Active projects tab */}
      {outerTab === 'active' && <>

      {/* Pipeline action confirm modal */}
      {confirmAction && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setConfirmAction(null)}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 28, minWidth: 320, maxWidth: 400,
          }} onClick={e => e.stopPropagation()}>
            <div className="text-base font-bold mb-2" style={{ color: 'var(--text-hi)' }}>
              {confirmAction === 'promote' ? t('plPromoteConfirm') : t('plArchiveConfirm')}
            </div>
            <div className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
              {confirmAction === 'promote' ? t('plPromoteNote') : t('plArchiveNote')}
            </div>
            <div className="flex gap-3">
              <button onClick={() => handlePipelineAction(confirmAction)} style={{
                flex: 1, padding: '9px 0', borderRadius: 9, fontWeight: 700, fontSize: 13,
                background: confirmAction === 'promote' ? 'var(--rasf-primary)' : '#6B5545',
                color: '#fff', border: 'none', cursor: 'pointer',
              }}>
                {confirmAction === 'promote' ? t('plPromote') : t('plArchive')}
              </button>
              <button onClick={() => setConfirmAction(null)} style={{
                flex: 1, padding: '9px 0', borderRadius: 9, fontWeight: 600, fontSize: 13,
                background: 'var(--bg-app)', border: '1px solid var(--border)',
                color: 'var(--text-muted)', cursor: 'pointer',
              }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Selector */}
      <div className="glass rounded-2xl p-4 mb-6">
        <div className="text-xs mb-3 font-medium" style={{ color: 'var(--text-muted)' }}>{selectorLabel}</div>
        <div className="flex gap-3 flex-wrap">
          {selectorProjects.map(p => {
            const isConfirming = confirmDeleteId === p.id;
            const isSelected   = selectedProjectId === p.id;

            if (isConfirming) {
              return (
                <div
                  key={p.id}
                  className="glass rounded-xl px-4 py-3"
                  style={{ border: '1px solid #ef4444', minWidth: 180, background: 'var(--bg-card)' }}
                >
                  <div className="text-sm font-bold mb-1" style={{ color: 'var(--text-hi)' }}>{p.name}</div>
                  <div className="text-xs mb-3" style={{ color: '#ef4444' }}>تأكيد الحذف؟</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="flex-1 text-xs font-bold py-1.5 rounded-lg"
                      style={{ background: '#ef4444', color: '#fff' }}
                    >
                      حذف
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="flex-1 text-xs py-1.5 rounded-lg glass"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={p.id}
                className="glass rounded-xl px-4 py-3 relative"
                style={{
                  border: isSelected ? '1px solid var(--rasf-primary)' : '1px solid var(--border)',
                  minWidth: 180,
                }}
              >
                {/* Delete trigger — top corner */}
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(p.id); }}
                  title="حذف المشروع"
                  style={{
                    position: 'absolute', top: 8, left: 8,
                    color: 'var(--text-muted)', fontSize: 13, lineHeight: 1,
                    padding: '2px 5px', borderRadius: 6,
                    background: 'transparent',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <X size={14} />
                </button>

                {/* Card body — clickable to select */}
                <button
                  onClick={() => { setSelectedProjectId(p.id); setActiveTab('board'); }}
                  className="w-full text-right"
                  style={{ background: 'transparent' }}
                >
                  <div className="text-sm font-bold" style={{ color: 'var(--text-hi)' }}>{p.name}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{p.location}</div>
                  <div className="flex gap-3 mt-2 text-xs">
                    <span style={{ color: p.roeAnnual < 14.5 ? '#ea580c' : '#10b981' }}>ROE {fmtPct(p.roeAnnual)}</span>
                    <span style={{ color: '#a78bfa' }}>IRR {fmtPct(p.irr)}</span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {!project && (
        <div className="glass rounded-2xl p-10 text-center" style={{ color: 'var(--text-muted)' }}>
          {t('nProj')}
        </div>
      )}

      {project && <>
      {/* Header */}
      <div className="glass rounded-2xl p-4 mb-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <div className="flex gap-2 mb-3 flex-wrap items-center">
              <Tag variant={STATUS_VARIANT[project.status] ?? 'blue'}>
                {t(STATUS_LABEL_MAP[project.status] ?? 'statusPlan')}
              </Tag>
              <Tag variant="purple">
                {t(TYPE_LABEL_MAP[project.type] ?? 'typeMix')}
              </Tag>

              {/* Pipeline-only actions */}
              {project.status === 'pipeline' && (
                <>
                  <button
                    onClick={() => setConfirmAction('promote')}
                    style={{
                      background: 'var(--rasf-primary)', color: 'var(--bg-app)',
                      border: 'none', borderRadius: 7, padding: '4px 14px',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      transition: 'opacity .15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <ArrowUp size={11} style={{ display: 'inline', marginInlineEnd: 4 }} />
                    {t('plPromote')}
                  </button>
                  <button
                    onClick={() => setConfirmAction('archive')}
                    style={{
                      background: 'var(--bg-app)', color: 'var(--text-muted)',
                      border: '1px solid var(--border)', borderRadius: 7,
                      padding: '4px 12px', fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', transition: 'all .15s',
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--rasf-accent)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <Archive size={12} />
                    {t('plArchive')}
                  </button>
                </>
              )}
            </div>

            {editing ? (
              <div className="flex flex-col gap-2">
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="اسم المشروع"
                  className="text-xl font-bold text-white rounded-lg px-3 py-1.5"
                  style={{ background: 'var(--bg-card-strong)', border: '1px solid var(--rasf-primary)', outline: 'none', minWidth: 220, color: 'var(--text-hi)' }}
                  autoFocus
                />
                <input
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  placeholder="الموقع"
                  className="text-sm rounded-lg px-3 py-1"
                  style={{ background: 'var(--bg-card-strong)', border: '1px solid var(--border-soft)', outline: 'none', color: 'var(--text-lo)', minWidth: 180 }}
                />
                <div className="flex gap-2 flex-wrap mt-1">
                  {TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEditType(opt.value)}
                      className="text-xs px-3 py-1.5 rounded-lg"
                      style={{
                        border: editType === opt.value ? '1px solid var(--rasf-primary)' : '1px solid var(--border-soft)',
                        background: editType === opt.value ? 'var(--rasf-primary-dim)' : 'var(--bg-subtle)',
                        color: editType === opt.value ? 'var(--rasf-primary)' : 'var(--text-muted)',
                        fontWeight: editType === opt.value ? 700 : 400,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={saveEdit}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg"
                    style={{ background: 'var(--rasf-primary)', color: 'var(--bg-app)' }}
                  >
                    حفظ
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-xs px-3 py-1.5 rounded-lg glass"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <div>
                  <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-hi)' }}>{project.name}</h1>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{project.subtitle}</div>
                  {project.lastUpdated && (
                    <div className="flex items-center gap-1 mt-2" style={{ fontSize: 11, color: '#7A6E67' }}>
                      <span>آخر تحديث:</span>
                      <span style={{
                        background: 'var(--rasf-primary-dim)',
                        border: '1px solid var(--border-tag-warm)',
                        borderRadius: 5, padding: '1px 8px',
                        color: 'var(--rasf-primary)', fontWeight: 600,
                      }}>
                        {fmtMonthYear(project.lastUpdated)}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={startEdit}
                  title="تعديل الاسم والموقع"
                  style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: 14, padding: '2px 6px', borderRadius: 6, background: 'transparent', flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--rasf-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  ✎
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xl font-bold gold">
                <SARNum millions={project.investmentM} symbolSize="0.75em" />
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{stripUnit(t('prK1'), displayMode)}</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-400">
                <SARNum millions={project.costs?.totalRevenue} symbolSize="0.75em" />
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{stripUnit(t('prK5'), displayMode)}</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-400">{fmtPct(project.irr)}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('prK2')}</div>
            </div>
            <div>
              <div className="text-xl font-bold" style={{ color: 'var(--text-hi)' }}>{project.deliveryDate}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('prK3')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lifecycle */}
      <ProjectLifecycle projectId={project.id} status={project.status} />

      {/* Tabs */}
      <div className="flex overflow-x-auto mb-6" style={{ borderBottom: '1px solid var(--border)' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      {ActiveComponent && <ActiveComponent project={project} />}
      </>}
      </>}
    </div>
  );
}

