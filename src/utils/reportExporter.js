import * as XLSX from 'xlsx';

export function exportPortfolioReport(portfolioService, lang = 'ar') {
  const projects = portfolioService.getAllProjects();
  const kpis     = portfolioService.getKPIs();
  const now      = new Date();

  const isAr = lang === 'ar';
  const dateStr = now.toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryRows = isAr ? [
    ['محفظة ادارة التطوير — رصف | RASF'],
    ['تاريخ الإصدار', dateStr],
    ['مدير المحفظة', 'عمر المعيوف'],
    [],
    ['مؤشرات المحفظة'],
    ['إجمالي قيمة المحفظة', kpis.totalValue + ' SAR'],
    ['متوسط العائد على الاستثمار (ROI)', kpis.averageROI + '%'],
    ['متوسط معدل العائد الداخلي (IRR)', kpis.averageIRR + '%'],
    ['متوسط العائد على الملكية (ROE)', kpis.averageROEAnnual + '%'],
    ['عدد المشاريع', kpis.projectCount],
  ] : [
    ['Investment Portfolio Report — RASF'],
    ['Issue Date', dateStr],
    ['Portfolio Manager', 'Omar Al-Mayouf'],
    [],
    ['Portfolio KPIs'],
    ['Total Portfolio Value', kpis.totalValue + ' SAR'],
    ['Average ROI', kpis.averageROI + '%'],
    ['Average IRR', kpis.averageIRR + '%'],
    ['Average Annual ROE', kpis.averageROEAnnual + '%'],
    ['Project Count', kpis.projectCount],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 36 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, isAr ? 'ملخص المحفظة' : 'Portfolio Summary');

  // Sheet 2: Projects
  const headers = isAr
    ? ['#', 'اسم المشروع', 'الموقع', 'الاستثمار', 'ROI %', 'IRR %', 'ROE %', 'نسبة الإنجاز', 'الحالة', 'تاريخ التسليم']
    : ['#', 'Project Name', 'Location', 'Investment', 'ROI %', 'IRR %', 'ROE %', 'Progress %', 'Status', 'Delivery Date'];

  const STATUS_AR = { active: 'نشط', financing: 'تمويل', planning: 'تخطيط', completed: 'مكتمل' };
  const STATUS_EN = { active: 'Active', financing: 'Financing', planning: 'Planning', completed: 'Completed' };

  const rows = projects.map((p, i) => [
    i + 1,
    p.name,
    p.location ?? '—',
    p.totalInvestment ?? '—',
    p.roi ?? 0,
    p.irr ?? 0,
    p.roeAnnual ?? 0,
    p.progress ?? 0,
    isAr ? (STATUS_AR[p.status] ?? p.status) : (STATUS_EN[p.status] ?? p.status),
    p.deliveryDate ?? '—',
  ]);

  const wsProjects = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  wsProjects['!cols'] = [
    { wch: 4 }, { wch: 28 }, { wch: 20 }, { wch: 14 },
    { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsProjects, isAr ? 'المشاريع' : 'Projects');

  // Sheet 3: Cost breakdown
  const costHeaders = isAr
    ? ['المشروع', 'إجمالي الإيرادات (م)', 'تكلفة الأرض (م)', 'تكاليف البناء (م)', 'تكاليف التمويل (م)', 'تكاليف أخرى (م)', 'صافي الربح (م)']
    : ['Project', 'Total Revenue (M)', 'Land Cost (M)', 'Construction (M)', 'Financing (M)', 'Other (M)', 'Net Profit (M)'];

  const costRows = projects
    .filter(p => p.costs?.totalRevenue)
    .map(p => [
      p.name,
      p.costs.totalRevenue    || 0,
      p.costs.landCost        || 0,
      p.costs.constructionCost || 0,
      p.costs.financingCost   || 0,
      p.costs.otherCost       || 0,
      parseFloat(((p.costs.totalRevenue || 0) - (p.costs.totalCost || 0)).toFixed(1)),
    ]);

  if (costRows.length > 0) {
    const wsCosts = XLSX.utils.aoa_to_sheet([costHeaders, ...costRows]);
    wsCosts['!cols'] = [{ wch: 28 }, ...Array(6).fill({ wch: 18 })];
    XLSX.utils.book_append_sheet(wb, wsCosts, isAr ? 'التكاليف والإيرادات' : 'Costs & Revenue');
  }

  const filename = `RASF_Portfolio_Report_${now.toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}
