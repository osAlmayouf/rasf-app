import { supabase } from '../lib/supabase';
import { Note } from '../models/Note';

function rowToNote(row) {
  return new Note({
    id:                   row.id,
    projectId:            row.project_id,
    text:                 row.text,
    addedBy:              row.added_by,
    userId:               row.user_id,
    deletedFromPortfolio: row.deleted_from_portfolio,
    createdAt:            row.created_at,
  });
}

export class NotesService {

  async getNotesForProject(projectId) {
    const { data, error } = await supabase
      .from('project_notes')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) { console.warn('[Notes] load failed', error); return []; }
    return data.map(rowToNote);
  }

  async getAllNotes() {
    const { data, error } = await supabase
      .from('project_notes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.warn('[Notes] load failed', error); return []; }
    return data.map(rowToNote);
  }

  async getRecentPortfolioNotes(limit = 5) {
    const { data, error } = await supabase
      .from('project_notes')
      .select('*')
      .eq('deleted_from_portfolio', false)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) { console.warn('[Notes] load failed', error); return []; }
    return data.map(rowToNote);
  }

  // user = { id: uuid, full_name: string }
  async addNote(projectId, text, user) {
    const { data, error } = await supabase
      .from('project_notes')
      .insert({
        project_id: projectId,
        text,
        added_by:   user?.full_name ?? 'Unknown',
        user_id:    user?.id ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return rowToNote(data);
  }

  async removeFromPortfolio(noteId) {
    const { error } = await supabase
      .from('project_notes')
      .update({ deleted_from_portfolio: true })
      .eq('id', noteId);
    if (error) console.warn('[Notes] remove failed', error);
  }
}
