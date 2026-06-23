import { Doughnut } from 'react-chartjs-2';
import { useApp } from '../../../contexts/useApp';
import { fmtPct } from '../../../utils/fmt';
import { addUnit } from '../../../utils/fmtMode';
import GlassCard from '../../common/GlassCard';
import SARSymbol from '../../common/SARSymbol';
import SARNum from '../../common/SARNum';
import { Building2, Home, Rows3, Bed, ShoppingBag, Briefcase, BedDouble, HeartPulse, BarChart2, Tag, CheckCircle2, Car, Layers, Waves, Dumbbell, Leaf, TreePine, SquareParking } from 'lucide-react';

// ─── Component type definitions ───────────────────────────────────────────────
const COMP_TYPES = [
  { key: 'residential', nameAr: 'سكني',       nameEn: 'Residential', icon: <Building2 size={18} />, color: '#4f8ef7' },
  { key: 'villas',      nameAr: 'فلل',         nameEn: 'Villas',      icon: <Home size={18} />,      color: '#06b6d4' },
  { key: 'townhouse',   nameAr: 'تاون هاوس',   nameEn: 'Townhouse',   icon: <Rows3 size={18} />,     color: '#22d3ee' },
  { key: 'studios',     nameAr: 'أستوديوهات',  nameEn: 'Studios',     icon: <Bed size={18} />,       color: '#a78bfa' },
  { key: 'commercial',  nameAr: 'تجاري',        nameEn: 'Commercial',  icon: <ShoppingBag size={18} />, color: '#8b5cf6' },
  { key: 'office',      nameAr: 'مكتبي',        nameEn: 'Office',      icon: <Briefcase size={18} />, color: '#10b981' },
  { key: 'hotel',       nameAr: 'فندقي',        nameEn: 'Hotel',       icon: <BedDouble size={18} />, color: '#A4907E' },
  { key: 'medical',     nameAr: 'صحي',          nameEn: 'Medical',     icon: <HeartPulse size={18} />, color: '#fb923c' },
];

const DOUGHNUT_OPTIONS = {
  responsive: true, maintainAspectRatio: false, cutout: '65%',
  plugins: { legend: { display: false } },
};

// ─── Formatters ───────────────────────────────────────────────────────────────
function fmtNum(n)   { return (n && n > 0) ? Number(n).toLocaleString('ar-SA') : '—'; }
function fmtArea(n)  {
  if (!n) return '—';
  if (typeof n === 'string') return n;
  return `${Math.round(n).toLocaleString()} م²`;
}
function fmtSar(n) {
  if (!n || n === 0) return '—';
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>{Number(n).toLocaleString()} <SARSymbol size="0.85em" />/م²</span>;
}

// ─── Single component card ─────────────────────────────────────────────────────
function ComponentCard({ type, data }) {
  const { displayMode, lang } = useApp();
  const isEmpty = !data || (
    !data.unitCount && !data.gba && !data.area && !data.nsa && !data.unitSize
  );

  const color    = data?.color || type.color;
  const unitCount = data?.unitCount || 0;
  const unitSize  = data?.unitSize  || 0;
  const gba       = data?.gba   || data?.area || 0;
  const nsa       = data?.nsa   || 0;
  const totalCost = data?.totalCost || 0;
  const costPerSqm = data?.costPerSqm || 0;
  const parkingCount = data?.parkingCount || 0;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: isEmpty ? 'var(--bg-subtle)' : 'var(--bg-card-strong)',
        border: isEmpty
          ? '1px solid var(--border-faint)'
          : `1px solid ${color}30`,
        transition: 'all 0.2s',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 pb-3"
        style={{ borderBottom: '1px solid var(--border-faint)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: isEmpty ? 'var(--bg-subtle)' : `${color}20`, color: isEmpty ? 'var(--text-faint)' : color }}
        >
          {type.icon}
        </div>
        <div className="flex-1">
          <div
            className="font-semibold"
            style={{ fontSize: 13, color: isEmpty ? 'var(--text-muted)' : 'var(--text-hi)' }}
          >
            {type.nameAr}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{type.nameEn}</div>
        </div>
        {data?.pct > 0 && (
          <div className="text-xs font-bold" style={{ color }}>{fmtPct(data.pct)}</div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-2" style={{ fontSize: 12 }}>
        {isEmpty ? (
          <div className="text-center py-3" style={{ color: 'var(--text-faint)', fontSize: 11 }}>
            لا توجد بيانات
          </div>
        ) : (
          <>
            {/* Units row */}
            <Row label="عدد الوحدات"
              value={unitCount > 0 ? `${fmtNum(unitCount)} وحدة` : '—'}
              bold={unitCount > 0}
              color={unitCount > 0 ? 'var(--text-hi)' : 'var(--text-muted)'}
            />
            <Row label="متوسط مساحة الوحدة"
              value={unitSize > 0 ? `${unitSize} م²` : '—'}
              color={unitSize > 0 ? 'var(--text-med)' : 'var(--text-muted)'}
            />

            {/* Areas */}
            <div style={{ borderTop: '1px solid var(--border-faint)', paddingTop: 8, marginTop: 4 }}>
              <Row label="إجمالي GBA" value={fmtArea(gba)} color="var(--text-hi)" />
              <Row label="صافي NSA"    value={fmtArea(nsa)} color="var(--text-hi)" />
            </div>

            {/* Cost */}
            {(costPerSqm > 0 || totalCost > 0) && (
              <div style={{ borderTop: '1px solid var(--border-faint)', paddingTop: 8, marginTop: 4 }}>
                {costPerSqm > 0 && (
                  <Row label="تكلفة المتر" value={fmtSar(costPerSqm)} color="var(--text-muted)" />
                )}
                {totalCost > 0 && (
                  <Row
                    label={addUnit('إجمالي التكاليف', displayMode, lang)}
                    value={<SARNum millions={totalCost} />}
                    color={color} bold
                  />
                )}
              </div>
            )}

            {/* Parking */}
            {parkingCount > 0 && (
              <div style={{ borderTop: '1px solid var(--border-faint)', paddingTop: 8, marginTop: 4 }}>
                <Row label="المواقف" value={`${fmtNum(parkingCount)} موقف`} color="var(--text-muted)" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, color = 'var(--text-hi)', bold = false }) {
  return (
    <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{label}</span>
      <span style={{ color, fontWeight: bold ? 600 : 400, fontSize: 12 }}>{value}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ProjectComponents({ project }) {
  const { t } = useApp();
  const rawBreakdown = project.componentBreakdown ?? [];

  // Build a lookup map: key → data
  const dataByKey = {};
  for (const item of rawBreakdown) {
    if (item.key) {
      dataByKey[item.key] = item;
    } else if (item.labelKey) {
      // Legacy seed format — map old labelKeys to new keys
      const legacyMap = {
        compRes: 'residential', compOfc: 'office',
        compRet: 'commercial',  compHtl: 'hotel', compHlth: 'medical',
      };
      const mapped = legacyMap[item.labelKey];
      if (mapped) dataByKey[mapped] = { ...item, key: mapped };
    }
  }

  // Chart data (use items that have area / gba)
  const chartItems = rawBreakdown.filter(b => (b.area || b.gba || 0) > 0 && (b.pct || 0) > 0);
  const chartData = {
    labels: chartItems.map(b => {
      const type = COMP_TYPES.find(t => t.key === (b.key || Object.entries({ compRes: 'residential', compOfc: 'office', compRet: 'commercial', compHtl: 'hotel', compHlth: 'medical' }).find(([k]) => k === b.labelKey)?.[1]));
      return b.nameAr || type?.nameAr || b.labelKey || b.key;
    }),
    datasets: [{
      data: chartItems.map(b => b.pct || 0),
      backgroundColor: chartItems.map(b => {
        const typeKey = b.key || Object.entries({ compRes: 'residential', compOfc: 'office', compRet: 'commercial', compHtl: 'hotel', compHlth: 'medical' }).find(([k]) => k === b.labelKey)?.[1];
        const type = COMP_TYPES.find(t => t.key === typeKey);
        return b.color || type?.color || '#7A6E67';
      }),
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  // Parking / basement
  const amenities    = project.components?.amenities ?? {};
  const totalParking = amenities.parking || 0;
  const basementArea = project.belowGradeGBA || '';
  const hasParking   = totalParking > 0 || !!basementArea;

  return (
    <div className="space-y-4">

      {/* ── Top row: Chart + Area summary ─────────────────────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: chartItems.length > 0 ? '260px 1fr' : '1fr' }}>

        {/* GBA doughnut chart */}
        {chartItems.length > 0 && (
          <GlassCard>
            <div className="section-hd mb-4">{t('compChT')}</div>
            <div style={{ position: 'relative', height: 180 }}>
              <Doughnut data={chartData} options={DOUGHNUT_OPTIONS} />
            </div>
            <div className="space-y-2 mt-4" style={{ fontSize: 11 }}>
              {chartItems.map((b, i) => {
                const typeKey = b.key || Object.entries({ compRes: 'residential', compOfc: 'office', compRet: 'commercial', compHtl: 'hotel', compHlth: 'medical' }).find(([k]) => k === b.labelKey)?.[1];
                const type = COMP_TYPES.find(t => t.key === typeKey);
                const color = b.color || type?.color || 'var(--text-muted)';
                const name  = b.nameAr || type?.nameAr || b.labelKey || b.key;
                const area  = b.gba || b.area || 0;
                return (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full flex-shrink-0"
                        style={{ width: 8, height: 8, background: color, display: 'inline-block' }} />
                      <span style={{ color: 'var(--text-med)' }}>{name}</span>
                    </div>
                    <div className="flex gap-3">
                      <span style={{ color, fontWeight: 600 }}>{fmtPct(b.pct)}</span>
                      {area > 0 && <span style={{ color: 'var(--text-muted)' }}>{area.toLocaleString()} م²</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        )}

        {/* Summary stats */}
        <GlassCard>
          <div className="section-hd mb-4">ملخص المكونات</div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'إجمالي الوحدات',    value: fmtNum(project.units),    icon: <Home size={16} /> },
              { label: 'الوحدات المباعة',   value: fmtNum(project.unitsSold), icon: <CheckCircle2 size={16} /> },
              { label: 'صافي NSA',           value: project.nsaArea  || '—',  icon: <Tag size={16} /> },
              { label: 'معامل البناء FAR',  value: project.farValue ? `${project.farValue}x` : '—', icon: <BarChart2 size={16} /> },
            ].map((item, i) => (
              <div key={i} className="glass rounded-xl p-3">
                <div style={{ color: 'var(--rasf-primary)', marginBottom: 4, display: 'flex' }}>{item.icon}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>{item.label}</div>
                <div className="font-semibold" style={{ fontSize: 13, color: 'var(--text-hi)' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* ── Component cards (all 8 types) ─────────────────────────────────── */}
      <div>
        <div className="section-hd mb-4">المكونات التفصيلية</div>
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {COMP_TYPES.map(type => (
            <ComponentCard
              key={type.key}
              type={type}
              data={dataByKey[type.key] ?? null}
            />
          ))}
        </div>
      </div>

      {/* ── Parking & Basement card ────────────────────────────────────────── */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'rgba(100,116,139,0.15)' }}>
            <SquareParking size={22} style={{ color: 'var(--rasf-primary)' }} />
          </div>
          <div>
            <div className="section-hd">المواقف والقبو</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Parking & Basement</div>
          </div>
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>

          {/* Total parking */}
          <StatTile
            icon={<Car size={22} />}
            label="إجمالي المواقف"
            value={totalParking > 0 ? totalParking.toLocaleString() : '—'}
            unit="موقف"
            color="var(--rasf-primary)"
          />

          {/* Basement area */}
          <StatTile
            icon={<Layers size={22} />}
            label="مساحة القبو"
            value={basementArea || project.belowGradeGBA || '—'}
            color="var(--text-muted)"
          />

          {/* Pools */}
          {amenities.pools > 0 && (
            <StatTile icon={<Waves size={22} />} label="مسابح" value={amenities.pools} unit="مسبح" color="#06b6d4" />
          )}

          {/* Sports club */}
          {amenities.gym && amenities.gym !== '—' && (
            <StatTile icon={<Dumbbell size={22} />} label="نادٍ رياضي" value={amenities.gym} color="#10b981" />
          )}

          {/* Green areas */}
          {amenities.green && amenities.green !== '—' && (
            <StatTile icon={<Leaf size={22} />} label="مناطق خضراء" value={amenities.green} color="#10b981" />
          )}

          {/* Landscape */}
          {project.landscapeArea && project.landscapeArea !== '—' && (
            <StatTile icon={<TreePine size={22} />} label="لاند سكيب" value={project.landscapeArea} color="#10b981" />
          )}


        </div>

        {/* Per-component parking breakdown */}
        {rawBreakdown.some(b => (b.parkingCount || 0) > 0) && (
          <div className="mt-4">
            <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>توزيع المواقف حسب المكوّن</div>
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
              {rawBreakdown.filter(b => (b.parkingCount || 0) > 0).map((b, i) => {
                const typeKey = b.key || Object.entries({ compRes: 'residential', compOfc: 'office', compRet: 'commercial', compHtl: 'hotel', compHlth: 'medical' }).find(([k]) => k === b.labelKey)?.[1];
                const type = COMP_TYPES.find(t => t.key === typeKey);
                const color = b.color || type?.color || 'var(--text-muted)';
                const name  = b.nameAr || type?.nameAr || b.key;
                return (
                  <div key={i} className="flex justify-between items-center glass rounded-lg px-3 py-2">
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{name}</span>
                    <span style={{ color, fontWeight: 600, fontSize: 12 }}>{b.parkingCount.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function StatTile({ icon, label, value, unit, color = 'var(--text-hi)' }) {
  return (
    <div className="glass rounded-xl p-4 text-center">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color: 'var(--rasf-primary)' }}>{icon}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div className="font-bold" style={{ color, fontSize: 16, lineHeight: 1.2 }}>{value}</div>
      {unit && <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{unit}</div>}
    </div>
  );
}

