import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { useApp } from '../../contexts/useApp';
import { isValidLatLng } from '../../utils/geo';

const STATUS_COLORS = {
  pipeline:  '#3b82f6',
  planning:  '#3b82f6',
  financing: '#f59e0b',
  active:    '#10b981',
  completed: '#8b5cf6',
};

const STATUS_LABELS = {
  pipeline:  'تحت الدراسة',
  financing: 'قيد التمويل',
  active:    'قائم',
  completed: 'مكتمل',
};

// أيقونة مبنى بيضاء (lucide building-2)
const BUILDING_SVG =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>' +
  '<path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>' +
  '<path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>' +
  '<path d="M10 6h4M10 10h4M10 14h4M10 18h4"/></svg>';

// أيقونة دبوس موقع (تفتح قوقل ماب) — بلون قوقل الأزرق
const MAPS_PIN_SVG =
  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M20 10c0 4.4-8 12-8 12s-8-7.6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';

// دبوس دائري بأيقونة مبنى + مؤشّر سفلي، ملوّن حسب الحالة
function pinIcon(color) {
  return L.divIcon({
    className: 'rasf-pin',
    html:
      `<div style="position:relative;width:30px;height:38px">` +
        `<div style="width:30px;height:30px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center">${BUILDING_SVG}</div>` +
        `<div style="position:absolute;left:50%;bottom:1px;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:9px solid ${color}"></div>` +
      `</div>`,
    iconSize: [30, 38], iconAnchor: [15, 38], popupAnchor: [0, -34],
  });
}

// عنقود يعرض عدد المشاريع المتجمّعة (عند التصغير)
function clusterIcon(cluster) {
  const count = cluster.getChildCount();
  const size  = count < 10 ? 40 : count < 100 ? 46 : 52;
  return L.divIcon({
    className: 'rasf-cluster',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:rgba(164,144,126,0.94);border:3px solid #fff;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;box-shadow:0 2px 7px rgba(0,0,0,.4)">${count}</div>`,
    iconSize: [size, size],
  });
}

export default function MapPage() {
  const { portfolioService, setSelectedProjectId, setPage } = useApp();
  const containerRef = useRef(null);
  const mapRef       = useRef(null);

  // القائمة + تحت الدراسة (الاثنان يستثنيان المؤرشفة)
  const all      = [...portfolioService.getAllProjects(), ...portfolioService.getPipelineProjects()];
  const located  = all.filter(p => isValidLatLng(p.lat, p.lng));
  const missing  = all.length - located.length;
  const sig      = located.map(p => `${p.id}:${p.lat},${p.lng}:${p.status}`).join('|');

  // إنشاء الخريطة مرة واحدة
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: [24.7136, 46.6753], zoom: 6 });
    // CARTO Voyager — طبقة فاتحة نظيفة بألوان لطيفة (مجانية، بدون مفتاح)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO', subdomains: 'abcd', maxZoom: 20,
    }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // رسم/تحديث الدبابيس عند تغيّر المشاريع
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 55,
      iconCreateFunction: clusterIcon,
    }).addTo(map);
    const bounds = [];
    located.forEach(p => {
      const color  = STATUS_COLORS[p.status] ?? '#6b7280';
      const marker = L.marker([p.lat, p.lng], { icon: pinIcon(color) }).addTo(cluster);
      const mapsHref = p.mapUrl || `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
      marker.bindPopup(
        `<div style="min-width:170px;font-family:inherit;text-align:right">
           <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:2px">
             <a href="${mapsHref}" target="_blank" rel="noopener" title="فتح الموقع في قوقل ماب"
                style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:7px;background:#eef2f7;text-decoration:none;flex-shrink:0">${MAPS_PIN_SVG}</a>
             <div style="font-weight:800;color:#1a1a1a">${p.name}</div>
           </div>
           <div style="font-size:11px;color:#666">${p.location ?? ''} · ${STATUS_LABELS[p.status] ?? ''}</div>
           <div style="font-size:11px;color:#333;margin-top:5px">ROE ${p.roeAnnual ?? '—'}% · IRR ${p.irr ?? '—'}%</div>
           <button id="rasf-open-${p.id}" style="margin-top:8px;width:100%;background:#A4907E;color:#fff;border:none;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer">فتح المشروع</button>
         </div>`
      );
      marker.on('popupopen', () => {
        const btn = document.getElementById(`rasf-open-${p.id}`);
        if (btn) btn.onclick = () => { setSelectedProjectId(p.id); setPage('project'); };
      });
      bounds.push([p.lat, p.lng]);
    });
    if (bounds.length) map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
    setTimeout(() => map.invalidateSize(), 0); // ضبط الحجم بعد ظهور الحاوية
    return () => { if (mapRef.current) mapRef.current.removeLayer(cluster); };
  }, [sig]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="section-hd">خريطة المشاريع</div>
          <div className="section-sub">
            {located.length} مشروع على الخريطة
            {missing > 0 && ` · ${missing} بدون موقع (أضف رابط قوقل ماب من تعديل المشروع)`}
          </div>
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLORS[key] }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        style={{ height: 'calc(100vh - 190px)', minHeight: 420, width: '100%', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', zIndex: 0 }}
      />

      {located.length === 0 && (
        <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--text-faint)', fontSize: 13 }}>
          لا توجد مشاريع بموقع محدّد بعد — افتح أي مشروع ← تعديل ← ألصق رابط قوقل ماب.
        </div>
      )}
    </div>
  );
}
