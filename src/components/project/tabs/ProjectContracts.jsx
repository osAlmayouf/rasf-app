import { useState, useEffect } from 'react';
import { useApp } from '../../../contexts/useApp';
import { useAuth } from '../../../contexts/useAuth';
import { ActivityService } from '../../../services/ActivityService';
import { Pencil } from 'lucide-react';
import { resolveSummary, summaryHasContent } from '../../contracts/contractData';
import { ContractEditForm, ContractSummaryView } from '../../contracts/contractSummary';

export default function ProjectContracts({ project }) {
  const { portfolioService, refreshPortfolio } = useApp();
  const { profile } = useAuth();
  const [summary, setSummary] = useState(() => resolveSummary(project));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setSummary(resolveSummary(project));
    setEditing(false);
  }, [project.id]); // eslint-disable-line

  const handleSave = (draft) => {
    setSummary(draft);
    portfolioService.updateProject(project.id, { contractSummary: draft });
    ActivityService.log(profile, 'تحديث ملخص العقد', { entityType: 'contract', entityName: project.name, projectId: project.id });
    refreshPortfolio();
    setEditing(false);
  };

  const hasContent = summaryHasContent(summary);

  if (editing) {
    return <ContractEditForm initial={summary} onSave={handleSave} onCancel={() => setEditing(false)} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="flex items-center justify-between">
        <div>
          <div className="section-hd">ملخص العقود</div>
          <div className="section-sub">أهم بنود اتفاقية المشروع</div>
        </div>
        <button onClick={() => setEditing(true)} className="text-xs font-bold px-4 py-2 rounded-lg"
          style={{ background: 'var(--rasf-primary-dim)', border: '1px solid var(--rasf-primary)', color: 'var(--rasf-primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Pencil size={13} /> {hasContent ? 'تعديل' : 'تعبئة الملخص'}
        </button>
      </div>

      {!hasContent && (
        <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-faint)', fontSize: 13 }}>
          لا يوجد ملخص عقد لهذا المشروع بعد — اضغط "تعبئة الملخص".
        </div>
      )}

      {hasContent && <ContractSummaryView summary={summary} />}
    </div>
  );
}
