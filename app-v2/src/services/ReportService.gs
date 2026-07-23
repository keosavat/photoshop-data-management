/**
 * ReportService.gs — KPIs & reports (see docs-v2/06_module_specs/reports.md).
 * RBAC: Manager+ (report.read).
 */
const ReportService = {
  _repo: function () { return new SheetRepository(); },

  _count: function (repo, sheet) {
    try { return repo.findAll(sheet).length; } catch (e) { return 0; }
  },
  _rows: function (repo, sheet) {
    try { return repo.findAll(sheet); } catch (e) { return []; }
  },

  overview: function () {
    return guardResult(function () {
      Auth.guard('report.read');
      const repo = ReportService._repo();
      const orders = ReportService._rows(repo, CONFIG.SHEETS.Orders);
      const payments = ReportService._rows(repo, CONFIG.SHEETS.Payments);
      const revenue = payments.reduce(function (s, p) { return s + Number(p.amount || 0); }, 0);
      const completed = orders.filter(function (o) { return o.status === 'complete'; }).length;
      const pending = orders.filter(function (o) {
        return o.status !== 'complete' && o.status !== 'cancelled';
      }).length;
      return ok({
        customers: ReportService._count(repo, CONFIG.SHEETS.Customers),
        albums: ReportService._count(repo, CONFIG.SHEETS.Albums),
        photos: ReportService._count(repo, CONFIG.SHEETS.Photos),
        orders: orders.length,
        completedOrders: completed,
        pendingOrders: pending,
        revenue: revenue
      });
    });
  },

  /** Count orders grouped by status. */
  ordersByStatus: function () {
    return guardResult(function () {
      Auth.guard('report.read');
      const orders = ReportService._rows(ReportService._repo(), CONFIG.SHEETS.Orders);
      const by = {};
      orders.forEach(function (o) { by[o.status] = (by[o.status] || 0) + 1; });
      return ok(by);
    });
  }
};
