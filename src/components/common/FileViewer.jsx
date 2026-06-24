import { useState, useEffect } from 'react';
import { useApp }  from '../../contexts/useApp';
import { useAuth } from '../../contexts/useAuth';
import * as XLSX   from 'xlsx';
import { X, Download, Loader } from 'lucide-react';

function ExcelPreview({ url }) {
  const [rows,  setRows]  = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(url)
      .then(r => r.arrayBuffer())
      .then(buf => {
        const wb    = XLSX.read(buf, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const data  = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        setRows(data.filter(r => r.some(c => c !== '')));
      })
      .catch(() => setError(true));
  }, [url]);

  if (error) return <div style={{ color: 'var(--text-faint)', padding: 40, textAlign: 'center' }}>تعذّر تحميل الملف</div>;
  if (!rows)  return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--rasf-primary)' }} /></div>;

  const headers = rows[0] ?? [];
  const body    = rows.slice(1);

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: 'var(--bg-card-strong)', position: 'sticky', top: 0 }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                {String(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: '1px solid var(--border-faint)', background: ri % 2 === 0 ? 'var(--bg-row-a)' : 'var(--bg-row-b)' }}>
              {headers.map((_, ci) => (
                <td key={ci} style={{ padding: '7px 12px', color: 'var(--text-hi)', whiteSpace: 'nowrap' }}>
                  {String(row[ci] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FileViewer({ file, onClose }) {
  const { fileService } = useApp();
  const { profile }     = useAuth();
  const [url,     setUrl]     = useState(null);
  const [loading, setLoading] = useState(true);
  const ext = file?.extension ?? '';

  useEffect(() => {
    if (!file?.storagePath) return;
    fileService.getSignedUrl(file.storagePath)
      .then(signed => {
        setUrl(signed);
        fileService.logAction(file.id, 'view', profile);
      })
      .finally(() => setLoading(false));
  }, [file?.storagePath]);

  const handleDownload = async () => {
    if (!url) return;
    await fileService.logAction(file.id, 'download', profile);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
  };

  const isPDF   = ext === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg', 'webp'].includes(ext);
  const isExcel = ['xlsx', 'xls', 'xlsm', 'xlsb'].includes(ext);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        width: '100%', maxWidth: 1000,
        height: '90vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{file.icon}</span>
            <span style={{ fontWeight: 700, color: 'var(--text-hi)', fontSize: 14 }}>{file.name}</span>
            <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>{file.formattedSize}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleDownload}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--rasf-primary-dim)',
                border: '1px solid var(--rasf-primary)',
                color: 'var(--rasf-primary)',
                borderRadius: 8, padding: '6px 14px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Download size={13} /> تنزيل
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--text-muted)', borderRadius: 8,
                padding: '6px 10px', cursor: 'pointer',
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', padding: isPDF || isExcel ? 0 : 20 }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Loader size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--rasf-primary)' }} />
            </div>
          )}

          {!loading && url && isPDF && (
            <iframe
              src={url}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title={file.name}
            />
          )}

          {!loading && url && isImage && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <img
                src={url}
                alt={file.name}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }}
              />
            </div>
          )}

          {!loading && url && isExcel && <ExcelPreview url={url} />}

          {!loading && url && !isPDF && !isImage && !isExcel && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
              <span style={{ fontSize: 48 }}>{file.icon}</span>
              <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>لا يمكن عرض هذا النوع من الملفات مباشرة</div>
              <button
                onClick={handleDownload}
                style={{
                  background: 'var(--rasf-primary)', color: 'var(--bg-app)',
                  border: 'none', borderRadius: 8, padding: '8px 20px',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                تنزيل الملف
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
