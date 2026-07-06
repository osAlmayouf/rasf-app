import { useState } from 'react';
import { useAuth } from '../../contexts/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-app)', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 20, padding: '40px 36px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      }}>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <img src="/rasf-logo.png" alt="RASF"
            style={{ width: 48, height: 48, borderRadius: 10, flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, color: 'var(--text-hi)', lineHeight: 1.1 }}>
              رصف للاستثمار
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
              نظام تطوير الأعمال
            </div>
          </div>
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 6 }}>
          تسجيل الدخول
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 28 }}>
          أدخل بيانات حسابك للمتابعة
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="example@rasf.sa"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                background: 'var(--bg-input)', border: '1px solid var(--border)',
                color: 'var(--text-hi)', fontSize: 13, outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--rasf-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                background: 'var(--bg-input)', border: '1px solid var(--border)',
                color: 'var(--text-hi)', fontSize: 13, outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--rasf-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
              borderRadius: 8, padding: '9px 12px',
              fontSize: 12, color: '#dc2626', textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 10,
              background: loading ? 'var(--border)' : 'var(--rasf-primary)',
              color: '#fff', border: 'none', fontWeight: 700, fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4, transition: 'opacity .15s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.88'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            {loading ? 'جاري التحقق...' : 'دخول'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: 'var(--text-faint)' }}>
          للحصول على حساب تواصل مع مدير النظام
        </div>
      </div>
    </div>
  );
}
