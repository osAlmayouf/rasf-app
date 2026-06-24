import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp }       from '../../contexts/useApp';
import { useAuth }      from '../../contexts/useAuth';
import { FileCategory } from '../../models/FileDocument';
import FileViewer       from '../common/FileViewer';
import Tag              from '../common/Tag';
import { FolderOpen, Eye, Download, Upload, X, Trash2 } from 'lucide-react';

const CATEGORY_VARIANT = { fin: 'amber', rep: 'blue', con: 'green', drw: 'red' };
const CATEGORY_LABEL   = { fin: 'fcFin', rep: 'fcRep', con: 'fcCon', drw: 'fcDrw' };

const FILTER_BUTTONS = [
  { cat: 'all',                  labelKey: 'fcAll' },
  { cat: FileCategory.FINANCIAL, labelKey: 'fcFin' },
  { cat: FileCategory.REPORTS,   labelKey: 'fcRep' },
  { cat: FileCategory.CONTRACTS, labelKey: 'fcCon' },
  { cat: FileCategory.DRAWINGS,  labelKey: 'fcDrw' },
];

const CATEGORIES = [
  { value: FileCategory.FINANCIAL, labelKey: 'fcFin' },
  { value: FileCategory.REPORTS,   labelKey: 'fcRep' },
  { value: FileCategory.CONTRACTS, labelKey: 'fcCon' },
  { value: FileCategory.DRAWINGS,  labelKey: 'fcDrw' },
];

function UploadModal({ file, projects, onConfirm, onCancel, t }) {
  const [projectId, setProjectId] = useState('');
  const [category,  setCategory]  = useState(FileCategory.REPORTS);
  const [uploading, setUploading] = useState(false);

  const selectedProject = projects.find(p => p.id === projectId);

  const handleConfirm = async () => {
    if (!projectId) return;
    setUploading(true);
    await onConfirm({ projectId, projectName: selectedProject?.name ?? '', category });
    setUploading(false);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 460, padding: 28 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-hi)' }}>رفع ملف</div>
          <button onClick={onCancel} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* File name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-card-strong)', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
          <span style={{ fontSize: 20 }}>📄</span>
          <span style={{ fontSize: 13, color: 'var(--text-hi)', fontWeight: 500, wordBreak: 'break-all' }}>{file.name}</span>
          <span style={{ fontSize: 11, color: 'var(--text-faint)', marginRight: 'auto', flexShrink: 0 }}>
            {(file.size / 1024 / 1024).toFixed(1)} MB
          </span>
        </div>

        {/* Project selector */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>المشروع *</label>
          <select
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13,
              background: 'var(--bg-card-strong)', border: '1px solid var(--border)',
              color: projectId ? 'var(--text-hi)' : 'var(--text-faint)',
              cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="">— اختر المشروع —</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Category selector */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>التصنيف</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: category === c.value ? 'var(--rasf-primary)' : 'var(--bg-card-strong)',
                  border: `1px solid ${category === c.value ? 'var(--rasf-primary)' : 'var(--border)'}`,
                  color: category === c.value ? 'var(--bg-app)' : 'var(--text-muted)',
                }}
              >
                {t(c.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{ padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: 'var(--bg-card-strong)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            إلغاء
          </button>
          <button
            onClick={handleConfirm}
            disabled={!projectId || uploading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: projectId && !uploading ? 'pointer' : 'not-allowed',
              background: projectId && !uploading ? 'var(--rasf-primary)' : 'var(--bg-card-strong)',
              border: '1px solid var(--rasf-primary)',
              color: projectId && !uploading ? 'var(--bg-app)' : 'var(--text-faint)',
              opacity: uploading ? 0.7 : 1,
            }}
          >
            <Upload size={13} />
            {uploading ? 'جاري الرفع…' : 'رفع'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FileRepository() {
  const { t, fileService, portfolioService } = useApp();
  const { profile, isDepAdmin }              = useAuth();
  const [activeCat,       setActiveCat]       = useState('all');
  const [files,           setFiles]           = useState([]);
  const [viewerFile,      setViewerFile]      = useState(null);
  const [pendingFile,     setPendingFile]     = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const inputRef = useRef(null);

  const projects = [
    ...(portfolioService?.getAllProjects()       ?? []),
    ...(portfolioService?.getPipelineProjects()  ?? []),
  ];

  const fetchFiles = useCallback(async () => {
    const data = await fileService.getByCategory(activeCat);
    setFiles(data);
  }, [fileService, activeCat]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setPendingFile(file);
  };

  const handleConfirmUpload = async ({ projectId, projectName, category }) => {
    try {
      await fileService.upload(pendingFile, projectId, projectName, category, profile);
      await fetchFiles();
    } catch (err) {
      console.error('[Upload] failed', err);
    } finally {
      setPendingFile(null);
    }
  };

  const handleDownload = async (file) => {
    try {
      const url = await fileService.getSignedUrl(file.storagePath);
      await fileService.logAction(file.id, 'download', profile);
      const a = document.createElement('a');
      a.href = url; a.download = file.name; a.click();
    } catch (err) {
      console.error('[Download] failed', err);
    }
  };

  const handleDelete = async (file) => {
    try {
      await fileService.delete(file.id, file.storagePath, profile);
      setFiles(prev => prev.filter(f => f.id !== file.id));
    } catch (err) {
      console.error('[Delete] failed', err);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  return (
    <div>
      <div className="glass rounded-2xl p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="section-hd">{t('filesHd')}</div>
            <div className="section-sub">{t('filesSub')}</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTER_BUTTONS.map(btn => (
              <button
                key={btn.cat}
                className={activeCat === btn.cat ? 'tag tag-amber' : 'tag glass'}
                style={activeCat !== btn.cat ? { color: 'var(--text-muted)' } : {}}
                onClick={() => setActiveCat(btn.cat)}
              >
                {t(btn.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="upload-zone p-8 text-center mb-4" onClick={() => inputRef.current?.click()} style={{ cursor: 'pointer' }}>
          <input type="file" ref={inputRef} className="hidden" onChange={handleFileSelected} />
          <FolderOpen size={36} style={{ marginBottom: 8, color: 'var(--rasf-primary)', opacity: 0.5 }} />
          <div className="font-semibold mb-1" style={{ color: 'var(--text-hi)' }}>{t('uz2T')}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('uz2S')}</div>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--bg-card-strong)' }}>
              {['mfth1','mfth2','mfth3','mfth4','mfth5'].map(k => (
                <th key={k} className="text-right px-5 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{t(k)}</th>
              ))}
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {files.map(f => (
              <tr key={f.id} className="trow" style={{ borderTop: '1px solid var(--border-faint)' }}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span>{f.icon}</span>
                    <span className="font-medium">{f.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-xs" style={{ color: 'var(--text-muted)' }}>{f.projectName || '—'}</td>
                <td className="px-5 py-4">
                  <Tag variant={CATEGORY_VARIANT[f.category] ?? 'blue'}>{t(CATEGORY_LABEL[f.category] ?? 'fcAll')}</Tag>
                </td>
                <td className="px-5 py-4" style={{ color: 'var(--text-muted)' }}>{f.formattedSize}</td>
                <td className="px-5 py-4" style={{ color: 'var(--text-muted)' }}>{f.uploadedBy}</td>
                <td className="px-5 py-4">
                  {confirmDeleteId === f.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>تأكيد الحذف؟</span>
                      <button
                        onClick={() => handleDelete(f)}
                        style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 7, border: '1px solid #ef4444', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer' }}
                      >
                        نعم
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-card-strong)', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        لا
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      {f.isPreviewable && (
                        <button
                          onClick={() => setViewerFile(f)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--rasf-primary-dim)', border: '1px solid var(--rasf-primary)', color: 'var(--rasf-primary)', borderRadius: 7, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                        >
                          <Eye size={12} /> عرض
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(f)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-card-strong)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 7, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                      >
                        <Download size={12} /> {t('download')}
                      </button>
                      {isDepAdmin && (
                        <button
                          onClick={() => setConfirmDeleteId(f.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 7, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                        >
                          <Trash2 size={12} /> حذف
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {files.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-faint)', fontSize: 13 }}>
                  لا توجد ملفات بعد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pendingFile && (
        <UploadModal
          file={pendingFile}
          projects={projects}
          onConfirm={handleConfirmUpload}
          onCancel={() => setPendingFile(null)}
          t={t}
        />
      )}

      {viewerFile && <FileViewer file={viewerFile} onClose={() => setViewerFile(null)} />}
    </div>
  );
}
