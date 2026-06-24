import { supabase } from '../lib/supabase';
import { FileDocument } from '../models/FileDocument';

const BUCKET = 'project-files';

function rowToFile(row) {
  return new FileDocument({
    id:          row.id,
    name:        row.name,
    category:    row.category,
    sizeMB:      row.size_mb,
    date:        new Date(row.created_at).toLocaleDateString('ar-SA'),
    projectId:   row.project_id,
    projectName: row.project_name ?? '',
    uploadedBy:  row.uploaded_by,
    storagePath: row.storage_path,
  });
}

export class FileService {

  async getAll() {
    const { data, error } = await supabase
      .from('project_files')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.warn('[Files] load failed', error); return []; }
    return data.map(rowToFile);
  }

  async getByProject(projectId) {
    const { data, error } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) { console.warn('[Files] load failed', error); return []; }
    return data.map(rowToFile);
  }

  async getByCategory(category) {
    let query = supabase
      .from('project_files')
      .select('*')
      .order('created_at', { ascending: false });
    if (category !== 'all') query = query.eq('category', category);
    const { data, error } = await query;
    if (error) { console.warn('[Files] load failed', error); return []; }
    return data.map(rowToFile);
  }

  async upload(file, projectId, projectName, category, user) {
    const ext         = file.name.split('.').pop();
    const uuid        = crypto.randomUUID();
    const folder      = projectId ?? 'general';
    const storagePath = `${folder}/${uuid}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file);
    if (uploadError) throw uploadError;

    const { data, error: dbError } = await supabase
      .from('project_files')
      .insert({
        project_id:   projectId,
        project_name: projectName ?? '',
        name:         file.name,
        category,
        size_mb:      parseFloat((file.size / 1024 / 1024).toFixed(1)),
        storage_path: storagePath,
        uploaded_by:  user?.full_name ?? 'Unknown',
        user_id:      user?.id ?? null,
      })
      .select()
      .single();
    if (dbError) throw dbError;

    await this.logAction(data.id, 'upload', user);
    return rowToFile(data);
  }

  async getSignedUrl(storagePath) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 3600);
    if (error) throw error;
    return data.signedUrl;
  }

  async delete(fileId, storagePath, user) {
    await this.logAction(fileId, 'delete', user);
    await supabase.storage.from(BUCKET).remove([storagePath]);
    await supabase.from('project_files').delete().eq('id', fileId);
  }

  async logAction(fileId, action, user) {
    await supabase.from('file_audit_log').insert({
      file_id:      fileId,
      action,
      performed_by: user?.full_name ?? 'Unknown',
      user_id:      user?.id ?? null,
    });
  }

  async getAuditLog(fileId) {
    const { data, error } = await supabase
      .from('file_audit_log')
      .select('*')
      .eq('file_id', fileId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return data;
  }
}
