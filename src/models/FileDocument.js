import { Entity } from './Entity';

export const FileCategory = Object.freeze({
  FINANCIAL:  'fin',
  REPORTS:    'rep',
  CONTRACTS:  'con',
  DRAWINGS:   'drw',
});

const ICONS = { pdf: '📄', xlsx: '📊', xls: '📊', doc: '📝', docx: '📝', dwg: '🏛️' };
const CATEGORY_TAGS = {
  [FileCategory.FINANCIAL]: 'tag-amber',
  [FileCategory.REPORTS]:   'tag-blue',
  [FileCategory.CONTRACTS]: 'tag-green',
  [FileCategory.DRAWINGS]:  'tag-red',
};

export class FileDocument extends Entity {
  constructor({ id, name, category, sizeMB, date, projectId, projectName, uploadedBy }) {
    super(id);
    this.name        = name;
    this.category    = category;
    this.sizeMB      = sizeMB;
    this.date        = date;
    this.projectId   = projectId;
    this.projectName = projectName;
    this.uploadedBy  = uploadedBy;
  }

  get extension() {
    return this.name.split('.').pop().toLowerCase();
  }

  get icon() {
    return ICONS[this.extension] ?? '📎';
  }

  get categoryTagClass() {
    return CATEGORY_TAGS[this.category] ?? 'tag-blue';
  }

  get formattedSize() {
    return `${this.sizeMB} MB`;
  }

  static fromUpload(file, projectId = null, projectName = '', category = FileCategory.FINANCIAL, uploadedBy = '—') {
    return new FileDocument({
      id:          crypto.randomUUID(),
      name:        file.name,
      category,
      sizeMB:      (file.size / 1024 / 1024).toFixed(1),
      date:        new Date().toLocaleDateString('ar-SA'),
      projectId,
      projectName,
      uploadedBy,
    });
  }
}
