import { useState, useRef } from 'react';
import { useApp } from '../../contexts/useApp';
import { FileCategory } from '../../models/FileDocument';
import Tag from '../common/Tag';
import { FolderOpen } from 'lucide-react';

const CATEGORY_VARIANT = { fin: 'amber', rep: 'blue', con: 'green', drw: 'red' };
const CATEGORY_LABEL   = { fin: 'fcFin', rep: 'fcRep', con: 'fcCon', drw: 'fcDrw' };

const FILTER_BUTTONS = [
  { cat: 'all', labelKey: 'fcAll' },
  { cat: FileCategory.FINANCIAL, labelKey: 'fcFin' },
  { cat: FileCategory.REPORTS,   labelKey: 'fcRep' },
  { cat: FileCategory.CONTRACTS, labelKey: 'fcCon' },
  { cat: FileCategory.DRAWINGS,  labelKey: 'fcDrw' },
];

export default function FileRepository() {
  const { t, fileService, refreshFiles } = useApp();
  const [activeCat, setActiveCat]       = useState('all');
  const [, forceRender]                 = useState(0);
  const inputRef                        = useRef(null);

  const files = fileService.getByCategory(activeCat);

  const handleUpload = (e) => {
    fileService.addFromUpload(e.target.files);
    forceRender(n => n + 1);
    refreshFiles();
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

        <div
          className="upload-zone p-8 text-center mb-4"
          onClick={() => inputRef.current?.click()}
        >
          <input type="file" ref={inputRef} multiple onChange={handleUpload} />
          <FolderOpen size={36} style={{ marginBottom: 8, color: 'var(--rasf-primary)', opacity: 0.5 }} />
          <div className="font-semibold mb-1" style={{ color: 'var(--text-hi)' }}>{t('uz2T')}</div>
          <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{t('uz2S')}</div>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--bg-card-strong)' }}>
              {['mfth1','mfth2','mfth3','mfth4','mfth5'].map(k => (
                <th key={k} className="text-right px-5 py-3 text-xs font-medium" style={{ color: 'var(--color-muted)' }}>{t(k)}</th>
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
                <td className="px-5 py-4 text-xs" style={{ color: 'var(--color-muted)' }}>{f.projectName}</td>
                <td className="px-5 py-4">
                  <Tag variant={CATEGORY_VARIANT[f.category] ?? 'blue'}>{t(CATEGORY_LABEL[f.category] ?? 'fcAll')}</Tag>
                </td>
                <td className="px-5 py-4" style={{ color: 'var(--color-muted)' }}>{f.formattedSize}</td>
                <td className="px-5 py-4" style={{ color: 'var(--color-muted)' }}>{f.uploadedBy}</td>
                <td className="px-5 py-4">
                  <button className="glass rounded-lg px-3 py-1 text-xs hover:opacity-80">{t('download')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

