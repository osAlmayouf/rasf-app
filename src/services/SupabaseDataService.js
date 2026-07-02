import { supabase } from '../lib/supabase';
import { PORTFOLIO_SEED } from '../data/seedData';

export class SupabaseDataService {

  // ── Load ──────────────────────────────────────────────────────────────
  static async loadPortfolio() {
    try {
      const [{ data: projects }, { data: settings }] = await Promise.all([
        supabase.from('projects').select('*').order('sort_order'),
        supabase.from('portfolio_settings').select('*').eq('id', 'main').single(),
      ]);

      if (!projects || projects.length === 0) {
        // First run — seed from local data
        await this.seedFromData(PORTFOLIO_SEED);
        return PORTFOLIO_SEED;
      }

      return {
        id:            settings?.id            ?? 'portfolio-1',
        currency:      settings?.currency      ?? 'SAR',
        quarterGrowth: settings?.quarter_growth ?? PORTFOLIO_SEED.quarterGrowth,
        projects:      projects.map(row => row.data),
      };
    } catch (err) {
      console.warn('[Supabase] load failed — using local seed data', err);
      return null;
    }
  }

  // ── Save (full sync after any mutation) ───────────────────────────────
  static async savePortfolio(portfolioRaw) {
    try {
      await Promise.all([
        supabase.from('portfolio_settings').upsert({
          id:             'main',
          currency:       portfolioRaw.currency      ?? 'SAR',
          quarter_growth: portfolioRaw.quarterGrowth ?? 0,
          updated_at:     new Date().toISOString(),
        }),
        supabase.from('projects').upsert(
          portfolioRaw.projects.map((p, i) => ({
            id:         p.id,
            name:       p.name,
            data:       p,
            status:     p.status === 'pipeline' ? 'pipeline' : 'portfolio',
            sort_order: i,
            updated_at: new Date().toISOString(),
          }))
        ),
      ]);
    } catch (err) {
      console.warn('[Supabase] save failed', err);
    }
  }

  // ── Delete a single project ───────────────────────────────────────────
  static async deleteProject(id) {
    try {
      await supabase.from('projects').delete().eq('id', id);
    } catch (err) {
      console.warn('[Supabase] delete failed', err);
    }
  }

  // ── Seed Supabase from local data (first run only) ────────────────────
  static async seedFromData(seed) {
    await Promise.all([
      supabase.from('portfolio_settings').upsert({
        id:             'main',
        currency:       seed.currency      ?? 'SAR',
        quarter_growth: seed.quarterGrowth ?? 0,
      }),
      supabase.from('projects').upsert(
        seed.projects.map((p, i) => ({
          id:         p.id,
          name:       p.name,
          data:       p,
          status:     p.status === 'pipeline' ? 'pipeline' : 'portfolio',
          sort_order: i,
        }))
      ),
    ]);
  }
}
