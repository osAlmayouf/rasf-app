export class Entity {
  constructor(id) {
    this.id = id;
    this.createdAt = new Date();
  }

  toJSON() {
    return { ...this };
  }

  equals(other) {
    return other instanceof Entity && other.id === this.id;
  }
}
