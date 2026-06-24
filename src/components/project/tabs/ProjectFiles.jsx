import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp }       from '../../../contexts/useApp';
import { useAuth }      from '../../../contexts/useAuth';
import { FileCategory } from '../../../models/FileDocument';
import { parseStudyFile } from '../../../utils/studyParser';
import FileViewer       from '../../common/FileViewer';
import Tag              from '../../common/Tag';
import { TrendingUp, FileText, FileCheck, Landmark, Sparkles, Eye, Download, Loader, Trash2 } from 'lucide-react';

const CATEGORY_OPTIONS = [
  { value: FileCategory.FINANCIAL, label: 'دراسة مالية', icon: <TrendingUp size={13} />, variant: 'amber',
    hint: 'سيتم استخراج البيانات تلقائياً من ملف Excel' },
  { value: FileCategory.REPORTS,   label: 'تقرير',        icon: <FileText size={13} />,  variant: 'blue',  hint: '' },
  { value: FileCategory.CONTRACTS, label: 'عقد',          icon: <FileCheck size={13} />, variant: 'green', hint: '' },
  { value: FileCategory.DRAWINGS,  label: 'مخططات',       icon: <Landmark size={13} />,  variant: 'red',   hint: '' },
];

const CATEGORY_VARIANT = { fin: 'amber', rep: 'blue', con: 'green', drw: 'red' };
const CATEGORY_LABEL   = { fin: 'دراسة مالية', rep: 'تقرير', con: 'عقد', drw: 'مخططات' };

export default function ProjectFiles({ project }) {
  const { t, fileService, portfolioService, refreshPortfolio } = useApp();
  const { profile, isDepAdmin } = useAuth();
  const [files,        setFiles]       = useState([]);
  const [category,     setCategory]    = useState(FileCategory.FINANCIAL);
  const [uploading,    setUploading]   = useState(false);
  const [parsing,      setParsing]     = useState(false);
  const [parseResult,  setParseResult] = useState(null);
  const [viewerFile,   setViewerFile]  = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const inputRef = useRef(null);

  const fetchFiles = useCallback(async () => {
    const data = await fileService.getByProject(project.id);
    setFiles(data);
  }, [fileService, project.id]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploading(true);
    setParseResult(null);
    try {
      await fileService.upload(file, project.id, project.name, category, profile);
      await fetchFiles();

      if (category === FileCategory.FINANCIAL && /\.(xlsx|xls|xlsm|xlsb)$/i.test(file.name)) {
        setParsing(true);
        try {
          const data = await parseStudyFile(file);
          if (data && Object.keys(data).length > 0) {
            applyExtractedData(data);
            setParseResult({ success: true, data });
          }
        } catch (err) {
          setParseResult({ success: false, error: err.message });
        } finally {
          setParsing(false);
        }
      }
    } catch (err) {
      console.error('[Upload] failed', err);
    } finally {
      setUploading(false);
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

  const applyExtractedData = (ex) => {
    const inv = ex.investmentM ?? 0;
    const compBreakdown = ex.componentBreakdown
      ? Object.entries(ex.componentBreakdown).map(([key, data]) => ({ key, ...data }))
      : project.componentBreakdown ?? [];
    portfolioService.updateProject(project.id, {
      location:       ex.location      || project.location,
      deliveryDate:   ex.deliveryDate  || project.deliveryDate,
      investmentM:    inv || project.investmentM,
      totalInvestment: inv >= 1000 ? `${(inv/1000).toFixed(1)}B` : inv > 0 ? `${inv}M` : project.totalInvestment,
      irr:            ex.irr           ?? project.irr,
      roi:            ex.roi           ?? project.roi,
      roeAnnual:      ex.roeAnnual     ?? project.roeAnnual,
      area:           ex.area          || project.area,
      farValue:       ex.farValue      ?? project.farValue,
      aboveGradeGBA:  ex.aboveGradeGBA || project.aboveGradeGBA,
      belowGradeGBA:  ex.belowGradeGBA || project.belowGradeGBA,
      totalGBA:       ex.totalGBA      || project.totalGBA,
      nsaArea:        ex.nsaArea       || project.nsaArea,
      units:          ex.units         ?? project.units,
      avgUnitPrice:   ex.avgUnitPrice  ?? project.avgUnitPrice,
      moic:           ex.moic ? `${ex.moic}x` : project.moic,
      paybackYears:   ex.paybackYears  ?? project.paybackYears,
      componentBreakdown: compBreakdown,
      costs: {
        totalRevenue:        ex.totalRevenue        ?? project.costs?.totalRevenue        ?? 0,
        netProfit:           ex.netProfit           ?? project.costs?.netProfit           ?? 0,
        landCost:            ex.landCost            ?? project.costs?.landCost            ?? 0,
        constructionCost:    ex.constructionCost    ?? project.costs?.constructionCost    ?? 0,
        finishingCost:       ex.finishingCost       ?? project.costs?.finishingCost       ?? 0,
        financingCost:       ex.financingCost       ?? project.costs?.financingCost       ?? 0,
        otherCost:           ex.otherCost           ?? project.costs?.otherCost           ?? 0,
        developerCost:       ex.developerFee        ?? project.costs?.developerCost       ?? 0,
        fundCost:            ex.fundFees            ?? project.costs?.fundCost            ?? 0,
        totalCost:           ex.totalCost           ?? (inv || (project.costs?.totalCost  ?? 0)),
        operationalCost:     ex.operationalCost     ?? project.costs?.operationalCost     ?? 0,
        directSalesRevenue:  ex.directSalesRevenue  ?? project.costs?.directSalesRevenue  ?? 0,
        annualRentalRevenue: ex.annualRentalRevenue ?? project.costs?.annualRentalRevenue ?? 0,
        dailyRentalRevenue:  ex.dailyRentalRevenue  ?? project.costs?.dailyRentalRevenue  ?? 0,
        offplanRevenue:      ex.offplanRevenue      ?? project.costs?.offplanRevenue      ?? 0,
        exitValue:           ex.exitValue           ?? project.costs?.exitValue           ?? 0,
      },
    });
    refreshPortfolio();
  };

  const selectedCat = CATEGORY_OPTIONS.find(c => c.value === category);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Category selector */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>
          حدد نوع الملف قبل الرفع
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATEGORY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setCategory(opt.value); setParseResult(null); }}
              style={{
                padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                border: `1px solid ${category === opt.value ? 'var(--rasf-primary)' : 'var(--border)'}`,
                background: category === opt.value ? 'var(--rasf-primary-dim)' : 'var(--bg-app)',
                color: category === opt.value ? 'var(--rasf-primary)' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all .15s',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>{opt.icon} {opt.label}</span>
            </button>
          ))}
        </div>
        {selectedCat?.hint && (
          <div style={{
            marginTop: 8, padding: '8px 12px', borderRadius: 8, fontSize: 11,
            background: 'rgba(164,144,126,0.08)', border: '1px solid rgba(164,144,126,0.2)',
            color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Sparkles size={12} style={{ flexShrink: 0, color: 'var(--rasf-primary)' }} />
            {selectedCat.hint}
          </div>
        )}
      </div>

      {/* Upload zone */}
      <div
        className="upload-zone p-8 text-center"
        onClick={() => !uploading && inputRef.current?.click()}
        style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}
      >
        <input
          ref={inputRef}
          type="file"
          style={{ display: 'none' }}
          accept={category === FileCategory.FINANCIAL ? '.xlsx,.xls,.xlsm,.xlsb,.pdf' : '*'}
          onChange={handleUpload}
        />
        {uploading
          ? <Loader size={36} style={{ marginBottom: 8, animation: 'spin 1s linear infinite', color: 'var(--rasf-primary)' }} />
          : <div style={{ fontSize: 36, marginBottom: 8 }}>{selectedCat?.icon ?? '📎'}</div>
        }
        <div style={{ fontWeight: 700, color: 'var(--text-hi)', marginBottom: 4 }}>
          {uploading ? 'جارٍ الرفع...' : t('uzT')}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {category === FileCategory.FINANCIAL ? 'xlsx, xls, xlsm, pdf' : 'جميع أنواع الملفات'}
        </div>
      </div>

      {/* Parsing / parse result */}
      {parsing && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>⏳</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-hi)' }}>جارٍ تحليل الدراسة المالية...</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>سيتم استخراج البيانات وتحديث المشروع تلقائياً</div>
          </div>
        </div>
      )}
      {parseResult && !parsing && (
        <div style={{
          background: parseResult.success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${parseResult.success ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
          borderRadius: 12, padding: '14px 18px',
        }}>
          {parseResult.success ? (
            <>
              <div style={{ fontWeight: 700, color: '#10b981', fontSize: 13, marginBottom: 8 }}>✅ تم استخراج البيانات وتحديث المشروع</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  parseResult.data.investmentM  && `الاستثمار: ${parseResult.data.investmentM}M`,
                  parseResult.data.irr          && `IRR: ${parseResult.data.irr}%`,
                  parseResult.data.roi          && `ROI: ${parseResult.data.roi}%`,
                  parseResult.data.units        && `الوحدات: ${parseResult.data.units}`,
                  parseResult.data.totalRevenue && `الإيرادات: ${parseResult.data.totalRevenue}`,
                ].filter(Boolean).map((item, i) => (
                  <span key={i} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>{item}</span>
                ))}
              </div>
            </>
          ) : (
            <div style={{ fontWeight: 600, color: '#ef4444', fontSize: 13 }}>
              ⚠️ تعذّر استخراج البيانات — تم حفظ الملف فقط
              {parseResult.error && <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>{parseResult.error}</div>}
            </div>
          )}
        </div>
      )}

      {/* Files table */}
      {files.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-card-strong)' }}>
                {['الملف', 'النوع', 'رُفع بواسطة', 'الحجم', 'التاريخ', ''].map((h, i) => (
                  <th key={i} className="text-right px-5 py-3" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {files.map(f => (
                <tr key={f.id} style={{ borderTop: '1px solid var(--border-faint)' }}>
                  <td className="px-5 py-4">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{f.icon}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-hi)' }}>{f.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Tag variant={CATEGORY_VARIANT[f.category] ?? 'blue'}>{CATEGORY_LABEL[f.category] ?? f.category}</Tag>
                  </td>
                  <td className="px-5 py-4">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: 'var(--rasf-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>
                        {(f.uploadedBy ?? '؟')[0]}
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.uploadedBy ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4" style={{ color: 'var(--text-muted)' }}>{f.formattedSize}</td>
                  <td className="px-5 py-4" style={{ color: 'var(--text-muted)' }}>{f.date}</td>
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
                          <Download size={12} /> تنزيل
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
            </tbody>
          </table>
        </div>
      )}

      {files.length === 0 && !uploading && !parsing && (
        <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-faint)', fontSize: 13 }}>
          لا توجد ملفات مرفوعة لهذا المشروع بعد
        </div>
      )}

      {viewerFile && <FileViewer file={viewerFile} onClose={() => setViewerFile(null)} />}
    </div>
  );
}
