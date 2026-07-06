import { Entity } from './Entity';

export const ProjectStatus = Object.freeze({
  PIPELINE:  'pipeline',
  ARCHIVED:  'archived',
  PLANNING:  'planning',
  FINANCING: 'financing',
  ACTIVE:    'active',
  COMPLETED: 'completed',
});

export const ProjectType = Object.freeze({
  RESIDENTIAL:        'residential',
  COMMERCIAL:         'commercial',
  INDUSTRIAL:         'industrial',
  INFRASTRUCTURE:     'infrastructure',
  // legacy values (kept for existing data compatibility)
  LUXURY_RESIDENTIAL: 'luxury_residential',
  MIXED:              'mixed',
  HOTEL:              'hotel',
});

export class Project extends Entity {
  constructor({ id, name, location, subtitle, roi, irr, roeAnnual, progress, status, type, totalInvestment, investmentM, deliveryDate, startDate, opportunityDate, lastUpdated, area, farValue, aboveGradeGBA, belowGradeGBA, totalGBA, nsaArea, landscapeArea, units, unitsSold, avgUnitPrice, moic, paybackYears, phases, milestones, costs, cashFlows, investors, components, componentBreakdown, funding, equity, financing, scenarios, revenueBreakdown, lifecycleCompleted, lat, lng, mapUrl, contractSummary }) {
    super(id);
    this.name              = name;
    this.subtitle          = subtitle ?? '';
    this.location          = location;
    this.lat               = lat ?? null;
    this.lng               = lng ?? null;
    this.mapUrl            = mapUrl ?? null;
    this.contractSummary   = contractSummary ?? null;
    this.roi               = roi;
    this.irr               = irr;
    this.roeAnnual         = roeAnnual ?? 0;
    this.progress          = progress;
    this.status            = status;
    this.type              = type;
    this.totalInvestment   = totalInvestment;
    this.investmentM       = investmentM ?? 0;
    // Use explicit deliveryDate if provided; otherwise derive from last cash flow year
    const lastFlow = cashFlows?.length ? cashFlows[cashFlows.length - 1].year : null;
    this.deliveryDate = (deliveryDate && deliveryDate !== '—') ? deliveryDate : (lastFlow ?? '—');
    this.startDate         = startDate ?? '';
    this.opportunityDate   = opportunityDate ?? null;
    this.lastUpdated       = lastUpdated ?? null;
    this.area              = area;
    this.farValue          = farValue ?? 0;
    this.aboveGradeGBA     = aboveGradeGBA ?? '—';
    this.belowGradeGBA     = belowGradeGBA ?? '—';
    this.totalGBA          = totalGBA      ?? '—';
    this.nsaArea           = nsaArea       ?? '—';
    this.landscapeArea     = landscapeArea ?? '—';
    this.units             = units;
    this.unitsSold         = unitsSold;
    this.avgUnitPrice      = avgUnitPrice  ?? 0;
    this.moic              = moic;
    this.paybackYears      = paybackYears;
    this.phases            = phases          ?? [];
    this.milestones        = milestones      ?? [];
    this.costs             = costs           ?? {};
    this.cashFlows         = cashFlows       ?? [];
    this.investors         = investors       ?? [];
    this.components        = components      ?? {};
    this.componentBreakdown = componentBreakdown ?? [];
    this.funding           = funding         ?? {};
    this.equity            = equity          ?? {};
    this.financing         = financing       ?? null;
    this.revenueBreakdown  = revenueBreakdown ?? null;
    // تقدّم مراحل الدراسة/التقييم — عدد المراحل المكتملة (يُزامَن مع Supabase)
    this.lifecycleCompleted = lifecycleCompleted ?? null;
    // مقترحات/سيناريوهات الاستخدام — كل مقترح نموذج تقني + مالي مستقل
    this.scenarios         = scenarios       ?? [];
  }

  get isActive()    { return this.status === ProjectStatus.ACTIVE; }
  get isComplete()  { return this.progress >= 100; }
  get netProfit()   { return this.costs.netProfit ?? (this.costs.totalRevenue - this.costs.totalCost); }

  // المقترح المعتمد (أفضل استخدام) — تنعكس أرقامه على المشروع واللوحات
  get selectedScenario() { return this.scenarios.find(s => s.selected) ?? null; }

  getStatusColor() {
    const map = {
      [ProjectStatus.PIPELINE]:  'tag-blue',
      [ProjectStatus.ACTIVE]:    'tag-green',
      [ProjectStatus.FINANCING]: 'tag-amber',
      [ProjectStatus.PLANNING]:  'tag-blue',
      [ProjectStatus.COMPLETED]: 'tag-purple',
    };
    return map[this.status] ?? 'tag-blue';
  }

  getCompletionColor() {
    if (this.progress >= 80) return '#10b981';
    if (this.progress >= 40) return 'var(--rasf-primary)';
    return '#4f8ef7';
  }
}
