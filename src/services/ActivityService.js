import { supabase } from '../lib/supabase';

// ── سجل العمليات (Audit Log) ──────────────────────────────────────────────
// يسجّل من فعل ماذا ومتى. لا يُفشل العملية الأصلية لو تعذّر التسجيل.

export const ActivityService = {
  /**
   * @param profile  ملف المستخدم من useAuth (full_name, id)
   * @param action   وصف العملية بالعربي (مثل "إضافة مشروع")
   * @param meta     { entityType, entityName, projectId, details }
   *   entityType — 'project' | 'status' | 'contract' | 'file' | 'image' | 'note'
   */
  async log(profile, action, { entityType = null, entityName = null, projectId = null, details = null } = {}) {
    try {
      await supabase.from('activity_log').insert({
        action,
        entity_type:  entityType,
        entity_name:  entityName,
        project_id:   projectId,
        details,
        performed_by: profile?.full_name ?? 'غير معروف',
        user_id:      profile?.id ?? null,
      });
    } catch (e) {
      console.warn('[Activity] log failed', e);
    }
  },

  async getAll(limit = 500) {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) { console.warn('[Activity] load failed', error); return []; }
    return data ?? [];
  },
};
