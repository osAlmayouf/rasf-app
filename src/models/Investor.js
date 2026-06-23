import { Entity } from './Entity';

export const InvestorRole = Object.freeze({
  LEAD_INVESTOR: 'lead_investor',
  DEVELOPER:     'developer',
  LEAD_LENDER:   'lead_lender',
  SUKUK:         'sukuk',
});

export class Investor extends Entity {
  constructor({ id, name, role, amount, percentage, color }) {
    super(id);
    this.name       = name;
    this.role       = role;
    this.amount     = amount;
    this.percentage = percentage;
    this.color      = color ?? '#4f8ef7';
  }

  get formattedAmount() {
    return `${this.amount}M`;
  }

  get formattedPercentage() {
    return `${this.percentage}%`;
  }

  get isFinancialInstitution() {
    return this.role === InvestorRole.LEAD_LENDER || this.role === InvestorRole.SUKUK;
  }
}
