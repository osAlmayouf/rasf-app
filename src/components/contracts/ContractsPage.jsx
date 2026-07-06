import { useState } from 'react';
import { useApp } from '../../contexts/useApp';
import Tag from '../common/Tag';
import { Pencil, ScrollText, Plus, Trash2 } from 'lucide-react';
import { SupabaseDataService } from '../../services/SupabaseDataService';
import { resolveSummary, hasContractSummary } from './contractData';
import { ContractSummaryView, ContractEditForm } from './contractSummary';

const STATUS_LABEL = {
  active: 'قائم', financing: 'قيد التمويل', planning: 'تخطيط',
  completed: 'مكتمل / محوّل للعمليات', archived: 'مؤرشف', pipeline: 'تحت الدراسة',
  external: 'خارج الإدارة',
};
const STATUS_VARIANT = {
  active: 'green', financing: 'amber', planning: 'blue',
  completed: 'purple', archived: 'blue', pipeline: 'blue', external: 'amber',
};

export default function ContractsPage() {
  const { portfolioService, refreshPortfolio, setSelectedProjectId, setPage, setPendingTab } = useApp();
  const [selId, setSelId]           = useState(null);
  const [mode, setMode]             = useState('view');   // view | add | edit
  const [confirmDel, setConfirmDel] = useState(false);

  // كل المشاريع اللي لها ملخص عقد (قائمة + مؤرشفة + دراسة + عقود خارجية)
  const contracted = [
    ...portfolioService.getAllProjects(),
    ...portfolioService.getExternalContracts(),
    ...portfolioService.getArchivedProjects(),
    ...portfolioService.getPipelineProjects(),
  ].filter(hasContractSummary);

  const selected = contracted.find(p => p.id === selId) ?? contracted[0] ?? null;
  const summary  = selected ? resolveSummary(selected) : null;
  const isExternal = selected?.status === 'external';

  const editInProject = () => {
    setSelectedProjectId(selected.id);
    setPendingTab('contracts');
    setPage('project');
  };

  const handleAdd = (draft) => {
    const { name, ...contractSummary } = draft;
    const created = portfolioService.addExternalContract({ name, contractSummary });
    refreshPortfolio();
    setSelId(created.id);
    setMode('view');
  };

  const handleEdit = (draft) => {
    const { name, ...contractSummary } = draft;
    portfolioService.updateProject(selected.id, { name, contractSummary });
    refreshPortfolio();
    setMode('view');
  };

  const handleDelete = () => {
    const id = selected.id;
    portfolioService.removeProject(id);
    SupabaseDataService.deleteProject(id);   // المزامنة upsert فقط — نحذف الصف صراحةً
    refreshPortfolio();
    setSelId(null);
    setConfirmDel(false);
    setMode('view');
  };

  const addBtn = (
    <button onClick={() => setMode('add')} className="text-xs font-bold px-4 py-2 rounded-lg"
      style={{ background: 'var(--rasf-primary)', color: 'var(--bg-app)', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <Plus size={14} /> إضافة عقد خارجي
    </button>
  );

  // ── وضع الإضافة ──────────────────────────────────────────────────────────
  if (mode === 'add') {
    return (
      <div>
        <div className="mb-5"><div className="section-hd">إضافة عقد خارجي</div>
          <div className="section-sub">عقد لمشروع خارج القائمة/الدراسة — يُتابع للعقود فقط</div></div>
        <ContractEditForm withName onSave={handleAdd} onCancel={() => setMode('view')} />
      </div>
    );
  }

  if (!contracted.length) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <div><div className="section-hd">العقود</div><div className="section-sub">متابعة ملخصات عقود المشاريع</div></div>
          {addBtn}
        </div>
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-faint)', fontSize: 13 }}>
          لا توجد عقود مسجّلة بعد — عبّئ ملخص العقد من داخل أي مشروع، أو أضِف «عقد خارجي».
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div><div className="section-hd">العقود</div>
          <div className="section-sub">متابعة ملخصات عقود المشاريع — {contracted.length} عقد</div></div>
        {addBtn}
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '280px 1fr', alignItems: 'start' }}>
        {/* List */}
        <div className="glass rounded-2xl p-2" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {contracted.map(p => {
            const isSel = p.id === selected.id;
            const fund  = resolveSummary(p).fundManager;
            return (
              <button
                key={p.id}
                onClick={() => { setSelId(p.id); setMode('view'); setConfirmDel(false); }}
                className="text-right rounded-xl px-3 py-2.5"
                style={{
                  background: isSel ? 'var(--rasf-primary-dim)' : 'transparent',
                  border: isSel ? '1px solid var(--rasf-primary)' : '1px solid transparent',
                  cursor: 'pointer', transition: 'all .15s',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-hi)' }}>{p.name}</span>
                  <Tag variant={STATUS_VARIANT[p.status] ?? 'blue'}>{STATUS_LABEL[p.status] ?? p.status}</Tag>
                </div>
                {fund && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fund}</div>}
              </button>
            );
          })}
        </div>

        {/* Detail */}
        <div style={{ minWidth: 0 }}>
          {mode === 'edit' && isExternal ? (
            <ContractEditForm withName initial={{ name: selected.name, ...summary }} onSave={handleEdit} onCancel={() => setMode('view')} />
          ) : (
            <>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ScrollText size={18} style={{ color: 'var(--rasf-primary)' }} />
                  <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-hi)' }}>{selected.name}</span>
                  <Tag variant={STATUS_VARIANT[selected.status] ?? 'blue'}>{STATUS_LABEL[selected.status] ?? selected.status}</Tag>
                </div>
                <div className="flex items-center gap-2">
                  {isExternal ? (
                    <>
                      <button onClick={() => setMode('edit')} className="text-xs font-bold px-4 py-2 rounded-lg"
                        style={{ background: 'var(--rasf-primary-dim)', border: '1px solid var(--rasf-primary)', color: 'var(--rasf-primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Pencil size={13} /> تعديل
                      </button>
                      {confirmDel ? (
                        <div className="flex items-center gap-1.5">
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>تأكيد؟</span>
                          <button onClick={handleDelete} style={{ fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 7, border: '1px solid #ef4444', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer' }}>حذف</button>
                          <button onClick={() => setConfirmDel(false)} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-card-strong)', color: 'var(--text-muted)', cursor: 'pointer' }}>إلغاء</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDel(true)} title="حذف" className="text-xs font-bold px-3 py-2 rounded-lg"
                          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </>
                  ) : (
                    selected.status !== 'pipeline' && (
                      <button onClick={editInProject} className="text-xs font-bold px-4 py-2 rounded-lg"
                        style={{ background: 'var(--rasf-primary-dim)', border: '1px solid var(--rasf-primary)', color: 'var(--rasf-primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Pencil size={13} /> تحرير في المشروع
                      </button>
                    )
                  )}
                </div>
              </div>

              {summary && <ContractSummaryView summary={summary} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
