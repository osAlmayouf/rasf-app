import { Entity } from './Entity';

export const FileCategory = Object.freeze({
  FINANCIAL:  'fin',
  REPORTS:    'rep',
  CONTRACTS:  'con',
  DRAWINGS:   'drw',
});

const ICONS = { pdf: '📄', xlsx: '📊', xls: '📊', xlsm: '📊', xlsb: '📊', doc: '📝', docx: '📝', dwg: '🏛️', png: '🖼️', jpg: '🖼️', jpeg: '🖼️' };
const CATEGORY_TAGS = {
  [FileCategory.FINANCIAL]: 'tag-amber',
  [FileCategory.REPORTS]:   'tag-blue',
  [FileCategory.CONTRACTS]: 'tag-green',
  [FileCategory.DRAWINGS]:  'tag-red',
};

export class FileDocument extends Entity {
  constructor({ id, name, category, sizeMB, date, projectId, projectName, uploadedBy, storagePath }) {
    super(id);
    this.name        = name;
    this.category    = category;
    this.sizeMB      = sizeMB;
    this.date        = date;
    this.projectId   = projectId;
    this.projectName = projectName ?? '';
    this.uploadedBy  = uploadedBy;
    this.storagePath = storagePath ?? null;
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

  get isPreviewable() {
    return ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'xlsx', 'xls', 'xlsm', 'xlsb'].includes(this.extension);
  }
}
