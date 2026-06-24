export class Note {
  constructor({ id, projectId, text, addedBy, userId, createdAt, deletedFromPortfolio = false }) {
    this.id                   = id;
    this.projectId            = projectId;
    this.text                 = text;
    this.addedBy              = addedBy ?? 'Unknown';
    this.userId               = userId ?? null;
    this.createdAt            = createdAt;
    this.deletedFromPortfolio = deletedFromPortfolio;
  }
}
