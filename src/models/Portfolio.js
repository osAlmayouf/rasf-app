import { Entity } from './Entity';
import { Project } from './Project';
import { fmtK } from '../utils/fmt';

// أوزان البنود الخمسة لكل نوع مشروع
const PHASE_WEIGHTS = {
  residential:        { ph1: 5, ph2: 10, ph3: 20, ph4: 55, ph5: 10 },
  commercial:         { ph1: 5, ph2: 12, ph3: 18, ph4: 55, ph5: 10 },
  industrial:         { ph1: 8, ph2: 15, ph3: 25, ph4: 42, ph5: 10 },
  infrastructure:     { ph1: 10, ph2: 20, ph3: 35, ph4: 25, ph5: 10 },
  luxury_residential: { ph1: 5, ph2: 10, ph3: 20, ph4: 55, ph5: 10 },
  mixed:              { ph1: 5, ph2: 12, ph3: 18, ph4: 55, ph5: 10 },
  hotel:              { ph1: 5, ph2: 12, ph3: 18, ph4: 55, ph5: 10 },
};

// يحسب نسبة الإنجاز من المراحل وأوزان نوع المشروع
function calcProgressFromPhases(type, phases) {
  if (!phases?.length) return null;
  const w = PHASE_WEIGHTS[type] ?? PHASE_WEIGHTS.commercial;
  const total = phases.reduce((sum, p) => sum + ((p.progress ?? 0) * (w[p.key] ?? 0)) / 100, 0);
  return parseFloat(total.toFixed(1));
}

export class Portfolio extends Entity {
  constructor({ id = 'portfolio', currency = 'SAR', quarterGrowth, projects = [] }) {
    super(id);
    this.currency      = currency;
    this.quarterGrowth = quarterGrowth;
    this._projects     = projects.map(p => {
      const project = new Project(p);
      // حساب تلقائي للإنجاز من المراحل عند التحميل
      const calc = calcProgressFromPhases(project.type, project.phases);
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
    const calc = calcProgressFromPhases(project.type, project.phases);
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
      'moic', 'paybackYears', 'deliveryDate', 'startDate',
      'area', 'farValue', 'aboveGradeGBA', 'belowGradeGBA',
      'totalGBA', 'nsaArea', 'units', 'unitsSold', 'avgUnitPrice',
      'componentBreakdown', 'investors', 'cashFlows',
      'lastUpdated',
    ];

    SIMPLE_FIELDS.forEach(field => {
      if (data[field] !== undefined) project[field] = data[field];
    });

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

  archiveProject(id) {
    const project = this._projects.find(p => p.id === id);
    if (project) project.status = 'archived';
  }

  promoteProject(id) {
    const project = this._projects.find(p => p.id === id);
    if (project && project.status === 'pipeline') project.status = 'planning';
  }

  restoreProject(id) {
    const project = this._projects.find(p => p.id === id);
    if (project && project.status === 'archived') project.status = 'pipeline';
  }

  getSectorDistribution() {
    const dist = {};
    for (const p of this._projects) {
      dist[p.type] = (dist[p.type] ?? 0) + 1;
    }
    return dist;
  }
}
