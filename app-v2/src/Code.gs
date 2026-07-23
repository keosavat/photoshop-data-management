/**
 * Code.gs — web entry point + client-callable API (see docs-v2/05, 08).
 * doGet serves the HtmlService app; client calls server via google.script.run.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('client/index')
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
function apiCreateCustomer(input) { return CustomerService.create(input); }
function apiUpdateCustomer(id, patch) { return CustomerService.update(id, patch); }
function apiDeleteCustomer(id) { return CustomerService.remove(id); }
function apiAlbums() { return AlbumService.list(); }
function apiCreateAlbum(input) { return AlbumService.create(input); }

function apiPhotos(albumId) { return PhotoService.list(albumId); }
/** Upload a photo from the client. payload: { name, mimeType, dataBase64, album_id? }. */
function apiUploadPhoto(payload) {
  return guardResult(function () {
    payload = payload || {};
    requireFields(payload, ['name', 'dataBase64']);
    const bytes = Utilities.base64Decode(payload.dataBase64);
    const blob = Utilities.newBlob(bytes, payload.mimeType || 'application/octet-stream', payload.name);
    return PhotoService.upload({ name: payload.name, blob: blob, album_id: payload.album_id });
  });
}

function apiOrders() { return OrderService.list(); }
function apiCreateOrder(input) { return OrderService.create(input); }
function apiSetOrderStatus(id, next) { return OrderService.setStatus(id, next); }

function apiPayments(orderId) { return PaymentService.listByOrder(orderId); }
function apiRecordPayment(input) { return PaymentService.record(input); }
function apiOrderPaymentStatus(orderId, total) { return PaymentService.statusForOrder(orderId, total); }

function apiSearch(q) { return SearchService.search(q); }

// ---- Documents ----
function apiDocuments() { return DocumentService.list(); }
function apiUploadDocument(payload) {
  return guardResult(function () {
    payload = payload || {};
    requireFields(payload, ['name', 'type', 'dataBase64']);
    const bytes = Utilities.base64Decode(payload.dataBase64);
    const blob = Utilities.newBlob(bytes, payload.mimeType || 'application/octet-stream', payload.name);
    return DocumentService.upload({ name: payload.name, type: payload.type, blob: blob, category: payload.category });
  });
}
function apiDocHistory(id) { return DocumentService.history(id); }

// ---- Printing ----
function apiPrintQueue() { return PrintingService.queue(); }
function apiCreatePrint(input) { return PrintingService.create(input); }
function apiSetPrintStatus(id, next) { return PrintingService.setStatus(id, next); }
function apiAssignPrint(id, user) { return PrintingService.assign(id, user); }

// ---- Reports ----
function apiReportOverview() { return ReportService.overview(); }
function apiOrdersByStatus() { return ReportService.ordersByStatus(); }

// ---- Settings + Users ----
function apiSettingsAll() { return SettingService.all(); }
function apiSetSetting(key, value) { return SettingService.set(key, value); }
function apiListUsers() { return SettingService.listUsers(); }
function apiAddUser(input) { return SettingService.addUser(input); }
function apiSetUserRole(email, role) { return SettingService.setUserRole(email, role); }
function apiDeactivateUser(email) { return SettingService.deactivateUser(email); }
