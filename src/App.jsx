import { useEffect, useState } from 'react';
import { AppProvider }  from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { useApp }       from './contexts/useApp';
import { useAuth }      from './contexts/useAuth';
import { useIsCompact } from './hooks/useMediaQuery';
import Sidebar          from './components/layout/Sidebar';
import TopBar           from './components/layout/TopBar';
import Dashboard        from './components/dashboard/Dashboard';
import ProjectDetail    from './components/project/ProjectDetail';
import FileRepository   from './components/files/FileRepository';
import PipelinePage      from './components/pipeline/PipelinePage';
import PipelineDashboard from './components/pipeline/PipelineDashboard';
import AdminPanel        from './components/admin/AdminPanel';
import LoginPage        from './components/auth/LoginPage';
import ComingSoonPage   from './components/common/ComingSoonPage';
import CommercialPage   from './components/commercial/CommercialPage';
import MapPage          from './components/map/MapPage';
import ContractsPage    from './components/contracts/ContractsPage';
import ActivityLogPage  from './components/activity/ActivityLogPage';

function PageRouter() {
  const { currentPage } = useApp();
  switch (currentPage) {
    case 'dashboard':  return <Dashboard />;
    case 'project':    return <ProjectDetail />;
    case 'files':      return <FileRepository />;
    case 'map':        return <MapPage />;
    case 'contracts':  return <ContractsPage />;
    case 'activity':   return <ActivityLogPage />;
    case 'pipeline':           return <PipelinePage />;
    case 'pipeline-dashboard': return <PipelineDashboard />;
    case 'admin':      return <AdminPanel />;
    case 'commercial':     return <CommercialPage defaultTab="sales" />;
    case 'commercial-mkt': return <CommercialPage defaultTab="mktfunnel" />;
    case 'finance':    return <ComingSoonPage sector="finance" />;
    case 'operations': return <ComingSoonPage sector="operations" />;
    case 'corporate':  return <ComingSoonPage sector="corporate" />;
    default:           return <Dashboard />;
  }
}

function LoadingScreen({ message = 'جاري التحميل...' }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg-app)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 9999,
    }}>
      <img src={`${import.meta.env.BASE_URL}rasf-logo.png`} alt="RASF"
        style={{ width: 56, height: 56, borderRadius: 12, opacity: 0.9 }} />
      <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{message}</div>
      <div style={{ width: 180, height: 3, borderRadius: 4, background: 'var(--border-faint)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 4, background: 'var(--rasf-primary)',
          animation: 'loading-bar 1.4s ease-in-out infinite',
        }} />
      </div>
      <style>{`
        @keyframes loading-bar {
          0%   { width: 0%;  margin-left: 0; }
          50%  { width: 70%; margin-left: 0; }
          100% { width: 0%;  margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}

// Maps sector key → its default landing page
const SECTOR_HOME = {
  dev:        'dashboard',
  commercial: 'commercial',
  finance:    'finance',
  operations: 'operations',
  corporate:  'corporate',
};

function AppShell() {
  const { loading: authLoading, loggedIn, isAdmin, profile } = useAuth();
  const { loading: dataLoading, portfolioService, setPage }  = useApp();
  const isCompact = useIsCompact();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Redirect user to their first assigned sector after login
  useEffect(() => {
    if (authLoading || dataLoading || !loggedIn || isAdmin || !profile) return;
    const sectors = profile.sectors ?? [];
    if (sectors.length === 0) return;
    const home = SECTOR_HOME[sectors[0]] ?? 'dashboard';
    setPage(home);
  }, [authLoading, dataLoading, loggedIn, isAdmin, profile]); // eslint-disable-line

  // Leaving compact mode (e.g. rotating to landscape) resets the drawer
  useEffect(() => { if (!isCompact) setDrawerOpen(false); }, [isCompact]);

  if (authLoading)                        return <LoadingScreen message="جاري التحقق من الهوية..." />;
  if (!loggedIn)                          return <LoginPage />;
  if (dataLoading || !portfolioService)   return <LoadingScreen message="جاري تحميل البيانات..." />;

  return (
    <div className="app-shell" style={{ height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        drawerOpen={drawerOpen}
        onNavigate={() => setDrawerOpen(false)}
      />

      {/* Backdrop — only rendered when the drawer is open in compact mode */}
      {isCompact && drawerOpen && (
        <div className="app-backdrop" onClick={() => setDrawerOpen(false)} />
      )}

      <div className="app-main flex-1 overflow-y-auto" style={{ minWidth: 0 }}>
        <TopBar onMenuToggle={() => setDrawerOpen(v => !v)} />
        <div className="app-content">
          <PageRouter />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </AuthProvider>
  );
}
