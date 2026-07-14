import { useState } from 'react';
import { useAuth }  from '../../contexts/useAuth';
import { X, Eye, EyeOff, KeyRound } from 'lucide-react';

export default function ChangePasswordModal({ targetUser, onClose }) {
  const { changeOwnPassword, adminChangeUserPassword, profile } = useAuth();
  const isOwnPassword = !targetUser || targetUser.id === profile?.id;

  const [newPass,   setNewPass]   = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showNew,   setShowNew]   = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPass.length < 6)        return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    if (newPass !== confirm)        return setError('كلمتا المرور غير متطابقتين');

    setLoading(true);
    try {
      if (isOwnPassword) {
        await changeOwnPassword(newPass);
      } else {
        await adminChangeUserPassword(targetUser.id, newPass);
      }
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.message ?? 'حدث خطأ، حاول مجدداً');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '9px 36px 9px 12px', borderRadius: 9, fontSize: 13,
    background: 'var(--bg-card-strong)', border: '1px solid var(--border)',
    color: 'var(--text-hi)', outline: 'none', boxSizing: 'border-box',
  };

  const eyeStyle = {
    position: 'absolute', top: '50%', left: 10, transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-faint)', padding: 0, display: 'flex',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 400, padding: 28 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <KeyRound size={18} style={{ color: 'var(--rasf-primary)' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-hi)' }}>
                {isOwnPassword ? 'تغيير كلمة المرور' : `تغيير كلمة مرور ${targetUser?.full_name}`}
              </div>
              {!isOwnPassword && (
                <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{targetUser?.email}</div>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <div style={{ fontWeight: 600, color: '#10b981', fontSize: 14 }}>تم تغيير كلمة المرور بنجاح</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* New password */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                كلمة المرور الجديدة
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  placeholder="6 أحرف على الأقل"
                  required
                  style={inputStyle}
                />
                <button type="button" style={eyeStyle} onClick={() => setShowNew(v => !v)}>
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                تأكيد كلمة المرور
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConf ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="أعد كتابة كلمة المرور"
                  required
                  style={inputStyle}
                />
                <button type="button" style={eyeStyle} onClick={() => setShowConf(v => !v)}>
                  {showConf ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ fontSize: 12, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: 'var(--bg-card-strong)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{ padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: 'var(--rasf-primary)', border: 'none', color: '#fff', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'جارٍ الحفظ…' : 'حفظ'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
