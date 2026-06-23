import { FileDocument, FileCategory } from '../models/FileDocument';

export class FileService {
  #files;

  constructor(seedFiles = []) {
    this.#files = seedFiles.map(f => new FileDocument(f));
  }

  getAll()  { return [...this.#files]; }

  getByCategory(category) {
    if (category === 'all') return this.getAll();
    return this.#files.filter(f => f.category === category);
  }

  getByProject(projectId) {
    return this.#files.filter(f => f.projectId === projectId);
  }

  addFromUpload(files, projectId = null, projectName = '') {
    const added = Array.from(files).map(f =>
      FileDocument.fromUpload(f, projectId, projectName)
    );
    this.#files.unshift(...added);
    return added;
  }

  addFromUploadWithCategory(files, projectId = null, projectName = '', category = FileCategory.FINANCIAL, uploadedBy = '—') {
    const added = Array.from(files).map(f =>
      FileDocument.fromUpload(f, projectId, projectName, category, uploadedBy)
    );
    this.#files.unshift(...added);
    return added;
  }

  getCategoryOptions() {
    return Object.values(FileCategory);
  }
}
