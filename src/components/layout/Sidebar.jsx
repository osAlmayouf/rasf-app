import { useState } from 'react';
import { useApp }  from '../../contexts/useApp';
import { useAuth } from '../../contexts/useAuth';
import { ChevronDown, LogOut, LayoutDashboard, FolderKanban, Search, FolderOpen } from 'lucide-react';

const NAV_ICONS = {
  dashboard:          <LayoutDashboard size={14} />,
  'pipeline-dashboard': <LayoutDashboard size={14} />,
  project:            <FolderKanban size={14} />,
  pipeline:           <Search size={14} />,
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
      { key: 'files',     labelKey: 'nFiles',    page: 'files'     },
    ],
  },
  {
    key: 'commercial',
    labelAr: 'القطاع التجاري',
    labelEn: 'Commercial',
    active: true,
    items: [
      { key: 'commercial',     labelKey: 'nCommercialSales', page: 'commercial'     },
      { key: 'commercial-mkt', labelKey: 'nCommercialMkt',   page: 'commercial-mkt' },
    ],
  },
  {
    key: 'finance',
    labelAr: 'قطاع المالية',
    labelEn: 'Finance',
    active: false,
    items: [],
  },
  {
    key: 'operations',
    labelAr: 'قطاع المشاريع والعمليات',
    labelEn: 'Projects & Operations',
    active: false,
    items: [],
  },
  {
    key: 'corporate',
    labelAr: 'قطاع الشؤون المؤسسية',
    labelEn: 'Corporate Affairs',
    active: false,
    items: [],
  },
];

export default function Sidebar() {
  const { t, lang, currentPage, setPage, portfolioService, selectedProjectId, setSelectedProjectId } = useApp();
  const { profile, isAdmin, logout } = useAuth();
  const [expanded,  setExpanded]  = useState({ dev: true });
  const [groupOpen, setGroupOpen] = useState({ dashboards: true });

  // When on the project detail page, check if it's a pipeline project
  const activeProjStatus = currentPage === 'project' && portfolioService
    ? portfolioService.getProject(selectedProjectId)?.status
    : null;

  // Determine which nav key should be highlighted
  const activeNavKey = (currentPage === 'pipeline' || currentPage === 'pipeline-dashboard')
    ? 'dashboard'
    : currentPage;

  // Filter sectors to only what this user is explicitly assigned to
  const allowedSectors = isAdmin
    ? SECTORS
    : SECTORS.filter(s => (profile?.sectors ?? []).includes(s.key));

  const SECTOR_HOME = {
    dev: 'dashboard', commercial: 'commercial',
    finance: 'finance', operations: 'operations', corporate: 'corporate',
  };

  const toggle = (sector) => {
    if (!sector.active) {
      // Navigate to the coming-soon page for this sector
      setPage(SECTOR_HOME[sector.key] ?? sector.key);
    }
    setExpanded(prev => ({ ...prev, [sector.key]: !prev[sector.key] }));
  };

  return (
    <div className="sidebar flex flex-col py-5" style={{ borderInlineEnd: '1px solid var(--border-sidebar)' }}>
      {/* Brand */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-3">
          <img
            src="/rasf-logo.png"
            alt="RASF"
            style={{ width: 48, height: 48, borderRadius: 8, flexShrink: 0 }}
          />
          <div>
            <div style={{ fontWeight: 900, color: 'var(--text-hi)', fontSize: 17, letterSpacing: '-0.2px', lineHeight: 1.1 }}>رصف للاستثمار</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, marginTop: 3 }}>{t('sbSub')}</div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border-faint)', marginInline: 16, marginBottom: 12 }} />

      {/* Sectors nav */}
      <nav className="flex-1 px-3 overflow-y-auto" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {allowedSectors.map(sector => {
          const isOpen = !!expanded[sector.key];
          const sectorLabel = lang === 'ar' ? sector.labelAr : sector.labelEn;

          return (
            <div key={sector.key}>
              {/* Sector header */}
              <button
                onClick={() => toggle(sector)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 8,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: '7px 8px', borderRadius: 8,
                  marginBottom: 2,
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: sector.active ? 'var(--rasf-primary)' : 'var(--pending-dot)',
                  }} />
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: sector.active ? 'var(--text-med)' : 'var(--text-faint)',
                    letterSpacing: '0.2px',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {sectorLabel}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  {!sector.active && (
                    <span style={{
                      fontSize: 9, fontWeight: 600, color: 'var(--text-faint)',
                      background: 'var(--bg-subtle)', borderRadius: 4,
                      padding: '1px 5px', border: '1px solid var(--border-faint)',
                    }}>
                      {lang === 'ar' ? 'قريباً' : 'Soon'}
                    </span>
                  )}
                  <ChevronDown
                    size={13}
                    style={{
                      color: 'var(--text-faint)',
                      transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                      transition: 'transform 0.18s ease',
                      flexShrink: 0,
                    }}
                  />
                </div>
              </button>

              {/* Nav items */}
              {isOpen && (
                <div style={{ paddingInlineStart: 8, marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {sector.items.length > 0 ? (
                    sector.items.map(item => {

                      /* ── Group item ── */
                      if (item.isGroup) {
                        const isGOpen  = !!groupOpen[item.key];
                        const hasActive = item.children.some(c => c.key === activeNavKey);
                        return (
                          <div key={item.key}>
                            {/* Group header */}
                            <div
                              className={`nav-item ${hasActive && !isGOpen ? 'active' : ''}`}
                              onClick={() => setGroupOpen(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                              style={{ cursor: 'pointer', justifyContent: 'space-between' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className="nav-dot" style={hasActive ? { background: 'var(--rasf-primary)' } : {}} />
                                <span style={hasActive ? { color: 'var(--text-hi)', fontWeight: 700 } : {}}>
                                  {t(item.labelKey)}
                                </span>
                              </div>
                              <ChevronDown
                                size={12}
                                style={{
                                  color: 'var(--text-faint)',
                                  transform: isGOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                                  transition: 'transform .18s',
                                  flexShrink: 0,
                                  marginInlineEnd: 2,
                                }}
                              />
                            </div>

                            {/* Children */}
                            {isGOpen && (
                              <div style={{ paddingInlineStart: 14, display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                                {item.children.map(child => (
                                  <div
                                    key={child.key}
                                    className={`nav-item ${activeNavKey === child.key ? 'active' : ''}`}
                                    onClick={() => setPage(child.page)}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <span style={{ color: activeNavKey === child.key ? 'var(--rasf-primary)' : 'var(--text-faint)', display: 'flex', alignItems: 'center' }}>
                                      {NAV_ICONS[child.key] ?? <div className="nav-dot" />}
                                    </span>
                                    <span>{t(child.labelKey)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }

                      /* ── Regular item ── */
                      return (
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
                            setPage(item.page);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <span style={{ color: activeNavKey === item.key ? 'var(--rasf-primary)' : 'var(--text-faint)', display: 'flex', alignItems: 'center' }}>
                            {NAV_ICONS[item.key] ?? <div className="nav-dot" />}
                          </span>
                          <span>{t(item.labelKey)}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{
                      padding: '10px 12px', borderRadius: 8,
                      background: 'var(--bg-subtle)',
                      border: '1px dashed var(--border-faint)',
                      fontSize: 11, color: 'var(--text-faint)',
                      textAlign: 'center',
                    }}>
                      {lang === 'ar' ? 'قيد التطوير' : 'Coming soon'}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Admin panel link */}
      {isAdmin && (
        <div className="px-3 mb-1">
          <div
            className={`nav-item ${activeNavKey === 'admin' ? 'active' : ''}`}
            onClick={() => setPage('admin')}
            style={{ cursor: 'pointer' }}
          >
            <div className="nav-dot" />
            <span style={{ fontSize: 12 }}>إدارة المستخدمين</span>
          </div>
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
