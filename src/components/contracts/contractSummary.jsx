import { useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Building2, Landmark, Award } from 'lucide-react';
import { BRAND_SECONDARY, SECTIONS, BLANK, lines } from './contractData';

const inputStyle = {
  background: 'var(--bg-card-strong)', border: '1px solid var(--border-soft)',
  borderRadius: 8, outline: 'none', color: 'var(--text-hi)', fontSize: 13,
  padding: '7px 10px', width: '100%', fontFamily: 'inherit',
};

const brandColor = () =>
  getComputedStyle(document.documentElement).getPropertyValue('--rasf-primary').trim() || '#CEB69F';

// ── اللوحة الرقمية (بطاقات + دائري + خط زمني) ──────────────────────────────
export function ContractDash({ dash, brandPrimary }) {
  const hasSplit    = !!dash.split?.parts?.length;
  const hasTimeline = !!dash.timeline?.length;
  const maxMonths   = Math.max(...(dash.timeline ?? []).map(t => t.months ?? 0), 1);
  const doughnutData = hasSplit && {
    labels: dash.split.parts.map(p => p.label),
    datasets: [{ data: dash.split.parts.map(p => p.value), backgroundColor: [brandPrimary, BRAND_SECONDARY], borderWidth: 0 }],
  };
  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.label}: ${c.raw}%` } } },
  };

  return (
    <>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${dash.kpis.length}, 1fr)` }}>
        {dash.kpis.map(k => (
          <div key={k.label} className="kpi flex flex-col gap-1">
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{k.label}</div>
            <div className="text-lg font-bold" style={{ color: 'var(--rasf-primary)' }}>{k.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {(hasSplit || hasTimeline) && (
      <div className="grid gap-3" style={{ gridTemplateColumns: hasSplit && hasTimeline ? '1fr 1.6fr' : '1fr' }}>
        {hasSplit && (
        <div className="glass rounded-2xl p-4">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 10 }}>{dash.split.title}</div>
          <div style={{ position: 'relative', height: 130 }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
          <div className="flex flex-col gap-1.5 mt-3">
            {dash.split.parts.map((p, i) => (
              <div key={p.label} className="flex items-center justify-between" style={{ fontSize: 11 }}>
                <span className="flex items-center gap-1.5" style={{ color: 'var(--text-lo)' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: i === 0 ? brandPrimary : BRAND_SECONDARY, display: 'inline-block' }} />
                  {p.label}
                </span>
                <span style={{ color: 'var(--text-hi)', fontWeight: 700 }}>{p.value}%</span>
              </div>
            ))}
          </div>
        </div>
        )}

        {hasTimeline && (
        <div className="glass rounded-2xl p-4">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 12 }}>الجدول الزمني (المدد)</div>
          <div className="flex flex-col gap-3">
            {dash.timeline.map(t => (
              <div key={t.label}>
                <div className="flex items-center justify-between mb-1" style={{ fontSize: 12 }}>
                  <span style={{ color: 'var(--text-lo)', fontWeight: 600 }}>{t.label}</span>
                  <span style={{ color: 'var(--rasf-primary)', fontWeight: 700 }}>{t.months != null ? `${t.months} شهر` : ''}</span>
                </div>
                {t.months != null && (
                  <div style={{ height: 6, background: 'var(--glass-line)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(t.months / maxMonths) * 100}%`, borderRadius: 4, background: `linear-gradient(90deg, ${brandPrimary}, ${BRAND_SECONDARY})` }} />
                  </div>
                )}
                <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 3 }}>{t.note}</div>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>
      )}

      {dash.condition && (
        <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'var(--rasf-primary-dim)', border: '1px solid var(--border-tag-warm)' }}>
          <Award size={18} style={{ color: 'var(--rasf-primary)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13, color: 'var(--text-lo)', lineHeight: 1.7 }}>
            <span style={{ fontWeight: 700, color: 'var(--rasf-primary)' }}>شرط حسن الأداء: </span>
            {dash.condition}
          </div>
        </div>
      )}
    </>
  );
}

// ── نموذج تحرير ملخص العقد — يُستخدم في تبويب المشروع وصفحة العقود ─────────────
export function ContractEditForm({ initial, withName = false, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...BLANK, ...(initial ?? {}) });
  const set = (k, v) => setDraft(prev => ({ ...prev, [k]: v }));
  const submit = () => {
    if (withName && !String(draft.name ?? '').trim()) return;
    onSave(draft);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="glass rounded-2xl p-4">
        <div className="section-hd mb-3">بيانات الاتفاقية</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {withName && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>اسم المشروع / العقد *</label>
              <input style={inputStyle} value={draft.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="مثال: مشروع سابق — عقد المقاولة" autoFocus />
            </div>
          )}
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>مدير الصندوق / الجهة</label>
            <input style={inputStyle} value={draft.fundManager} onChange={e => set('fundManager', e.target.value)} placeholder="مثال: سدكو كابيتال" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>الإدارة المسؤولة عن المهمة</label>
            <input style={inputStyle} value={draft.responsibleMgmt} onChange={e => set('responsibleMgmt', e.target.value)} placeholder="مثال: إدارة التطوير" />
          </div>
        </div>
      </div>

      {SECTIONS.map(sec => (
        <div key={sec.key} className="glass rounded-2xl p-4">
          <label className="flex items-center gap-2 mb-2" style={{ fontSize: 13, fontWeight: 700, color: 'var(--rasf-primary)' }}>
            <sec.icon size={15} /> {sec.label}
          </label>
          <textarea
            style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
            value={draft[sec.key]}
            onChange={e => set(sec.key, e.target.value)}
            placeholder="بند في كل سطر…"
          />
        </div>
      ))}

      <div className="flex gap-2">
        <button onClick={submit} className="text-xs font-bold px-5 py-2 rounded-lg"
          style={{ background: 'var(--rasf-primary)', color: 'var(--bg-app)', border: 'none', cursor: 'pointer' }}>حفظ</button>
        <button onClick={onCancel} className="text-xs px-5 py-2 rounded-lg glass" style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>إلغاء</button>
      </div>
    </div>
  );
}

// ── عرض ملخص العقد (للقراءة) — يُستخدم في تبويب المشروع وصفحة العقود ──────────
export function ContractSummaryView({ summary }) {
  const brandPrimary = brandColor();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {(summary.fundManager || summary.responsibleMgmt) && (
        <div className="glass rounded-2xl p-4 flex flex-wrap gap-6" style={{ fontSize: 13 }}>
          {summary.fundManager && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Landmark size={15} style={{ color: 'var(--rasf-primary)' }} />
              <span style={{ color: 'var(--text-muted)' }}>مدير الصندوق:</span>
              <span style={{ color: 'var(--text-hi)', fontWeight: 600 }}>{summary.fundManager}</span>
            </div>
          )}
          {summary.responsibleMgmt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={15} style={{ color: 'var(--rasf-primary)' }} />
              <span style={{ color: 'var(--text-muted)' }}>الإدارة المسؤولة:</span>
              <span style={{ color: 'var(--text-hi)', fontWeight: 600 }}>{summary.responsibleMgmt}</span>
            </div>
          )}
        </div>
      )}

      {summary.dash && <ContractDash dash={summary.dash} brandPrimary={brandPrimary} />}

      {SECTIONS.filter(sec => lines(summary[sec.key]).length).map(sec => (
        <div key={sec.key} className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--rasf-primary)' }}>
            <sec.icon size={16} />
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-hi)' }}>{sec.label}</span>
          </div>
          {sec.ordered ? (
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lines(summary[sec.key]).map((line, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--text-lo)', lineHeight: 1.7 }}>
                  <span style={{ flexShrink: 0, minWidth: 22, height: 22, borderRadius: 6, background: 'var(--rasf-primary-dim)', border: '1px solid var(--border-tag-warm)', color: 'var(--rasf-primary)', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          ) : (
            <ul style={{ paddingInlineStart: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {lines(summary[sec.key]).map((line, i) => (
                <li key={i} style={{ fontSize: 13, color: 'var(--text-lo)', listStyle: 'disc', lineHeight: 1.7 }}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
