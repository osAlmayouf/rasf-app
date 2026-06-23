// Seed data — commercial sector (sales, funnel, marketing)
// 4 representative projects · statuses: 'available' | 'reserved' | 'sold'

export const SALES_AGENTS = [
  'محمد العمري',
  'سارة الغامدي',
  'فيصل الحربي',
  'نورة السلمان',
  'عبدالله المطيري',
];

export const COMMERCIAL_PROJECTS = [
  {
    id: 'asaar',
    name: 'مشروع أسار',
    nameEn: 'Asaar Project',
    location: 'الرياض',
    hasZones: true,

    // ── Unit inventory ────────────────────────────────────────────────────
    units: [
      { zone: 'A', building: '1', unitNo: 'A1-101', floor: 1, area: 130, privateArea: 22, total: 152, price: 1_365_000, status: 'sold',      agent: 'محمد العمري'     },
      { zone: 'A', building: '1', unitNo: 'A1-102', floor: 1, area: 118, privateArea: 18, total: 136, price: 1_224_000, status: 'sold',      agent: 'سارة الغامدي'    },
      { zone: 'A', building: '1', unitNo: 'A1-103', floor: 1, area: 95,  privateArea: 15, total: 110, price:   950_000, status: 'sold',      agent: 'فيصل الحربي'     },
      { zone: 'A', building: '1', unitNo: 'A1-201', floor: 2, area: 130, privateArea: 22, total: 152, price: 1_385_000, status: 'reserved',  agent: 'محمد العمري'     },
      { zone: 'A', building: '1', unitNo: 'A1-202', floor: 2, area: 118, privateArea: 18, total: 136, price: 1_244_000, status: 'available', agent: null              },
      { zone: 'A', building: '1', unitNo: 'A1-203', floor: 2, area: 95,  privateArea: 15, total: 110, price:   970_000, status: 'sold',      agent: 'نورة السلمان'    },
      { zone: 'A', building: '1', unitNo: 'A1-301', floor: 3, area: 130, privateArea: 22, total: 152, price: 1_405_000, status: 'sold',      agent: 'محمد العمري'     },
      { zone: 'A', building: '1', unitNo: 'A1-302', floor: 3, area: 118, privateArea: 18, total: 136, price: 1_264_000, status: 'reserved',  agent: 'عبدالله المطيري' },
      { zone: 'A', building: '1', unitNo: 'A1-303', floor: 3, area: 95,  privateArea: 15, total: 110, price:   990_000, status: 'available', agent: null              },
      { zone: 'A', building: '2', unitNo: 'A2-101', floor: 1, area: 142, privateArea: 25, total: 167, price: 1_550_000, status: 'sold',      agent: 'سارة الغامدي'    },
      { zone: 'A', building: '2', unitNo: 'A2-102', floor: 1, area: 108, privateArea: 16, total: 124, price: 1_100_000, status: 'sold',      agent: 'فيصل الحربي'     },
      { zone: 'A', building: '2', unitNo: 'A2-201', floor: 2, area: 142, privateArea: 25, total: 167, price: 1_570_000, status: 'available', agent: null              },
      { zone: 'A', building: '2', unitNo: 'A2-202', floor: 2, area: 108, privateArea: 16, total: 124, price: 1_120_000, status: 'reserved',  agent: 'نورة السلمان'    },
      { zone: 'B', building: '1', unitNo: 'B1-101', floor: 1, area: 155, privateArea: 30, total: 185, price: 1_720_000, status: 'sold',      agent: 'محمد العمري'     },
      { zone: 'B', building: '1', unitNo: 'B1-102', floor: 1, area: 125, privateArea: 20, total: 145, price: 1_280_000, status: 'sold',      agent: 'عبدالله المطيري' },
      { zone: 'B', building: '1', unitNo: 'B1-103', floor: 1, area: 100, privateArea: 12, total: 112, price: 1_010_000, status: 'reserved',  agent: 'سارة الغامدي'    },
      { zone: 'B', building: '1', unitNo: 'B1-201', floor: 2, area: 155, privateArea: 30, total: 185, price: 1_740_000, status: 'available', agent: null              },
      { zone: 'B', building: '1', unitNo: 'B1-202', floor: 2, area: 125, privateArea: 20, total: 145, price: 1_300_000, status: 'sold',      agent: 'فيصل الحربي'     },
      { zone: 'B', building: '1', unitNo: 'B1-301', floor: 3, area: 155, privateArea: 30, total: 185, price: 1_760_000, status: 'available', agent: null              },
      { zone: 'B', building: '1', unitNo: 'B1-302', floor: 3, area: 125, privateArea: 20, total: 145, price: 1_320_000, status: 'sold',      agent: 'محمد العمري'     },
    ],

    // ── Sales funnel ──────────────────────────────────────────────────────
    funnel: {
      interested: 320,
      contacted:  190,
      visited:     85,
      reserved:     3,
      sold:        14,
      delivered:    8,
    },

    // ── Marketing ─────────────────────────────────────────────────────────
    marketing: {
      leads:            320,
      cpl:              420,        // SAR per lead
      cac:            8_500,        // SAR per acquisition
      contentCount:      32,
      collectedRevenue: 6_300_000,  // SAR actually collected
      leadSources: [
        { label: 'وسائل التواصل', count: 140 },
        { label: 'الموقع الإلكتروني', count: 75 },
        { label: 'إحالة',           count: 60 },
        { label: 'معارض',           count: 30 },
        { label: 'أخرى',            count: 15 },
      ],
    },
  },

  {
    id: 'jeddah',
    name: 'برج جدة',
    nameEn: 'Jeddah Tower',
    location: 'جدة',
    hasZones: false,

    units: [
      { zone: null, building: '1', unitNo: '101', floor: 1, area: 120, privateArea: 18, total: 138, price: 1_100_000, status: 'sold',      agent: 'سارة الغامدي'    },
      { zone: null, building: '1', unitNo: '102', floor: 1, area: 145, privateArea: 24, total: 169, price: 1_380_000, status: 'sold',      agent: 'فيصل الحربي'     },
      { zone: null, building: '1', unitNo: '103', floor: 1, area: 90,  privateArea: 12, total: 102, price:   820_000, status: 'reserved',  agent: 'نورة السلمان'    },
      { zone: null, building: '1', unitNo: '201', floor: 2, area: 120, privateArea: 18, total: 138, price: 1_120_000, status: 'sold',      agent: 'محمد العمري'     },
      { zone: null, building: '1', unitNo: '202', floor: 2, area: 145, privateArea: 24, total: 169, price: 1_400_000, status: 'available', agent: null              },
      { zone: null, building: '1', unitNo: '203', floor: 2, area: 90,  privateArea: 12, total: 102, price:   840_000, status: 'sold',      agent: 'عبدالله المطيري' },
      { zone: null, building: '1', unitNo: '301', floor: 3, area: 120, privateArea: 18, total: 138, price: 1_140_000, status: 'available', agent: null              },
      { zone: null, building: '1', unitNo: '302', floor: 3, area: 145, privateArea: 24, total: 169, price: 1_420_000, status: 'reserved',  agent: 'سارة الغامدي'    },
      { zone: null, building: '1', unitNo: '303', floor: 3, area: 90,  privateArea: 12, total: 102, price:   860_000, status: 'sold',      agent: 'فيصل الحربي'     },
      { zone: null, building: '1', unitNo: '401', floor: 4, area: 168, privateArea: 32, total: 200, price: 1_680_000, status: 'sold',      agent: 'محمد العمري'     },
      { zone: null, building: '1', unitNo: '402', floor: 4, area: 168, privateArea: 32, total: 200, price: 1_700_000, status: 'reserved',  agent: 'نورة السلمان'    },
      { zone: null, building: '1', unitNo: '501', floor: 5, area: 200, privateArea: 40, total: 240, price: 2_100_000, status: 'available', agent: null              },
      { zone: null, building: '1', unitNo: '502', floor: 5, area: 200, privateArea: 40, total: 240, price: 2_120_000, status: 'sold',      agent: 'عبدالله المطيري' },
      { zone: null, building: '1', unitNo: '601', floor: 6, area: 250, privateArea: 50, total: 300, price: 2_750_000, status: 'available', agent: null              },
      { zone: null, building: '1', unitNo: '602', floor: 6, area: 250, privateArea: 50, total: 300, price: 2_780_000, status: 'available', agent: null              },
    ],

    funnel: {
      interested: 250,
      contacted:  148,
      visited:     62,
      reserved:     3,
      sold:         8,
      delivered:    5,
    },

    marketing: {
      leads:            250,
      cpl:              380,
      cac:            7_800,
      contentCount:      24,
      collectedRevenue: 3_900_000,
      leadSources: [
        { label: 'وسائل التواصل', count: 110 },
        { label: 'الموقع الإلكتروني', count: 55 },
        { label: 'إحالة',           count: 45 },
        { label: 'معارض',           count: 25 },
        { label: 'أخرى',            count: 15 },
      ],
    },
  },

  {
    id: 'qur229',
    name: 'قرطبة 229',
    nameEn: 'Qurtuba 229',
    location: 'الرياض',
    hasZones: true,

    units: [
      { zone: 'A', building: '1', unitNo: 'A-101', floor: 1, area: 110, privateArea: 15, total: 125, price:   990_000, status: 'sold',      agent: 'فيصل الحربي'     },
      { zone: 'A', building: '1', unitNo: 'A-102', floor: 1, area: 135, privateArea: 22, total: 157, price: 1_250_000, status: 'sold',      agent: 'سارة الغامدي'    },
      { zone: 'A', building: '1', unitNo: 'A-103', floor: 1, area: 85,  privateArea: 10, total:  95, price:   750_000, status: 'reserved',  agent: 'محمد العمري'     },
      { zone: 'A', building: '1', unitNo: 'A-201', floor: 2, area: 110, privateArea: 15, total: 125, price: 1_010_000, status: 'available', agent: null              },
      { zone: 'A', building: '1', unitNo: 'A-202', floor: 2, area: 135, privateArea: 22, total: 157, price: 1_270_000, status: 'sold',      agent: 'نورة السلمان'    },
      { zone: 'A', building: '1', unitNo: 'A-203', floor: 2, area: 85,  privateArea: 10, total:  95, price:   770_000, status: 'sold',      agent: 'عبدالله المطيري' },
      { zone: 'A', building: '1', unitNo: 'A-301', floor: 3, area: 150, privateArea: 28, total: 178, price: 1_420_000, status: 'reserved',  agent: 'فيصل الحربي'     },
      { zone: 'B', building: '1', unitNo: 'B-101', floor: 1, area: 120, privateArea: 18, total: 138, price: 1_080_000, status: 'sold',      agent: 'محمد العمري'     },
      { zone: 'B', building: '1', unitNo: 'B-102', floor: 1, area: 95,  privateArea: 14, total: 109, price:   855_000, status: 'sold',      agent: 'سارة الغامدي'    },
      { zone: 'B', building: '1', unitNo: 'B-103', floor: 1, area: 145, privateArea: 24, total: 169, price: 1_305_000, status: 'available', agent: null              },
      { zone: 'B', building: '1', unitNo: 'B-201', floor: 2, area: 120, privateArea: 18, total: 138, price: 1_100_000, status: 'reserved',  agent: 'عبدالله المطيري' },
      { zone: 'B', building: '1', unitNo: 'B-202', floor: 2, area: 95,  privateArea: 14, total: 109, price:   875_000, status: 'sold',      agent: 'نورة السلمان'    },
      { zone: 'B', building: '1', unitNo: 'B-301', floor: 3, area: 160, privateArea: 30, total: 190, price: 1_520_000, status: 'available', agent: null              },
    ],

    funnel: {
      interested: 210,
      contacted:  130,
      visited:     55,
      reserved:     3,
      sold:         8,
      delivered:    3,
    },

    marketing: {
      leads:            210,
      cpl:              350,
      cac:            7_200,
      contentCount:      19,
      collectedRevenue: 3_200_000,
      leadSources: [
        { label: 'وسائل التواصل', count: 90 },
        { label: 'الموقع الإلكتروني', count: 50 },
        { label: 'إحالة',           count: 40 },
        { label: 'معارض',           count: 20 },
        { label: 'أخرى',            count: 10 },
      ],
    },
  },

  {
    id: 'alkhalij',
    name: 'مشروع الخليج',
    nameEn: 'Al Khalij Project',
    location: 'الرياض',
    hasZones: false,

    units: [
      { zone: null, building: '1', unitNo: '101', floor: 1, area: 105, privateArea: 16, total: 121, price:   945_000, status: 'sold',      agent: 'فيصل الحربي'     },
      { zone: null, building: '1', unitNo: '102', floor: 1, area: 130, privateArea: 20, total: 150, price: 1_200_000, status: 'sold',      agent: 'محمد العمري'     },
      { zone: null, building: '1', unitNo: '103', floor: 1, area: 80,  privateArea: 10, total:  90, price:   720_000, status: 'available', agent: null              },
      { zone: null, building: '1', unitNo: '201', floor: 2, area: 105, privateArea: 16, total: 121, price:   965_000, status: 'reserved',  agent: 'سارة الغامدي'    },
      { zone: null, building: '1', unitNo: '202', floor: 2, area: 130, privateArea: 20, total: 150, price: 1_220_000, status: 'sold',      agent: 'عبدالله المطيري' },
      { zone: null, building: '1', unitNo: '203', floor: 2, area: 80,  privateArea: 10, total:  90, price:   740_000, status: 'sold',      agent: 'نورة السلمان'    },
      { zone: null, building: '1', unitNo: '301', floor: 3, area: 105, privateArea: 16, total: 121, price:   985_000, status: 'available', agent: null              },
      { zone: null, building: '1', unitNo: '302', floor: 3, area: 130, privateArea: 20, total: 150, price: 1_240_000, status: 'reserved',  agent: 'فيصل الحربي'     },
      { zone: null, building: '1', unitNo: '401', floor: 4, area: 160, privateArea: 30, total: 190, price: 1_600_000, status: 'sold',      agent: 'محمد العمري'     },
      { zone: null, building: '1', unitNo: '402', floor: 4, area: 160, privateArea: 30, total: 190, price: 1_620_000, status: 'available', agent: null              },
    ],

    funnel: {
      interested: 180,
      contacted:  105,
      visited:     42,
      reserved:     2,
      sold:         6,
      delivered:    2,
    },

    marketing: {
      leads:            180,
      cpl:              300,
      cac:            6_500,
      contentCount:      15,
      collectedRevenue: 2_200_000,
      leadSources: [
        { label: 'وسائل التواصل', count: 80 },
        { label: 'الموقع الإلكتروني', count: 40 },
        { label: 'إحالة',           count: 30 },
        { label: 'معارض',           count: 20 },
        { label: 'أخرى',            count: 10 },
      ],
    },
  },
];

// ─── Helper functions ─────────────────────────────────────────────────────────

export function getAllUnits() {
  return COMMERCIAL_PROJECTS.flatMap(p =>
    p.units.map(u => ({ ...u, projectId: p.id, projectName: p.name, projectLocation: p.location }))
  );
}

export function getProjectStats(projectId) {
  const proj = COMMERCIAL_PROJECTS.find(p => p.id === projectId);
  if (!proj) return null;
  const units     = proj.units;
  const sold      = units.filter(u => u.status === 'sold');
  const reserved  = units.filter(u => u.status === 'reserved');
  const available = units.filter(u => u.status === 'available');
  return {
    total:          units.length,
    sold:           sold.length,
    reserved:       reserved.length,
    available:      available.length,
    soldValue:      sold.reduce((s, u) => s + u.price, 0),
    reservedValue:  reserved.reduce((s, u) => s + u.price, 0),
    totalValue:     units.reduce((s, u) => s + u.price, 0),
    sellThrough:    ((sold.length + reserved.length) / units.length) * 100,
    collectedRevenue: proj.marketing.collectedRevenue,
  };
}

export function getAgentStats(projectId) {
  const units = projectId
    ? getAllUnits().filter(u => u.projectId === projectId)
    : getAllUnits();
  const map = {};
  for (const u of units) {
    if (!u.agent) continue;
    if (!map[u.agent]) map[u.agent] = { agent: u.agent, sold: 0, reserved: 0, soldValue: 0, reservedValue: 0 };
    if (u.status === 'sold')     { map[u.agent].sold++;     map[u.agent].soldValue     += u.price; }
    if (u.status === 'reserved') { map[u.agent].reserved++; map[u.agent].reservedValue += u.price; }
  }
  return Object.values(map).sort((a, b) => b.sold - a.sold);
}

export function getPortfolioStats() {
  const all       = getAllUnits();
  const sold      = all.filter(u => u.status === 'sold');
  const reserved  = all.filter(u => u.status === 'reserved');
  const available = all.filter(u => u.status === 'available');
  return {
    total:           all.length,
    sold:            sold.length,
    reserved:        reserved.length,
    available:       available.length,
    soldValue:       sold.reduce((s, u) => s + u.price, 0),
    reservedValue:   reserved.reduce((s, u) => s + u.price, 0),
    totalValue:      all.reduce((s, u) => s + u.price, 0),
    sellThrough:     ((sold.length + reserved.length) / all.length) * 100,
    collectedRevenue: COMMERCIAL_PROJECTS.reduce((s, p) => s + p.marketing.collectedRevenue, 0),
  };
}

export function getFunnelData(projectId) {
  if (!projectId || projectId === 'all') {
    // Sum funnel across all projects
    const keys = ['interested', 'contacted', 'visited', 'reserved', 'sold', 'delivered'];
    return keys.reduce((acc, k) => {
      acc[k] = COMMERCIAL_PROJECTS.reduce((s, p) => s + p.funnel[k], 0);
      return acc;
    }, {});
  }
  return COMMERCIAL_PROJECTS.find(p => p.id === projectId)?.funnel ?? null;
}

export function getMarketingData(projectId) {
  if (!projectId || projectId === 'all') {
    const sources = {};
    let leads = 0, contentCount = 0, collectedRevenue = 0;
    for (const p of COMMERCIAL_PROJECTS) {
      leads           += p.marketing.leads;
      contentCount    += p.marketing.contentCount;
      collectedRevenue += p.marketing.collectedRevenue;
      for (const s of p.marketing.leadSources) {
        sources[s.label] = (sources[s.label] ?? 0) + s.count;
      }
    }
    // Weighted average CPL and CAC
    const totalSpend = COMMERCIAL_PROJECTS.reduce((s, p) => s + p.marketing.leads * p.marketing.cpl, 0);
    const totalAcq   = COMMERCIAL_PROJECTS.reduce((s, p) => s + p.funnel.sold * p.marketing.cac, 0);
    const totalSold  = COMMERCIAL_PROJECTS.reduce((s, p) => s + (p.funnel?.sold ?? 0), 0);
    return {
      leads,
      cpl:            Math.round(totalSpend / leads),
      cac:            totalSold > 0 ? Math.round(totalAcq / totalSold) : 0,
      contentCount,
      collectedRevenue,
      leadSources: Object.entries(sources).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
    };
  }
  return COMMERCIAL_PROJECTS.find(p => p.id === projectId)?.marketing ?? null;
}
