import { Portfolio } from '../models/Portfolio';

export class PortfolioService {
  #portfolio;

  constructor(seedData) {
    this.#portfolio = new Portfolio(seedData);
  }

  getPortfolio()          { return this.#portfolio; }
  getAllProjects()         { return this.#portfolio.portfolioProjects; }
  getPipelineProjects()   { return this.#portfolio.pipelineProjects; }
  getArchivedProjects()   { return this.#portfolio.archivedProjects; }
  getProject(id)          { return this.#portfolio.getProjectById(id); }

  archiveProject(id)  { this.#portfolio.archiveProject(id); }
  promoteProject(id)  { this.#portfolio.promoteProject(id); }
  demoteProject(id)   { this.#portfolio.demoteProject(id); }
  restoreProject(id)  { this.#portfolio.restoreProject(id); }

  addProject(data) {
    return this.#portfolio.addProject(data);
  }

  removeProject(id) {
    this.#portfolio.removeProject(id);
  }

  updateProject(id, data) {
    this.#portfolio.updateProject(id, data);
  }

  // ── Scenarios (المقترحات) ──────────────────────────────────────────────
  addScenario(projectId, data)              { return this.#portfolio.addScenario(projectId, data); }
  updateScenario(projectId, scenarioId, d)  { this.#portfolio.updateScenario(projectId, scenarioId, d); }
  removeScenario(projectId, scenarioId)     { this.#portfolio.removeScenario(projectId, scenarioId); }
  selectScenario(projectId, scenarioId)     { this.#portfolio.selectScenario(projectId, scenarioId); }

  getKPIs() {
    const p = this.#portfolio;
    const projects    = p.portfolioProjects;
    const totalValueM = projects.reduce((s, proj) => s + (proj.investmentM || 0), 0);
    return {
      totalValue:       p.totalValue,
      totalValueM,
      quarterGrowth:    p.quarterGrowth,
      averageROI:       p.averageROI.toFixed(1),
      averageIRR:       p.averageIRR.toFixed(1),
      averageROEAnnual: p.averageROEAnnual.toFixed(1),
      projectCount:        p.projectCount,
      underExecution:      p.underExecutionCount,
      totalAboveGradeGBA:  p.totalAboveGradeGBA.toLocaleString('en-US'),
    };
  }

  getPortfolioSectorDistribution() {
    const NORMALIZE = {
      villas: 'residential', townhouse: 'residential', studios: 'residential',
      health: 'medical',
    };
    const CANONICAL_NAME = {
      residential: { nameAr: 'سكني',  nameEn: 'Residential' },
      medical:     { nameAr: 'صحي',   nameEn: 'Medical'     },
    };
    const gbaByKey  = {};
    const metaByKey = {};
    for (const project of this.#portfolio.portfolioProjects) {
      for (const comp of project.componentBreakdown ?? []) {
        const bucket = NORMALIZE[comp.key] ?? comp.key;
        gbaByKey[bucket] = (gbaByKey[bucket] ?? 0) + (comp.gba ?? 0);
        if (!metaByKey[bucket]) {
          metaByKey[bucket] = CANONICAL_NAME[bucket] ?? { nameAr: comp.nameAr, nameEn: comp.nameEn };
        }
      }
    }
    const totalGBA = Object.values(gbaByKey).reduce((s, v) => s + v, 0);
    if (totalGBA === 0) return [];
    return Object.entries(gbaByKey)
      .map(([key, gba]) => ({
        key,
        nameAr: metaByKey[key].nameAr,
        nameEn: metaByKey[key].nameEn,
        pct: Math.round((gba / totalGBA) * 1000) / 10,
      }))
      .sort((a, b) => b.pct - a.pct);
  }

  getRawData() {
    const p = this.#portfolio;
    return {
      id:            p.id,
      currency:      p.currency,
      quarterGrowth: p.quarterGrowth,
      projects:      p.projects.map(proj => ({ ...proj })),
    };
  }

  getSensitivityScenarios() {
    const base = this.#portfolio.averageROEAnnual;
    return {
      pessimistic: (base * 0.9).toFixed(1),
      normal:      base.toFixed(1),
      optimistic:  (base * 1.1).toFixed(1),
    };
  }

  /**
   * Yearly J-curve data 2024→2030, normalized so each project's revenue/cost totals
   * match its actual financial data (costs.totalRevenue / costs.totalCost).
   * This ensures the final 2030 cumNet = Σ netProfit across all projects.
   */
  getYearlyPortfolioData() {
    const projects    = this.#portfolio.portfolioProjects;
    const YEARS       = ['2024','2025','2026','2027','2028','2029','2030'];
    const currentYear = String(new Date().getFullYear());

    // Pre-compute per-project normalization factors
    const scalingMap = projects.map(p => {
      const flows       = p.cashFlows ?? [];
      const cfRevTotal  = flows.reduce((s, f) => s + (f.revenue  ?? 0),             0);
      const cfExpTotal  = flows.reduce((s, f) => s + Math.abs(f.expenses ?? 0),     0);
      const actRevTotal = p.costs?.totalRevenue ?? cfRevTotal;
      const actExpTotal = p.costs?.totalCost    ?? cfExpTotal;
      return {
        id:       p.id,
        revScale: cfRevTotal > 0 ? actRevTotal / cfRevTotal : 1,
        expScale: cfExpTotal > 0 ? actExpTotal / cfExpTotal : 1,
      };
    });

    let cumNet = 0;
    return YEARS.map(year => {
      const { exp, rev } = projects.reduce((acc, p, i) => {
        const cf = p.cashFlows?.find(f => String(f.year) === year);
        if (!cf) return acc;
        const { revScale, expScale } = scalingMap[i];
        return {
          rev: acc.rev + (cf.revenue  ?? 0)             * revScale,
          exp: acc.exp + Math.abs(cf.expenses ?? 0)     * expScale,
        };
      }, { rev: 0, exp: 0 });

      cumNet += rev - exp;
      return {
        year,
        annualRev: Math.round(rev),
        annualExp: Math.round(exp),
        cumNet:    Math.round(cumNet),
        isFuture:  year > currentYear,
      };
    });
  }
}
