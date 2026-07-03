import { parseStudyFile } from './studyParser';

// ─── SHARED STUDY → PROJECT MAPPING ───────────────────────────────────────────
// Single source of truth for turning parseStudyFile() output into a project
// update payload — used by BOTH the in-project Files tab and the global Files
// repository, so uploading a financial study reflects the same numbers everywhere.

export function buildProjectUpdateFromStudy(ex, project) {
  const inv = ex.investmentM ?? 0;
  const compBreakdown = ex.componentBreakdown
    ? Object.entries(ex.componentBreakdown).map(([key, data]) => ({ key, ...data }))
    : project.componentBreakdown ?? [];

  return {
    location:        ex.location      || project.location,
    deliveryDate:    ex.deliveryDate  || project.deliveryDate,
    investmentM:     inv || project.investmentM,
    totalInvestment: inv >= 1000 ? `${(inv / 1000).toFixed(1)}B` : inv > 0 ? `${inv}M` : project.totalInvestment,
    irr:             ex.irr           ?? project.irr,
    roi:             ex.roi           ?? project.roi,
    roeAnnual:       ex.roeAnnual     ?? project.roeAnnual,
    area:            ex.area          || project.area,
    farValue:        ex.farValue      ?? project.farValue,
    aboveGradeGBA:   ex.aboveGradeGBA || project.aboveGradeGBA,
    belowGradeGBA:   ex.belowGradeGBA || project.belowGradeGBA,
    totalGBA:        ex.totalGBA      || project.totalGBA,
    nsaArea:         ex.nsaArea       || project.nsaArea,
    units:           ex.units         ?? project.units,
    avgUnitPrice:    ex.avgUnitPrice  ?? project.avgUnitPrice,
    moic:            ex.moic ? `${ex.moic}x` : project.moic,
    paybackYears:    ex.paybackYears  ?? project.paybackYears,
    componentBreakdown: compBreakdown,
    revenueBreakdown:   ex.revenueBreakdown ?? project.revenueBreakdown ?? null,
    costs: {
      totalRevenue:        ex.totalRevenue        ?? project.costs?.totalRevenue        ?? 0,
      netProfit:           ex.netProfit           ?? project.costs?.netProfit           ?? 0,
      landCost:            ex.landCost            ?? project.costs?.landCost            ?? 0,
      constructionCost:    ex.constructionCost    ?? project.costs?.constructionCost    ?? 0,
      finishingCost:       ex.finishingCost       ?? project.costs?.finishingCost       ?? 0,
      financingCost:       ex.financingCost       ?? project.costs?.financingCost       ?? 0,
      otherCost:           ex.otherCost           ?? project.costs?.otherCost           ?? 0,
      developerCost:       ex.developerFee        ?? project.costs?.developerCost       ?? 0,
      fundCost:            ex.fundFees            ?? project.costs?.fundCost            ?? 0,
      totalCost:           ex.totalCost           ?? (inv || (project.costs?.totalCost  ?? 0)),
      operationalCost:     ex.operationalCost     ?? project.costs?.operationalCost     ?? 0,
      directSalesRevenue:  ex.directSalesRevenue  ?? project.costs?.directSalesRevenue  ?? 0,
      annualRentalRevenue: ex.annualRentalRevenue ?? project.costs?.annualRentalRevenue ?? 0,
      dailyRentalRevenue:  ex.dailyRentalRevenue  ?? project.costs?.dailyRentalRevenue  ?? 0,
      offplanRevenue:      ex.offplanRevenue      ?? project.costs?.offplanRevenue      ?? 0,
      exitValue:           ex.exitValue           ?? project.costs?.exitValue           ?? 0,
    },
  };
}

export function isStudyFile(name = '') {
  return /\.(xlsx|xls|xlsm|xlsb)$/i.test(name);
}

// Parse a financial study file and apply the extracted numbers to a project.
// Returns { success, data } — caller is responsible for refreshPortfolio().
export async function applyStudyFileToProject(file, project, portfolioService) {
  const ex = await parseStudyFile(file);
  if (!ex || Object.keys(ex).length === 0) return { success: false };
  portfolioService.updateProject(project.id, buildProjectUpdateFromStudy(ex, project));
  return { success: true, data: ex };
}
