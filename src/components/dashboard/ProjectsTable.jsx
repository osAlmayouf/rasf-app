import { useState } from 'react';
import { useApp } from '../../contexts/useApp';
import { fmtPct, fmtMonthYear } from '../../utils/fmt';
import Tag from '../common/Tag';
import ProgressBar from '../common/ProgressBar';

const TYPE_LABEL_MAP = {
  residential: 'typeRes', commercial: 'typeCom', industrial: 'typeInd', infrastructure: 'typeInfra',
  luxury_residential: 'typeCom', mixed: 'typeCom', hotel: 'typeCom',
};

// أسماء مراحل خط سير المشروع (lc1n…lc5n)
const LC_KEYS = ['lc1n', 'lc2n', 'lc3n', 'lc4n', 'lc5n'];

// القيم الافتراضية بحسب الحالة (نفس منطق ProjectLifecycle)
const STATUS_DEFAULT_COMPLETED = { planning: 1, financing: 2, active: 3, completed: 5 };

// يقرأ المرحلة الحالية من localStorage (نفس المفتاح المستخدم في ProjectLifecycle)
function getLifecyclePhaseKey(projectId, status) {
  let completed = STATUS_DEFAULT_COMPLETED[status] ?? 0;
  try {
    const stored = localStorage.getItem(`lifecycle_completed_${projectId}`);
    if (stored !== null) completed = Number(stored);
  } catch {}
  if (completed >= 5) return 'lc5n';
  return LC_KEYS[completed] ?? 'lc1n';
}

// لون المرحلة
const LC_VARIANT = ['blue', 'blue', 'amber', 'green', 'purple'];

const SORT_OPTIONS = [
  { key: 'opportunityDate', label: 'تاريخ الفرصة' },
  { key: 'lastUpdated',     label: 'آخر تحديث'    },
  { key: 'progress',        label: 'نسبة الإنجاز'  },
];

function SortToggle({ active, dir, label, onClick }) {
  const isActive = active;
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
        cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
        background: isActive ? 'var(--rasf-primary-dim)' : 'transparent',
        border: `1px solid ${isActive ? 'var(--rasf-primary)' : 'var(--border-mid)'}`,
        color: isActive ? 'var(--rasf-primary)' : 'var(--text-muted)',
      }}
    >
      {label}
      <span style={{ fontSize: 9, opacity: isActive ? 1 : 0.4 }}>
        {isActive ? (dir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  );
}

export default function ProjectsTable({ extraProjects = [] }) {
  const { t, setPage, setSelectedProjectId, portfolioService } = useApp();
  const [sortKey, setSortKey] = useState('opportunityDate');
  const [sortDir, setSortDir] = useState('asc');

  function handleSort(key) {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const projects = [...portfolioService.getAllProjects(), ...extraProjects].sort((a, b) => {
    let va, vb;
    if (sortKey === 'opportunityDate') {
      va = a.opportunityDate ?? '9999-99-99';
      vb = b.opportunityDate ?? '9999-99-99';
    } else if (sortKey === 'lastUpdated') {
      va = a.lastUpdated ?? '0000-00-00';
      vb = b.lastUpdated ?? '0000-00-00';
    } else {
      va = a.progress ?? 0;
      vb = b.progress ?? 0;
    }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <div className="section-hd">{t('dTblT')}</div>
          <div className="section-sub">{t('dTblS')}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {SORT_OPTIONS.map(opt => (
            <SortToggle
              key={opt.key}
              label={opt.label}
              active={sortKey === opt.key}
              dir={sortDir}
              onClick={() => handleSort(opt.key)}
            />
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--bg-card-strong)' }}>
              <th className="text-right px-4 py-3"
                style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.6px', width: 40 }}>
                #
              </th>
              <th className="text-right px-6 py-3"
                style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                {t('th1')}
              </th>
              <th className="text-right px-6 py-3"
                style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.6px' }}>
                تاريخ الفرصة
              </th>
              {['ROI', 'IRR', 'ROE'].map(k => (
                <th key={k} className="text-right px-6 py-3"
                  style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.6px' }}>
                  {k}
                </th>
              ))}
              <th className="text-right px-6 py-3"
                style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                {t('th3')}
              </th>
              <th className="text-right px-6 py-3"
                style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                {t('th4')}
              </th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {projects.map((p, idx) => (
              <tr
                key={p.id}
                className="border-t"
                style={{ borderColor: 'var(--border)', background: idx % 2 === 0 ? 'var(--bg-row-a)' : 'var(--bg-row-b)' }}
              >
                <td className="px-4 py-4">
                  <div
                    style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'var(--bg-tag-warm)', border: '1px solid var(--border-tag-warm)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: 'var(--rasf-primary)',
                    }}
                  >
                    {idx + 1}
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div style={{ fontWeight: 700, color: 'var(--text-hi)', fontSize: 13 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{p.location}</div>
                  {p.type && (
                    <div style={{ marginTop: 5 }}>
                      <Tag variant="purple">{t(TYPE_LABEL_MAP[p.type] ?? 'typeCom')}</Tag>
                    </div>
                  )}
                  {p.lastUpdated && (
                    <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>آخر تحديث:</span>
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{fmtMonthYear(p.lastUpdated)}</span>
                    </div>
                  )}
                </td>

                <td className="px-6 py-4" style={{ fontSize: 12, color: 'var(--text-lo)', whiteSpace: 'nowrap' }}>
                  {fmtMonthYear(p.opportunityDate)}
                </td>

                <td className="px-6 py-4" style={{ fontWeight: 800, color: 'var(--rasf-primary)', fontSize: 14 }}>{fmtPct(p.roi)}</td>
                <td className="px-6 py-4" style={{ fontWeight: 700, color: 'var(--text-hi)', fontSize: 13 }}>{fmtPct(p.irr)}</td>
                <td className="px-6 py-4" style={{ fontWeight: 600, color: 'var(--text-lo)', fontSize: 13 }}>{fmtPct(p.roeAnnual)}</td>

                <td className="px-6 py-4">
                  <ProgressBar value={p.progress} width="w-20" showLabel />
                </td>

                <td className="px-6 py-4">
                  {(() => {
                    const phaseKey = getLifecyclePhaseKey(p.id, p.status);
                    const phaseIdx = LC_KEYS.indexOf(phaseKey);
                    return (
                      <Tag variant={LC_VARIANT[phaseIdx] ?? 'blue'}>
                        {t(phaseKey)}
                      </Tag>
                    );
                  })()}
                </td>

                <td className="px-6 py-4">
                  <button
                    onClick={() => { setSelectedProjectId(p.id); setPage('project'); }}
                    style={{
                      background: 'transparent', border: '1px solid var(--border-mid)', color: 'var(--text-muted)',
                      borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--rasf-primary)'; e.currentTarget.style.color = 'var(--rasf-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-mid)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    فتح
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
