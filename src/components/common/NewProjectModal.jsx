import { useState } from 'react';
import { useApp } from '../../contexts/useApp';
import { useAuth } from '../../contexts/useAuth';
import { ActivityService } from '../../services/ActivityService';
import { ProjectStatus, ProjectType } from '../../models/Project';
import { X } from 'lucide-react';

const PROJECT_TYPE_OPTIONS = [
  { value: ProjectType.RESIDENTIAL,    label: 'سكني',                    icon: '🏠' },
  { value: ProjectType.COMMERCIAL,     label: 'تجاري / متعدد الاستخدام', icon: '🏢' },
  { value: ProjectType.INDUSTRIAL,     label: 'صناعي',                   icon: '🏭' },
  { value: ProjectType.INFRASTRUCTURE, label: 'بنية تحتية',              icon: '🏗️' },
];

export default function NewProjectModal({ onClose, defaultStatus }) {
  const { portfolioService, refreshPortfolio, setPage, setSelectedProjectId, setPendingTab } = useApp();
  const { profile } = useAuth();
  const [name,        setName]        = useState('');
  const [projectType, setProjectType] = useState(ProjectType.COMMERCIAL);
  const [nameError,   setNameError]   = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setNameError('اسم المشروع مطلوب'); return; }

    const id = `proj-${Date.now()}`;
    const status = defaultStatus === 'pipeline'
      ? ProjectStatus.PIPELINE
      : ProjectStatus.PIPELINE;

    portfolioService.addProject({
      id,
      name:           name.trim(),
      subtitle:       'مشروع جديد',
      location:       '—',
      roi:            0,
      irr:            0,
      roeAnnual:      0,
      progress:       0,
      status,
      type:           projectType,
      totalInvestment: '—',
      investmentM:    0,
      deliveryDate:    '—',
      opportunityDate: new Date().toISOString().split('T')[0],
      startDate:       new Date().toLocaleDateString('ar-SA'),
      area:           '—',
      farValue:       0,
      aboveGradeGBA:  '—',
      belowGradeGBA:  '—',
      totalGBA:       '—',
      nsaArea:        '—',
      units:          0,
      unitsSold:      0,
      avgUnitPrice:   0,
      moic:           '—',
      paybackYears:   0,
      phases: [], milestones: [], cashFlows: [], investors: [],
      componentBreakdown: [],
      costs: {
        totalRevenue: 0, netProfit: 0, landCost: 0,
        constructionCost: 0, finishingCost: 0, financingCost: 0,
        otherCost: 0, developerCost: 0, fundCost: 0, totalCost: 0,
        operationalCost: 0, directSalesRevenue: 0, annualRentalRevenue: 0,
        dailyRentalRevenue: 0, offplanRevenue: 0, exitValue: 0,
      },
      components: {
        residential: { units: 0, breakdown: [0,0,0,0], avgPrice: '—' },
        commercial:  { stores: 0, fb: 0, offices: 0, totalArea: '—', monthlyRent: '—' },
        amenities:   { parking: 0, pools: 0, gym: '—', green: '—', sustainability: '—' },
        hotel:       { units: 0 },
        medical:     { units: 0 },
      },
      funding:  { bank: 0, land: 0, subscription: 0, offplan: 0, bankAmount: 0, equityAmount: 0, annualInterestRate: 0 },
      equity:   { total: 0, breakdown: [] },
      financing: null,
    });

    ActivityService.log(profile, 'إضافة مشروع', { entityType: 'project', entityName: name.trim(), projectId: id });
    refreshPortfolio();
    setSelectedProjectId(id);
    setPendingTab('files');
    setPage('project');
    onClose();
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, width: '100%', maxWidth: 460, padding: 32 }}>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-hi)' }}>مشروع جديد تحت الدراسة</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>ستتمكن من رفع الدراسة المالية بعد الإنشاء</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Project name */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 7 }}>
              اسم المشروع *
            </label>
            <input
              autoFocus
              value={name}
              onChange={e => { setName(e.target.value); setNameError(''); }}
              placeholder="مثال: مشروع الواجهة البحرية"
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10, boxSizing: 'border-box',
                background: 'var(--bg-input)', border: `1px solid ${nameError ? '#ef4444' : 'var(--border)'}`,
                color: 'var(--text-hi)', fontSize: 14, outline: 'none',
              }}
            />
            {nameError && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{nameError}</div>}
          </div>

          {/* Project type */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 7 }}>
              نوع المشروع *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {PROJECT_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setProjectType(opt.value)}
                  style={{
                    padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${projectType === opt.value ? 'var(--rasf-primary)' : 'var(--border)'}`,
                    background: projectType === opt.value ? 'var(--rasf-primary-dim)' : 'var(--bg-app)',
                    color: projectType === opt.value ? 'var(--rasf-primary)' : 'var(--text-muted)',
                    cursor: 'pointer', textAlign: 'right', transition: 'all .15s',
                  }}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hint */}
          <div style={{
            background: 'rgba(164,144,126,0.08)', border: '1px solid rgba(164,144,126,0.2)',
            borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)',
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>📂</span>
            <span>بعد الإنشاء ستنتقل مباشرة لتبويب <strong style={{ color: 'var(--text-hi)' }}>الملفات</strong> حيث يمكنك رفع الدراسة المالية وسيتم استخراج بياناتها تلقائياً</span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" style={{
              flex: 1, padding: '11px 0', borderRadius: 10,
              background: 'var(--rasf-primary)', color: '#fff',
              border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer',
            }}>
              إنشاء المشروع ←
            </button>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '11px 0', borderRadius: 10,
              background: 'var(--bg-app)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}>
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
