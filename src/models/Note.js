export class Note {
  constructor({ id, projectId, text, createdAt, deletedFromPortfolio = false }) {
    this.id                   = id;
    this.projectId            = projectId;
    this.text                 = text;
    this.createdAt            = createdAt;
    this.deletedFromPortfolio = deletedFromPortfolio;
  }
}
