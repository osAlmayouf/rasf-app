// RASF brand palette for charts — ordered lightest → darkest
// Assign by segment size: largest segment gets lightest color
export const RASF_CHART_COLORS = ['#CEB69F', '#A08070', '#6B4E3D', '#473530', '#211E1B'];

// Donut center fill plugin — paints the cutout with the app background
export const donutCenterPlugin = {
  id: 'rasf-donut-center',
  beforeDraw(chart) {
    if (chart.config.type !== 'doughnut') return;
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    if (!meta?.data?.length) return;
    const innerRadius = meta.data[0]?.innerRadius ?? 0;
    if (!innerRadius) return;
    const { x, y } = meta.data[0];
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#0D0D0D';
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.restore();
  },
};
