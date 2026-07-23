/**
 * Code.gs — web entry point + client-callable API (see docs-v2/05, 08).
 * doGet serves the HtmlService app; client calls server via google.script.run.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('src/client/index')
    .evaluate()
    .setTitle('PhotoShop Enterprise DAMS')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Include a client partial (css/js/components) into a template. */
function include(path) {
  return HtmlService.createHtmlOutputFromFile(path).getContent();
}

/**
 * Dashboard aggregate for the current signed-in user.
 * Returns Result { ok, data:{ kpis, activity } } like the services.
 */
function getDashboard() {
  return guardResult(function () {
    const role = Auth.currentRole();
    if (!role) throw AppError(ERR.UNAUTHORIZED, 'Please sign in');
    const repo = new SheetRepository();
    function safe(fn) { try { return fn(); } catch (e) { return []; } }
    function count(sheet) { return safe(function () { return repo.findAll(sheet); }).length; }

    const orders = safe(function () { return repo.findAll(CONFIG.SHEETS.Orders); });
    const payments = safe(function () { return repo.findAll(CONFIG.SHEETS.Payments); });
    const revenue = payments.reduce(function (s, p) { return s + Number(p.amount || 0); }, 0);
    const logs = safe(function () { return repo.findAll(CONFIG.SHEETS.Logs); });

    return ok({
      role: role,
      kpis: {
        photos: count(CONFIG.SHEETS.Photos),
        albums: count(CONFIG.SHEETS.Albums),
        customers: count(CONFIG.SHEETS.Customers),
        orders: orders.length,
        revenue: revenue,
        todayUpload: 0,
        pendingJobs: orders.filter(function (o) { return o.status !== 'complete' && o.status !== 'cancelled'; }).length,
        completedJobs: orders.filter(function (o) { return o.status === 'complete'; }).length,
        storagePct: 0,
        storageTxt: '—'
      },
      activity: logs.slice(-6).reverse()
    });
  });
}

/** Expose a few list endpoints for the client (each RBAC-guarded in its service). */
function apiCustomers() { return CustomerService.list(); }
function apiAlbums() { return AlbumService.list(); }
function apiPhotos(albumId) { return PhotoService.list(albumId); }
function apiOrders() { return OrderService.list(); }
function apiSearch(q) { return SearchService.search(q); }
