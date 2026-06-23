import { Note } from '../models/Note';

let _seq = 1;

export class NotesService {
  #notes = [];

  /** All notes for a project, newest first. Includes deleted-from-portfolio ones. */
  getNotesForProject(projectId) {
    return [...this.#notes]
      .filter(n => n.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /** Last `limit` notes across all projects that haven't been removed from portfolio. */
  getRecentPortfolioNotes(limit = 3) {
    return [...this.#notes]
      .filter(n => !n.deletedFromPortfolio)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  addNote(projectId, text) {
    const note = new Note({
      id: `note_${_seq++}`,
      projectId,
      text,
      createdAt: new Date().toISOString(),
      deletedFromPortfolio: false,
    });
    this.#notes.unshift(note);
    return note;
  }

  /** Soft-delete: hides from portfolio widget but keeps record in project history. */
  removeFromPortfolio(noteId) {
    const note = this.#notes.find(n => n.id === noteId);
    if (note) note.deletedFromPortfolio = true;
  }
}
