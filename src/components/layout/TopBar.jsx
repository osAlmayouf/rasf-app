import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../contexts/useApp';
import ReportSheet from '../report/ReportSheet';
import DisplayModeToggle from '../common/DisplayModeToggle';
import { Globe, Loader2, FileDown } from 'lucide-react';

const PAGE_TITLE_KEY = { dashboard: 'ptDash', files: 'ptFiles', pipeline: 'ptPipeline', 'pipeline-dashboard': 'ptPipelineDash' };

function formatUpdateDate(lang) {
  const now = new Date();
  if (lang === 'ar') {
    const d = now.toLocaleDateString('ar-SA-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });
    return `آخر تحديث: ${d}`;
  }
  return `Last updated: ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;
}

export default function TopBar() {
  const { t, lang, toggleLang, theme, toggleTheme, currentPage, portfolioService, selectedProjectId } = useApp();
  const [exporting,  setExporting]  = useState(false);
  const [capturing,  setCapturing]  = useState(false);

  useEffect(() => {
    if (!capturing) return;

    const done = () => {
      window.removeEventListener('afterprint', done);
      setCapturing(false);
      setExporting(false);
    };

    // Give React a frame to paint the mounted ReportSheet, then print
    const t = setTimeout(() => {
      window.addEventListener('afterprint', done);
      window.print();
    }, 300);

    return () => clearTimeout(t);
  }, [capturing]);

  const handleExport = () => {
    setExporting(true);
    setCapturing(true);
  };

  const getTitle = () => {
    if (currentPage === 'project') {
      const proj = portfolioService.getProject(selectedProjectId);
      if (!proj) return t('nProj');
      const section = proj.status === 'pipeline' ? t('ptPipeline') : t('ptProjLabel');
      return `${proj.name} — ${section}`;
    }
    return t(PAGE_TITLE_KEY[currentPage] ?? 'ptDash');
  };

  return (
    <>
      <div
        className="flex items-center justify-between sticky top-0 z-50"
        style={{ padding: '16px 24px', background: 'var(--bg-topbar)', borderBottom: '1px solid var(--border-faint)' }}
      >
        <div>
          <div style={{ fontWeight: 800, color: 'var(--text-hi)', fontSize: 17, letterSpacing: '-0.2px' }}>{getTitle()}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>{formatUpdateDate(lang)}</div>
        </div>

        <div className="flex items-center gap-3">
          {/* Display mode toggle */}
          <DisplayModeToggle />

          {/* Language toggle */}
          <button className="lang-btn" onClick={toggleLang}>
            <Globe size={13} style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: lang === 'ar' ? 'var(--rasf-primary)' : 'var(--text-muted)', fontWeight: lang === 'ar' ? 700 : 400 }}>AR</span>
            <span style={{ color: 'var(--border-mid)' }}>|</span>
            <span style={{ color: lang === 'en' ? 'var(--rasf-primary)' : 'var(--text-muted)', fontWeight: lang === 'en' ? 700 : 400 }}>EN</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'var(--bg-btn)', border: '1px solid var(--border-soft)',
              borderRadius: 20, padding: '5px 12px', cursor: 'pointer',
              transition: 'all .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--rasf-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-soft)'; }}
          >
            {/* Track */}
            <div style={{
              width: 34, height: 18, borderRadius: 9,
              background: theme === 'light' ? 'var(--rasf-primary)' : 'var(--border-mid)',
              position: 'relative', transition: 'background .25s', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: 2,
                insetInlineStart: theme === 'light' ? 'calc(100% - 16px)' : 2,
                width: 14, height: 14, borderRadius: '50%',
                background: theme === 'light' ? '#fff' : 'var(--rasf-primary)',
                transition: 'all .25s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {theme === 'dark' ? (lang === 'ar' ? 'داكن' : 'Dark') : (lang === 'ar' ? 'فاتح' : 'Light')}
            </span>
          </button>

          {/* Export */}
          <button
            disabled={exporting}
            style={{
              background: 'var(--bg-btn)', border: '1px solid var(--border-soft)', color: 'var(--text-muted)',
              borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 600,
              cursor: exporting ? 'wait' : 'pointer', transition: 'all .18s',
              opacity: exporting ? 0.6 : 1,
            }}
            onMouseEnter={e => { if (!exporting) { e.currentTarget.style.borderColor = 'var(--border-mid)'; e.currentTarget.style.color = 'var(--text-med)'; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-soft)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            onClick={handleExport}
          >
            {exporting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                {lang === 'ar' ? 'جارٍ التصدير...' : 'Exporting...'}
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileDown size={13} />
                {t('tbExport')}
              </span>
            )}
          </button>

        </div>
      </div>

      {/* Portal: loading overlay (screen only) + report sheet (print only) */}
      {capturing && createPortal(
        <>
          {/* Loading overlay — hidden when printing via CSS */}
          <div id="rasf-print-overlay" style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(9,13,26,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 14, color: 'var(--rasf-primary)', fontWeight: 700 }}>
              {lang === 'ar' ? '⏳ جارٍ تصدير التقرير...' : '⏳ Preparing PDF report...'}
            </span>
          </div>

          {/* Report — hidden on screen, printed by window.print() */}
          <div id="rasf-print-root">
            <ReportSheet portfolioService={portfolioService} lang={lang} />
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
