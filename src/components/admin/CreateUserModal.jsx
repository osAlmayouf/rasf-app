import { useState } from 'react';
import { useAuth } from '../../contexts/useAuth';

const SECTORS = [
  { key: 'dev',        label: 'قطاع تطوير الأعمال' },
  { key: 'commercial', label: 'القطاع التجاري' },
  { key: 'finance',    label: 'قطاع المالية' },
  { key: 'operations', label: 'قطاع المشاريع والعمليات' },
  { key: 'corporate',  label: 'قطاع الشؤون المؤسسية' },
];

export default function CreateUserModal({ onClose, onCreated }) {
  const { createUser } = useAuth();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    role: 'user', sectors: [],
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleSector = (key) => {
    set('sectors', form.sectors.includes(key)
      ? form.sectors.filter(s => s !== key)
      : [...form.sectors, key]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('كلمة المرور غير متطابقة'); return;
    }
    if (form.password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return;
    }
    if (form.role === 'user' && form.sectors.length === 0) {
      setError('يجب تحديد قطاع واحد على الأقل للمستخدم'); return;
    }
    setLoading(true);
    try {
      await createUser({
        email:    form.email,
        password: form.password,
        fullName: form.fullName,
        role:     form.role,
        sectors:  form.role === 'admin' ? SECTORS.map(s => s.key) : form.sectors,
      });
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err.message ?? 'فشل إنشاء المستخدم');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8, boxSizing: 'border-box',
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    color: 'var(--text-hi)', fontSize: 13, outline: 'none',
  };
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 600,
    color: 'var(--text-muted)', marginBottom: 5,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.55)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 18, padding: 28, width: '100%', maxWidth: 480,
        maxHeight: '90vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>

        <div className="flex justify-between items-center mb-6">
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-hi)' }}>
            إنشاء مستخدم جديد
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Full name */}
          <div>
            <label style={labelStyle}>الاسم الكامل</label>
            <input style={inputStyle} value={form.fullName} onChange={e => set('fullName', e.target.value)} required placeholder="محمد أحمد" />
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>البريد الإلكتروني</label>
            <input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="user@rasf.sa" />
          </div>

          {/* Password row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>كلمة المرور</label>
              <input style={inputStyle} type="password" value={form.password} onChange={e => set('password', e.target.value)} required placeholder="8+ أحرف" />
            </div>
            <div>
              <label style={labelStyle}>تأكيد كلمة المرور</label>
              <input style={inputStyle} type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required placeholder="••••••••" />
            </div>
          </div>

          {/* Role */}
          <div>
            <label style={labelStyle}>الصلاحية</label>
            <div className="flex gap-2">
              {[{v:'user', l:'مستخدم'}, {v:'admin', l:'مدير النظام'}].map(opt => (
                <button key={opt.v} type="button"
                  onClick={() => set('role', opt.v)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${form.role === opt.v ? 'var(--rasf-primary)' : 'var(--border)'}`,
                    background: form.role === opt.v ? 'var(--rasf-primary-dim)' : 'var(--bg-app)',
                    color: form.role === opt.v ? 'var(--rasf-primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}>
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          {/* Sectors (only for regular users) */}
          {form.role === 'user' && (
            <div>
              <label style={labelStyle}>القطاعات المسموح بها</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SECTORS.map(s => (
                  <label key={s.key} style={{
                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                    padding: '7px 10px', borderRadius: 8,
                    background: form.sectors.includes(s.key) ? 'var(--rasf-primary-dim)' : 'var(--bg-app)',
                    border: `1px solid ${form.sectors.includes(s.key) ? 'var(--rasf-primary)' : 'var(--border-faint)'}`,
                  }}>
                    <input type="checkbox" checked={form.sectors.includes(s.key)}
                      onChange={() => toggleSector(s.key)}
                      style={{ accentColor: 'var(--rasf-primary)', width: 14, height: 14 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-hi)' }}>{s.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
              borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#dc2626',
            }}>
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <button type="submit" disabled={loading} style={{
              flex: 1, padding: '10px 0', borderRadius: 9,
              background: loading ? 'var(--border)' : 'var(--rasf-primary)',
              color: '#fff', border: 'none', fontWeight: 700, fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
            </button>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '10px 0', borderRadius: 9,
              background: 'var(--bg-app)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}>
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
