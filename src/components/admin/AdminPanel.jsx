import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { useApp }  from '../../contexts/useApp';
import GlassCard from '../common/GlassCard';
import CreateUserModal from './CreateUserModal';

const SECTOR_LABEL = {
  dev:        'تطوير الأعمال',
  commercial: 'التجاري',
  finance:    'المالية',
  operations: 'المشاريع والعمليات',
  corporate:  'الشؤون المؤسسية',
};

const ROLE_LABEL = { admin: 'مدير النظام', user: 'مستخدم' };

export default function AdminPanel() {
  const { listUsers, updateUserProfile, profile: myProfile } = useAuth();
  const { restoreSeedProjects } = useApp();
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showCreate,   setShowCreate]   = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [restoring,    setRestoring]    = useState(false);
  const [restoreDone,  setRestoreDone]  = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try { setUsers(await listUsers()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [listUsers]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const toggleActive = async (user) => {
    await updateUserProfile(user.id, { is_active: !user.is_active });
    loadUsers();
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await restoreSeedProjects();
      setRestoreDone(true);
      setTimeout(() => setRestoreDone(false), 4000);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="section-hd">إدارة المستخدمين</div>
          <div className="section-sub">{users.length} مستخدم مسجل في النظام</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRestore}
            disabled={restoring}
            title="استعادة المشاريع الأصلية من البيانات التجريبية"
            style={{
              background: restoreDone ? 'rgba(16,185,129,0.12)' : 'var(--bg-app)',
              color: restoreDone ? '#10b981' : 'var(--text-muted)',
              border: `1px solid ${restoreDone ? '#10b981' : 'var(--border)'}`,
              borderRadius: 10, padding: '9px 16px',
              fontWeight: 600, fontSize: 12, cursor: restoring ? 'wait' : 'pointer',
              opacity: restoring ? 0.6 : 1, transition: 'all .2s',
            }}
          >
            {restoring ? '⏳ جارٍ...' : restoreDone ? '✓ تمت الاستعادة' : '↺ استعادة المشاريع'}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              background: 'var(--rasf-primary)', color: '#fff',
              border: 'none', borderRadius: 10, padding: '9px 18px',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}
          >
            + إنشاء مستخدم
          </button>
        </div>
      </div>

      {/* Users table */}
      <GlassCard>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
            جاري التحميل...
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-faint)' }}>
                {['الاسم', 'البريد الإلكتروني', 'كلمة المرور (مشفرة)', 'الصلاحية', 'القطاعات', 'الحالة', ''].map((h, i) => (
                  <th key={i} className="text-right px-4 py-3"
                    style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderTop: '1px solid var(--border-faint)' }}>
                  <td className="px-4 py-3">
                    <div style={{ fontWeight: 600, color: 'var(--text-hi)', fontSize: 13 }}>{u.full_name}</div>
                    {u.id === myProfile?.id && (
                      <span style={{ fontSize: 10, color: 'var(--rasf-primary)' }}>أنت</span>
                    )}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.email}</td>
                  <td className="px-4 py-3">
                    {u.password ? (
                      <span style={{
                        fontFamily: 'monospace', fontSize: 10,
                        color: 'var(--text-faint)',
                        background: 'var(--bg-app)',
                        border: '1px solid var(--border-faint)',
                        borderRadius: 5, padding: '2px 7px',
                        letterSpacing: '0.5px',
                      }}>
                        {u.password.slice(0, 20)}…
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
                      background: u.role === 'admin' ? 'rgba(71,53,48,0.1)' : 'rgba(79,142,247,0.1)',
                      color: u.role === 'admin' ? 'var(--rasf-primary)' : '#4f8ef7',
                      border: `1px solid ${u.role === 'admin' ? 'rgba(71,53,48,0.2)' : 'rgba(79,142,247,0.2)'}`,
                    }}>
                      {ROLE_LABEL[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {(u.sectors ?? []).map(s => (
                        <span key={s} style={{
                          fontSize: 10, padding: '2px 7px', borderRadius: 6,
                          background: 'var(--bg-subtle)', color: 'var(--text-muted)',
                          border: '1px solid var(--border-faint)',
                        }}>
                          {SECTOR_LABEL[s] ?? s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{
                      fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 600,
                      background: u.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(107,107,107,0.1)',
                      color: u.is_active ? '#10b981' : 'var(--text-faint)',
                    }}>
                      {u.is_active ? 'نشط' : 'موقوف'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== myProfile?.id && (
                      <button
                        onClick={() => toggleActive(u)}
                        style={{
                          fontSize: 11, padding: '4px 10px', borderRadius: 7,
                          background: 'var(--bg-app)', border: '1px solid var(--border)',
                          color: u.is_active ? '#ef4444' : '#10b981',
                          cursor: 'pointer', fontWeight: 600,
                        }}
                      >
                        {u.is_active ? 'إيقاف' : 'تفعيل'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={loadUsers}
        />
      )}
    </div>
  );
}
