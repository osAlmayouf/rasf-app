export default function RasfLogo({ width = 176 }) {
  const h = 72;
  // building icon occupies right 68×68, text occupies left portion
  const bW = 68, bX = width - bW;

  return (
    <svg
      width={width} height={h}
      viewBox={`0 0 ${width} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* ── Building icon (right) ───────────────────────── */}
      <rect x={bX} y="2" width={bW} height={bW} rx="7" fill="#C9B49A"/>
      {/* Floor bands — parallelograms, wider at top */}
      <polygon points={`${bX+2},14  ${bX+bW-2},10  ${bX+bW-2},16  ${bX+2},20`}  fill="white" fillOpacity="0.90"/>
      <polygon points={`${bX+5},24  ${bX+bW-2},20  ${bX+bW-2},26  ${bX+5},30`}  fill="white" fillOpacity="0.90"/>
      <polygon points={`${bX+11},34 ${bX+bW-2},30  ${bX+bW-2},36  ${bX+11},40`} fill="white" fillOpacity="0.90"/>
      <polygon points={`${bX+19},44 ${bX+bW-2},40  ${bX+bW-2},46  ${bX+19},50`} fill="white" fillOpacity="0.90"/>

      {/* ── Arabic رصف (right-anchored to building edge) ── */}
      <text
        x={bX - 8} y="48"
        fontFamily="Tajawal, sans-serif"
        fontSize="44" fontWeight="900"
        fill="var(--text-hi)"
        textAnchor="end"
        dominantBaseline="auto"
      >رصف</text>

      {/* ── Diamond accent ◆ (above Arabic text) ─────── */}
      <text
        x={bX - 8} y="14"
        fontFamily="Tajawal, sans-serif"
        fontSize="10" fontWeight="700"
        fill="var(--rasf-primary)"
        textAnchor="end"
      >◆</text>

      {/* ── RASF English (left-aligned, below Arabic) ─── */}
      <text
        x="4" y="66"
        fontFamily="Inter, sans-serif"
        fontSize="11" fontWeight="800"
        fill="var(--rasf-primary)"
        letterSpacing="3"
        textAnchor="start"
      >RASF</text>
    </svg>
  );
}
