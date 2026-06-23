const SECTOR_INFO = {
  commercial: {
    labelAr: 'القطاع التجاري',
    descAr:  'إدارة المبيعات، التسويق، وعلاقات العملاء',
  },
  finance: {
    labelAr: 'قطاع المالية',
    descAr:  'التحليل المالي، الميزانيات، والتقارير المالية',
  },
  operations: {
    labelAr: 'قطاع المشاريع والعمليات',
    descAr:  'إدارة المشاريع، متابعة التنفيذ، والعمليات اليومية',
  },
  corporate: {
    labelAr: 'قطاع الشؤون المؤسسية',
    descAr:  'الموارد البشرية، الشؤون القانونية، والإدارة المؤسسية',
  },
};

export default function ComingSoonPage({ sector }) {
  const info = SECTOR_INFO[sector] ?? { labelAr: sector, descAr: '' };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        {/* Icon */}
        <div style={{
          width: 80, height: 80, borderRadius: 20, margin: '0 auto 24px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32,
        }}>
          🏗
        </div>

        {/* Badge */}
        <div style={{
          display: 'inline-block', marginBottom: 16,
          fontSize: 11, fontWeight: 700, letterSpacing: '1px',
          padding: '4px 14px', borderRadius: 20,
          background: 'var(--rasf-primary-dim)',
          border: '1px solid rgba(71,53,48,0.2)',
          color: 'var(--rasf-primary)',
        }}>
          قيد التطوير
        </div>

        {/* Title */}
        <div style={{
          fontSize: 22, fontWeight: 800, color: 'var(--text-hi)',
          marginBottom: 10, lineHeight: 1.3,
        }}>
          {info.labelAr}
        </div>

        {/* Description */}
        <div style={{
          fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7,
          marginBottom: 28,
        }}>
          {info.descAr}
        </div>

        {/* Divider with text */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          color: 'var(--text-faint)', fontSize: 11, marginBottom: 20,
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-faint)' }} />
          هذا القطاع سيكون متاحاً قريباً
          <div style={{ flex: 1, height: 1, background: 'var(--border-faint)' }} />
        </div>

        {/* Steps */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-faint)',
          borderRadius: 12, padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'right',
        }}>
          {['تصميم واجهة المستخدم', 'ربط قاعدة البيانات', 'اختبار وإطلاق'].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: 'var(--bg-app)', border: '1px solid var(--border-faint)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: 'var(--text-faint)',
              }}>{i + 1}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
