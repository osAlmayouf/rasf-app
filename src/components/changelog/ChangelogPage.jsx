import { useApp } from '../../contexts/useApp';
import { CHANGELOG } from '../../data/changelog';
import { Sparkles, Wrench, Bug } from 'lucide-react';

// نوع البند: أيقونة + لون + مسمى
const TYPE_META = {
  feature: { icon: Sparkles, color: 'var(--rasf-primary)', ar: 'ميزة',  en: 'Feature' },
  improve: { icon: Wrench,   color: '#8A6D51',            ar: 'تحسين', en: 'Improvement' },
  fix:     { icon: Bug,      color: '#A4907E',            ar: 'إصلاح', en: 'Fix' },
};

function fmtDate(iso, lang) {
  try {
    return new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return iso; }
}

export default function ChangelogPage() {
  const { lang } = useApp();
  const isAr = lang === 'ar';

  return (
    <div>
      <div className="mb-5">
        <div className="section-hd">{isAr ? 'آخر التطورات' : 'What’s New'}</div>
        <div className="section-sub">{isAr ? 'سجل التحديثات والتعديلات على الموقع' : 'Site updates & release notes'}</div>
      </div>

      <div style={{ position: 'relative' }}>
        {/* الخط الزمني */}
        <div style={{ position: 'absolute', insetInlineStart: 7, top: 6, bottom: 6, width: 2, background: 'var(--border)' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {CHANGELOG.map((rel, idx) => (
            <div key={rel.version} style={{ position: 'relative', paddingInlineStart: 30 }}>
              {/* نقطة الزمن */}
              <div style={{
                position: 'absolute', insetInlineStart: 0, top: 4,
                width: 16, height: 16, borderRadius: '50%',
                background: idx === 0 ? 'var(--rasf-primary)' : 'var(--bg-card-strong)',
                border: `2px solid ${idx === 0 ? 'var(--rasf-primary)' : 'var(--border-mid)'}`,
              }} />

              <div className="glass rounded-2xl" style={{ padding: '16px 18px' }}>
                {/* رأس الإصدار */}
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span style={{
                      fontSize: 13, fontWeight: 800, color: 'var(--rasf-primary)',
                      background: 'var(--rasf-primary-dim)', border: '1px solid var(--border-tag-warm)',
                      borderRadius: 6, padding: '2px 10px', letterSpacing: '0.5px', direction: 'ltr',
                    }}>v{rel.version}</span>
                    {rel.title && <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-hi)' }}>{rel.title}</span>}
                    {idx === 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--rasf-primary)', background: 'var(--rasf-primary-dim)', borderRadius: 5, padding: '2px 8px' }}>
                        {isAr ? 'الأحدث' : 'Latest'}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(rel.date, lang)}</span>
                </div>

                {/* البنود */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {rel.changes.map((ch, i) => {
                    const meta = TYPE_META[ch.type] ?? TYPE_META.improve;
                    const Icon = meta.icon;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                        <span style={{
                          width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                          background: 'var(--bg-card-strong)', border: '1px solid var(--border)',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: meta.color,
                        }}>
                          <Icon size={12} />
                        </span>
                        <div style={{ flex: 1 }}>
                          <span style={{
                            fontSize: 9.5, fontWeight: 700, color: meta.color,
                            background: 'var(--bg-card-strong)', border: `1px solid var(--border)`,
                            borderRadius: 4, padding: '1px 6px', marginInlineEnd: 7,
                          }}>{isAr ? meta.ar : meta.en}</span>
                          <span style={{ fontSize: 12.5, color: 'var(--text-lo)', lineHeight: 1.6 }}>{ch.text}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
