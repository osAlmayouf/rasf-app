import { Entity } from './Entity';
import { Project } from './Project';
import { fmtK } from '../utils/fmt';
import { progressFromPhases, defaultPhases } from '../utils/phaseProgress';

// تاريخ اليوم بصيغة YYYY-MM-DD — يُختم في "آخر تحديث" عند أي تعديل
const today = () => new Date().toISOString().slice(0, 10);

export class Portfolio extends Entity {
  constructor({ id = 'portfolio', currency = 'SAR', quarterGrowth, projects = [] }) {
    super(id);
    this.currency      = currency;
    this.quarterGrowth = quarterGrowth;
    this._projects     = projects.map(p => {
      const project = new Project(p);
      // حساب تلقائي للإنجاز من حالات البنود عند التحميل
      const calc = progressFromPhases(project.phases);
      if (calc !== null) project.progress = calc;
      return project;
    });
  }

  // All projects (including pipeline + archived). Used internally.
  get projects()          { return [...this._projects]; }
  // Active portfolio: excludes pipeline and archived.
  get portfolioProjects() { return this._projects.filter(p => p.status !== 'pipeline' && p.status !== 'archived'); }
  // Pipeline (under-study) projects only — excludes archived.
  get pipelineProjects()  { return this._projects.filter(p => p.status === 'pipeline'); }
  // Archived projects only.
  get archivedProjects()  { return this._projects.filter(p => p.status === 'archived'); }

  get totalValue() {
    const total = this.portfolioProjects.reduce((s, p) => s + (p.investmentM || 0), 0);
    return fmtK(total);
  }

  get activeProjects() { return this.portfolioProjects.filter(p => p.isActive); }
  get projectCount()   { return this.portfolioProjects.length; }

  // Projects where excavation (first milestone) has started
  get underExecutionCount() {
    return this.portfolioProjects.filter(p => p.milestones?.[0]?.done === true).length;
  }

  get averageROI() {
    const pp = this.portfolioProjects;
    if (!pp.length) return 0;
    return pp.reduce((sum, p) => sum + p.roi, 0) / pp.length;
  }

  get averageIRR() {
    const pp = this.portfolioProjects;
    if (!pp.length) return 0;
    return pp.reduce((sum, p) => sum + p.irr, 0) / pp.length;
  }

  get totalAboveGradeGBA() {
    return this.portfolioProjects.reduce((s, p) => {
      const n = parseInt(String(p.aboveGradeGBA ?? '').replace(/[^\d]/g, ''), 10) || 0;
      return s + n;
    }, 0);
  }

  get averageROEAnnual() {
    const pp = this.portfolioProjects;
    if (!pp.length) return 0;
    const weightedSum = pp.reduce((s, p) => s + (p.roeAnnual || 0) * (p.paybackYears || 1), 0);
    const totalWeight = pp.reduce((s, p) => s + (p.paybackYears || 1), 0);
    return weightedSum / totalWeight;
  }

  getProjectById(id) {
    return this._projects.find(p => p.id === id) ?? null;
  }

  addProject(projectData) {
    const project = new Project(projectData);
    const calc = progressFromPhases(project.phases);
    if (calc !== null) project.progress = calc;
    this._projects.push(project);
    return project;
  }

  removeProject(id) {
    const idx = this._projects.findIndex(p => p.id === id);
    if (idx !== -1) this._projects.splice(idx, 1);
  }

  updateProject(id, data) {
    const project = this._projects.find(p => p.id === id);
    if (!project) return;

    const SIMPLE_FIELDS = [
      'name', 'type', 'progress', 'phases', 'milestones', 'status',
      'investmentM', 'totalInvestment', 'irr', 'roi', 'roeAnnual',
      'moic', 'paybackYears', 'deliveryDate', 'startDate', 'opportunityDate',
      'lat', 'lng', 'mapUrl',
      'area', 'farValue', 'aboveGradeGBA', 'belowGradeGBA',
      'totalGBA', 'nsaArea', 'landscapeArea', 'units', 'unitsSold', 'avgUnitPrice',
      'componentBreakdown', 'revenueBreakdown', 'investors', 'cashFlows',
      'lastUpdated', 'scenarios', 'lifecycleCompleted',
    ];

    SIMPLE_FIELDS.forEach(field => {
      if (data[field] !== undefined) project[field] = data[field];
    });

    // اختم "آخر تحديث" تلقائياً عند أي تعديل (ما لم يُمرَّر تاريخ صراحةً)
    project.lastUpdated = data.lastUpdated ?? today();

    // Location also updates subtitle
    if (data.location !== undefined) {
      project.location = data.location;
      if (project.subtitle?.includes('•')) {
        project.subtitle = data.location + project.subtitle.slice(project.subtitle.indexOf('•') - 1);
      }
    }

    // Deep-merge nested objects
    if (data.costs !== undefined) {
      project.costs = { ...(project.costs ?? {}), ...data.costs };
    }
    if (data.components !== undefined) {
      project.components = { ...(project.components ?? {}), ...data.components };
    }
    if (data.funding !== undefined) {
      project.funding = { ...(project.funding ?? {}), ...data.funding };
    }
    if (data.equity !== undefined) {
      project.equity = { ...(project.equity ?? {}), ...data.equity };
    }
    if (data.financing !== undefined) {
      project.financing = data.financing;
    }
  }

  // ── Scenarios (المقترحات) ──────────────────────────────────────────────
  addScenario(projectId, scenarioData) {
    const project = this._projects.find(p => p.id === projectId);
    if (!project) return null;
    const scenario = {
      id: `scn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      selected: false,
      createdAt: new Date().toISOString(),
      ...scenarioData,
    };
    project.scenarios = [...(project.scenarios ?? []), scenario];
    // أول مقترح يُعتمد تلقائياً
    if (project.scenarios.length === 1) this.selectScenario(projectId, scenario.id);
    project.lastUpdated = today();
    return project.scenarios.find(s => s.id === scenario.id);
  }

  updateScenario(projectId, scenarioId, data) {
    const project = this._projects.find(p => p.id === projectId);
    if (!project) return;
    project.scenarios = (project.scenarios ?? []).map(s =>
      s.id === scenarioId ? { ...s, ...data } : s
    );
    // لو المقترح المُحدّث هو المعتمد، أعِد عكس أرقامه على المشروع
    if (project.scenarios.find(s => s.id === scenarioId)?.selected) {
      this.#applyScenarioToProject(project, scenarioId);
    }
    project.lastUpdated = today();
  }

  removeScenario(projectId, scenarioId) {
    const project = this._projects.find(p => p.id === projectId);
    if (!project) return;
    const wasSelected = project.scenarios?.find(s => s.id === scenarioId)?.selected;
    project.scenarios = (project.scenarios ?? []).filter(s => s.id !== scenarioId);
    // لو حُذف المعتمد، اعتمد الأول المتبقي
    if (wasSelected && project.scenarios.length > 0) {
      this.selectScenario(projectId, project.scenarios[0].id);
    }
    project.lastUpdated = today();
  }

  selectScenario(projectId, scenarioId) {
    const project = this._projects.find(p => p.id === projectId);
    if (!project) return;
    project.scenarios = (project.scenarios ?? []).map(s => ({ ...s, selected: s.id === scenarioId }));
    this.#applyScenarioToProject(project, scenarioId);
    project.lastUpdated = today();
  }

  // ينسخ أرقام المقترح المعتمد إلى حقول المشروع العليا (للوحات والمقارنات)
  #applyScenarioToProject(project, scenarioId) {
    const s = project.scenarios.find(x => x.id === scenarioId);
    if (!s) return;
    const num = (v) => (v === '' || v === null || v === undefined ? undefined : Number(v));
    const map = {
      investmentM: num(s.investmentM ?? s.totalCost),
      irr: num(s.irr), roi: num(s.roi), roeAnnual: num(s.roeAnnual),
      moic: num(s.moic), paybackYears: num(s.paybackYears),
      farValue: num(s.farValue), totalGBA: s.totalGBA, units: num(s.units),
    };
    Object.entries(map).forEach(([k, v]) => { if (v !== undefined) project[k] = v; });
    if (s.totalCost != null || s.totalRevenue != null) {
      const totalCost = num(s.totalCost), totalRevenue = num(s.totalRevenue);
      project.costs = {
        ...(project.costs ?? {}),
        ...(totalCost != null    ? { totalCost }    : {}),
        ...(totalRevenue != null ? { totalRevenue } : {}),
        ...(totalCost != null && totalRevenue != null ? { netProfit: totalRevenue - totalCost } : {}),
      };
    }
  }

  archiveProject(id) {
    const project = this._projects.find(p => p.id === id);
    if (project) { project.status = 'archived'; project.lastUpdated = today(); }
  }

  promoteProject(id) {
    const project = this._projects.find(p => p.id === id);
    if (project && project.status === 'pipeline') {
      project.status = 'planning';
      // مشروع قائم جديد يبدأ ببنود المشروع الخمسة (كلها لم تبدأ)
      project.phases      = defaultPhases();
      project.progress    = 0;
      project.lastUpdated = today();
    }
  }

  // Send an active project back to the pipeline (reverse of promoteProject)
  demoteProject(id) {
    const project = this._projects.find(p => p.id === id);
    if (project && project.status !== 'pipeline' && project.status !== 'archived') {
      project.status            = 'pipeline';
      project.lifecycleCompleted = null;   // restart the study/evaluation phases
      project.lastUpdated       = today();
    }
  }

  restoreProject(id) {
    const project = this._projects.find(p => p.id === id);
    if (project && project.status === 'archived') { project.status = 'pipeline'; project.lastUpdated = today(); }
  }

  getSectorDistribution() {
    const dist = {};
    for (const p of this._projects) {
      dist[p.type] = (dist[p.type] ?? 0) + 1;
    }
    return dist;
  }
}
