export class CashFlow {
  constructor({ year, revenue, expenses }) {
    this.year     = year;
    this.revenue  = revenue;
    this.expenses = expenses;
  }

  get net()        { return this.revenue + this.expenses; }
  get isPositive() { return this.net >= 0; }

  static cumulative(flows) {
    let running = 0;
    return flows.map(cf => {
      running += cf.net;
      return { year: cf.year, cumulative: running };
    });
  }
}
