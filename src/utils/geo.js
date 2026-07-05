// ─── استخراج الإحداثيات من رابط قوقل ماب أو نص "lat,lng" ────────────────────
// يدعم الأنماط الشائعة للروابط الكاملة:
//   .../@24.71,46.67,15z   ·   ?q=24.71,46.67   ·   /place/24.71,46.67
//   !3d24.71!4d46.67 (بارامتر البيانات)   ·   نص خام "24.71, 46.67"
// لا يدعم الروابط المختصرة (maps.app.goo.gl / goo.gl) لأنها تحتاج فك تحويل من خادم.

const LAT = '(-?\\d{1,2}(?:\\.\\d+)?)';
const LNG = '(-?\\d{1,3}(?:\\.\\d+)?)';

const PATTERNS = [
  new RegExp(`!3d${LAT}!4d${LNG}`),                                   // مرساة الدبوس الدقيقة
  new RegExp(`@${LAT},${LNG}`),                                       // مركز الخريطة
  new RegExp(`[?&](?:q|query|ll|center|destination|sll)=${LAT},\\s*${LNG}`),
  new RegExp(`/place/${LAT},${LNG}`),
  new RegExp(`^\\s*${LAT},\\s*${LNG}\\s*$`),                          // نص خام
];

export function isValidLatLng(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng)
    && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
    && !(lat === 0 && lng === 0);
}

// يرجع { lat, lng } أو null
export function parseLatLng(input) {
  if (!input || typeof input !== 'string') return null;
  for (const re of PATTERNS) {
    const m = input.match(re);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      if (isValidLatLng(lat, lng)) return { lat, lng };
    }
  }
  return null;
}

// رابط قوقل ماب مختصر (ما نقدر نفكّه من المتصفح)
export function isShortMapLink(input) {
  return /(?:maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(input ?? '');
}
