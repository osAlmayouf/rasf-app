import { ProjectType } from '../models/Project';

// Maps component keys → use category
const KEY_TO_CATEGORY = {
  residential: 'residential',
  villa:       'residential',
  townhouse:   'residential',
  apartment:   'residential',
  studio:      'residential',
  duplex:      'residential',
  penthouse:   'residential',
  commercial:  'commercial',
  retail:      'commercial',
  hotel:       'hospitality',
  serviced:    'hospitality',
  office:      'office',
  medical:     'medical',
  industrial:  'industrial',
  entertainment: 'entertainment',
};

// Maps single dominant category → ProjectType
const CATEGORY_TO_TYPE = {
  residential: ProjectType.RESIDENTIAL,
  commercial:  ProjectType.COMMERCIAL,
  hospitality: ProjectType.HOTEL,
  office:      ProjectType.COMMERCIAL,
  medical:     ProjectType.COMMERCIAL,
  industrial:  ProjectType.INDUSTRIAL,
  entertainment: ProjectType.COMMERCIAL,
};

/**
 * Classifies a project as Mixed-Use or Single-Use based on its active components.
 * Rule: 3+ distinct use categories → MIXED; otherwise → dominant single type.
 *
 * @param {Array}  componentBreakdown  array of { key, unitCount?, area?, ... }
 * @param {Object} unitCounts          flat object with unit counts from extracted data
 */
export function classifyProjectType(componentBreakdown = [], unitCounts = {}) {
  const categories = new Set();

  // From structured componentBreakdown array
  for (const comp of componentBreakdown) {
    const active = (comp.unitCount ?? 0) > 0 || (comp.area ?? 0) > 0;
    if (active) {
      const cat = KEY_TO_CATEGORY[comp.key] ?? comp.key;
      categories.add(cat);
    }
  }

  // Fallback: infer from raw unit counts extracted from the study file
  if (categories.size === 0) {
    const res = (unitCounts.residentialUnits ?? 0) + (unitCounts.villaUnits ?? 0) +
                (unitCounts.townhouseUnits ?? 0)   + (unitCounts.floorsUnits ?? 0) +
                (unitCounts.studioUnits ?? 0);
    const com = (unitCounts.commercialUnits ?? 0) + (unitCounts.officeUnits ?? 0);
    const hot = unitCounts.hotelUnits   ?? 0;
    const med = unitCounts.medicalUnits ?? 0;

    if (res > 0) categories.add('residential');
    if (com > 0) categories.add('commercial');
    if (hot > 0) categories.add('hospitality');
    if (med > 0) categories.add('medical');
  }

  if (categories.size >= 3) return ProjectType.MIXED;
  if (categories.size === 1) {
    const [cat] = categories;
    return CATEGORY_TO_TYPE[cat] ?? ProjectType.MIXED;
  }
  // 2 categories or 0 → mixed
  return ProjectType.MIXED;
}
