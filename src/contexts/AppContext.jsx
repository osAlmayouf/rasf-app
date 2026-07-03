import { createContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { TranslationService }  from '../services/TranslationService';
import { PortfolioService }    from '../services/PortfolioService';
import { FileService }         from '../services/FileService';
import { NotesService }        from '../services/NotesService';
import { SupabaseDataService } from '../services/SupabaseDataService';
import { PORTFOLIO_SEED } from '../data/seedData';

export const AppContext = createContext(null);

const i18n         = TranslationService.getInstance();
const fileService  = new FileService();
const notesService = new NotesService();

export function AppProvider({ children }) {
  const [lang, setLangState]   = useState('ar');
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('rasf-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
    return 'dark';
  });
  const [displayMode, setDisplayMode] = useState(() => {
    const saved = localStorage.getItem('rasf-displayMode');
    return saved === 'full' ? 'full' : 'thousands';
  });
  const [currentPage, setPage]                     = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId]  = useState('asaar');
  const [pendingTab, setPendingTab]                = useState(null);
  const [outerProjectTab, setOuterProjectTab]      = useState('active');
  const [dataVersion, forceRender]                 = useState(0);
  const [loading, setLoading]                      = useState(true);
  const [portfolioService, setPortfolioService]    = useState(null);
  const syncTimer = useRef(null);

  // ── Load data from Supabase on mount ──────────────────────────────────
  useEffect(() => {
    SupabaseDataService.loadPortfolio()
      .then(data => {
        setPortfolioService(new PortfolioService(data ?? PORTFOLIO_SEED));
      })
      .catch(() => {
        setPortfolioService(new PortfolioService(PORTFOLIO_SEED));
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Sync to Supabase (debounced 800ms after last change) ──────────────
  const syncToSupabase = useCallback((service) => {
    if (!service) return;
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      SupabaseDataService.savePortfolio(service.getRawData());
    }, 800);
  }, []);

  // ── Language ──────────────────────────────────────────────────────────
  const toggleLang = useCallback(() => {
    const next = lang === 'ar' ? 'en' : 'ar';
    i18n.setLang(next);
    setLangState(next);
    document.documentElement.setAttribute('lang', next);
    document.documentElement.setAttribute('dir', next === 'ar' ? 'rtl' : 'ltr');
  }, [lang]);

  // ── Theme ─────────────────────────────────────────────────────────────
  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('rasf-theme', next);
      return next;
    });
  }, []);

  // ── Display mode (thousands / full) ───────────────────────────────────
  const toggleDisplayMode = useCallback(() => {
    setDisplayMode(prev => {
      const next = prev === 'thousands' ? 'full' : 'thousands';
      localStorage.setItem('rasf-displayMode', next);
      return next;
    });
  }, []);

  const t = useCallback((key) => i18n.t(key), [lang]);

  const refreshFiles     = useCallback(() => forceRender(n => n + 1), []);
  const refreshNotes     = useCallback(() => forceRender(n => n + 1), []);

  // refreshPortfolio also syncs to Supabase
  const refreshPortfolio = useCallback(() => {
    forceRender(n => n + 1);
    syncToSupabase(portfolioService);
  }, [portfolioService, syncToSupabase]);

  // Restore all seed projects (upsert — won't delete existing data)
  const restoreSeedProjects = useCallback(async () => {
    await SupabaseDataService.seedFromData(PORTFOLIO_SEED);
    const fresh = await SupabaseDataService.loadPortfolio();
    setPortfolioService(new PortfolioService(fresh ?? PORTFOLIO_SEED));
    forceRender(n => n + 1);
  }, []);

  const value = useMemo(() => ({
    lang, toggleLang,
    theme, toggleTheme,
    displayMode, toggleDisplayMode,
    t,
    currentPage, setPage,
    selectedProjectId, setSelectedProjectId,
    portfolioService, fileService, notesService,
    refreshFiles, refreshPortfolio, refreshNotes,
    restoreSeedProjects,
    pendingTab, setPendingTab,
    outerProjectTab, setOuterProjectTab,
    loading,
    dataVersion, // bumped by refreshPortfolio/Files/Notes → forces consumers to re-read mutated data
  }), [lang, theme, displayMode, currentPage, t, toggleLang, toggleTheme, toggleDisplayMode,
      refreshFiles, refreshPortfolio, refreshNotes, restoreSeedProjects,
      pendingTab, setPendingTab,
      outerProjectTab,
      selectedProjectId, portfolioService, loading,
      dataVersion]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
