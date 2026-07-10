import { useApp }  from '../../contexts/useApp';
import { useAuth } from '../../contexts/useAuth';
import { APP_VERSION } from '../../appVersion';
import { LogOut, LayoutDashboard, FolderKanban, Search, FolderOpen, MapPin, ScrollText, History } from 'lucide-react';

const NAV_ICONS = {
  dashboard:          <LayoutDashboard size={14} />,
  'pipeline-dashboard': <LayoutDashboard size={14} />,
  project:            <FolderKanban size={14} />,
  pipeline:           <Search size={14} />,
  map:                <MapPin size={14} />,
  contracts:          <ScrollText size={14} />,
  activity:           <History size={14} />,
  files:              <FolderOpen size={14} />,
};

const SECTORS = [
  {
    key: 'dev',
    labelAr: 'قطاع تطوير الأعمال',
    labelEn: 'Business Development',
    active: true,
    items: [
      { key: 'dashboard', labelKey: 'nDash',     page: 'dashboard' },
      { key: 'project',   labelKey: 'nProj',     page: 'project'   },
      { key: 'map',       labelKey: 'nMap',      page: 'map'       },
      { key: 'contracts', labelKey: 'nContracts', page: 'contracts' },
      { key: 'files',     labelKey: 'nFiles',    page: 'files'     },
    ],
  },
];

export default function Sidebar({ drawerOpen = false, onNavigate }) {
  const { t, currentPage, setPage, portfolioService, selectedProjectId, setSelectedProjectId } = useApp();
  const { profile, isAdmin, isDepAdmin, logout } = useAuth();

  // Wrap page navigation so the drawer closes after a selection (compact mode)
  const go = (page) => { setPage(page); onNavigate?.(); };

  // Determine which nav key should be highlighted
  const activeNavKey = (currentPage === 'pipeline' || currentPage === 'pipeline-dashboard')
    ? 'dashboard'
    : currentPage;

  const allowedSectors = isAdmin
    ? SECTORS
    : SECTORS.filter(s => (profile?.sectors ?? []).includes(s.key));

  return (
    <div className={`sidebar flex flex-col py-5${drawerOpen ? ' open' : ''}`} style={{ borderInlineEnd: '1px solid var(--border-sidebar)' }}>
      {/* Brand */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}rasf-logo.png`}
            alt="RASF"
            style={{ width: 48, height: 48, borderRadius: 8, flexShrink: 0 }}
          />
          <div>
            <div style={{ fontWeight: 900, color: 'var(--text-hi)', fontSize: 17, letterSpacing: '-0.2px', lineHeight: 1.1 }}>رصف للاستثمار</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, marginTop: 3 }}>{t('sbSub')}</div>
            <div style={{ fontSize: 9, color: 'var(--text-faint)', fontWeight: 500, marginTop: 2, letterSpacing: '0.3px' }}>الإصدار {APP_VERSION}</div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border-faint)', marginInline: 16, marginBottom: 12 }} />

      {/* Sectors nav */}
      <nav className="flex-1 px-3 overflow-y-auto" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {allowedSectors.map(sector =>
          sector.items.filter(item => !item.managerOnly || isDepAdmin).map(item => (
            <div
              key={item.key}
              className={`nav-item ${activeNavKey === item.key ? 'active' : ''}`}
              onClick={() => {
                if (!item.page) return;
                if (item.page === 'project' && portfolioService) {
                  const current = portfolioService.getProject(selectedProjectId);
                  if (!current || current.status === 'pipeline' || current.status === 'archived') {
                    const firstActive = portfolioService.getAllProjects()
                      .find(p => p.status !== 'pipeline' && p.status !== 'archived');
                    if (firstActive) setSelectedProjectId(firstActive.id);
                  }
                }
                go(item.page);
              }}
              style={{ cursor: 'pointer' }}
            >
              <span style={{ color: activeNavKey === item.key ? 'var(--rasf-primary)' : 'var(--text-faint)', display: 'flex', alignItems: 'center' }}>
                {NAV_ICONS[item.key] ?? <div className="nav-dot" />}
              </span>
              <span>{t(item.labelKey)}</span>
            </div>
          ))
        )}
      </nav>

      {/* Management links (bottom) — سجل العمليات + إدارة المستخدمين */}
      {isDepAdmin && (
        <div className="px-3 mb-1" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div
            className={`nav-item ${activeNavKey === 'activity' ? 'active' : ''}`}
            onClick={() => go('activity')}
            style={{ cursor: 'pointer' }}
          >
            <span style={{ color: activeNavKey === 'activity' ? 'var(--rasf-primary)' : 'var(--text-faint)', display: 'flex', alignItems: 'center' }}>
              {NAV_ICONS.activity}
            </span>
            <span style={{ fontSize: 12 }}>{t('nActivity')}</span>
          </div>
          {isAdmin && (
            <div
              className={`nav-item ${activeNavKey === 'admin' ? 'active' : ''}`}
              onClick={() => go('admin')}
              style={{ cursor: 'pointer' }}
            >
              <div className="nav-dot" />
              <span style={{ fontSize: 12 }}>إدارة المستخدمين</span>
            </div>
          )}
        </div>
      )}

      {/* User */}
      <div className="px-3 mt-2 pt-3" style={{ borderTop: '1px solid var(--border-faint)' }}>
        <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'var(--rasf-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 13, color: '#fff',
            }}>
              {(profile?.full_name ?? 'م')[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-hi)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.full_name ?? t('sbUser')}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                {profile?.role === 'admin' ? 'مدير النظام' : 'مستخدم'}
              </div>
            </div>
            <button
              onClick={logout}
              title="تسجيل الخروج"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-faint)', padding: 2, flexShrink: 0,
                display: 'flex', alignItems: 'center',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
