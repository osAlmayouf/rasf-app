import { supabase } from '../lib/supabase';
import { PORTFOLIO_SEED } from '../data/seedData';

// ── Local cache (survives page reloads even when Supabase is unreachable) ──────
const LS_KEY = 'rasf-portfolio';
function loadLocal() {
  try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}
function saveLocal(portfolioRaw) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(portfolioRaw)); }
  catch { /* quota / serialization — ignore */ }
}

export class SupabaseDataService {

  // ── Load ──────────────────────────────────────────────────────────────
  static async loadPortfolio() {
    try {
      const [{ data: projects }, { data: settings }] = await Promise.all([
        supabase.from('projects').select('*').order('sort_order'),
        supabase.from('portfolio_settings').select('*').eq('id', 'main').single(),
      ]);

      if (projects && projects.length > 0) {
        return {
          id:            settings?.id            ?? 'portfolio-1',
          currency:      settings?.currency      ?? 'SAR',
          quarterGrowth: settings?.quarter_growth ?? PORTFOLIO_SEED.quarterGrowth,
          projects:      projects.map(row => row.data),
        };
      }

      // Supabase reachable but empty → prefer a local copy if we have one, else seed
      const local = loadLocal();
      if (local?.projects?.length) return local;
      await this.seedFromData(PORTFOLIO_SEED);
      return PORTFOLIO_SEED;
    } catch (err) {
      console.warn('[Supabase] load failed — falling back to local cache', err);
      return loadLocal();   // null → caller falls back to seed
    }
  }

  // ── Save (full sync after any mutation) ───────────────────────────────
  static async savePortfolio(portfolioRaw) {
    saveLocal(portfolioRaw);   // always keep a local copy (survives Supabase outages)
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
            data:       p,               // full project JSON (name lives inside data)
            status:     p.status === 'pipeline' ? 'pipeline' : 'portfolio',
            sort_order: i,
            updated_at: new Date().toISOString(),
          }))
        ),
      ]);
    } catch (err) {
      console.warn('[Supabase] save failed (local copy kept)', err);
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
          data:       p,               // full project JSON (name lives inside data)
          status:     p.status === 'pipeline' ? 'pipeline' : 'portfolio',
          sort_order: i,
        }))
      ),
    ]);
  }
}
