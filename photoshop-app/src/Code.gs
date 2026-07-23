/**
 * Code.gs — Entry point (doGet / doPost) + backend routing (STEP 5).
 * ອ້າງອີງ Book 1: §22.1 (Layer), §13 (Security), §54 (Error Codes).
 * ທຸກ API call ຝັ່ງ server ຕ້ອງຜ່ານ guard(token, module, action) ກ່ອນ (Backend Route Guard).
 */

/** ສະແດງ Web App (client). */
function doGet() {
  return HtmlService.createTemplateFromFile('src/client/index')
    .evaluate()
    .setTitle('Photo Shop')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** include helper ສຳລັບ client (css/js partials). */
function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

/**
 * ຕົວຢ່າງ Backend Router — ທຸກ action map ໄປ {module, action} ແລ້ວຜ່ານ guard().
 * client ຮຽກຜ່ານ google.script.run.api({token, action, payload}).
 */
var ROUTES = {
  'photos.list':   { module: 'photos',    action: 'view',   handler: function (u, p) { return listPhotos(p); } },
  // photos upload/archive ໃຊ້ photoUpload()/photoBatchUpload()/archivePhoto() ໂດຍກົງ (ບັງຄັບ CSRF + RBAC ພາຍໃນ — STEP 9)
  'orders.list':   { module: 'orders',    action: 'view',   handler: function (u, p) { return listOrders(p); } },
  'documents.list':{ module: 'documents', action: 'view',   handler: function (u, p) { return listDocuments(p); } },
  'documents.search':{ module: 'documents', action: 'view', handler: function (u, p) { return searchDocuments(p.query, p.filters); } },
  'search.query':  { module: 'search',    action: 'view',   handler: function (u, p) { return search(p.query, p.filters, p.opts); } },
  'orders.print':  { module: 'orders',    action: 'print',  handler: function (u, p) { return update('Orders', p.id, { Status: 'Printing' }, u.userId); } },
  'reports.kpi':   { module: 'reports',   action: 'view',   handler: function (u, p) { return getKpiReport(p && p.token); } },
  'dashboard.data':{ module: 'dashboard', action: 'view',   handler: function (u, p) { return getDashboardData(p); } }
};

/** API entry (ຮຽກຈາກ client). req = { token, action, payload, meta }. */
function api(req) {
  req = req || {};
  var route = ROUTES[req.action];
  if (!route) throw new Error('E004: unknown action ' + req.action);
  var user = guard(req.token, route.module, route.action, req.meta); // throws E001/E005
  return route.handler(user, req.payload || {});
}
