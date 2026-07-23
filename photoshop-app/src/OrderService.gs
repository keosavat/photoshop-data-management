/**
 * OrderService.gs — Order Tracking (Lite) (§55 State Machine).
 * ອ້າງອີງ Book 1: §13 (RBAC), §22.1 (Layer), §52 (Audit), §55 (State).
 * State: New → Uploaded → Verified → Printing → Completed → Archived.
 */

var ORDER_FLOW = ['New', 'Uploaded', 'Verified', 'Printing', 'Completed', 'Archived'];

/** ສ້າງອໍເດີໃໝ່ (Status=New). ຕ້ອງ CSRF + RBAC (orders.create). */
function createOrder(payload, token, csrf, meta) {
  var user = requireCsrf(token, csrf);
  if (!can(user, 'orders', 'create')) throw new Error('E005: ' + tAuth('error.E005'));
  payload = payload || {};
  if (!payload.customerCode) throw new Error('E_VALIDATION: CustomerCode');
  var rec = create('Orders', {
    CustomerCode: payload.customerCode, Status: 'New',
    Type: payload.type || 'print', Priority: payload.priority || 'Normal',
    AssignedTo: user.userId
  }, user.userId);
  audit('ORDER_CREATE', user.userId, rec.OrderID, meta);
  invalidateDashboardCache();
  return { orderId: rec.OrderID, status: 'New' };
}

/** ລາຍການອໍເດີ (stringify date). */
function listOrders(opt) {
  opt = opt || {};
  return listAll('Orders').filter(function (o) {
    if (opt.customerCode && o.CustomerCode !== opt.customerCode) return false;
    if (opt.status && o.Status !== opt.status) return false;
    return true;
  }).map(function (o) {
    return {
      orderId: o.OrderID, customerCode: o.CustomerCode, status: o.Status,
      type: o.Type, priority: o.Priority, assignedTo: o.AssignedTo,
      updatedAt: String(o.UpdatedAt || '')
    };
  });
}

/** ປ່ຽນສະຖານະ (validate enum §55). ຕ້ອງ CSRF + RBAC (orders.edit). */
function updateOrderStatus(orderId, newStatus, token, csrf, meta) {
  var user = requireCsrf(token, csrf);
  if (!can(user, 'orders', 'edit')) throw new Error('E005: ' + tAuth('error.E005'));
  if (ENUMS.OrderStatus.indexOf(newStatus) < 0) throw new Error('E_VALIDATION: status ' + newStatus);
  var o = getById('Orders', orderId);
  if (!o) throw new Error('E004: order ' + orderId);
  update('Orders', orderId, { Status: newStatus }, user.userId);
  audit('ORDER_STATUS', user.userId, orderId + ' -> ' + newStatus, meta);
  invalidateDashboardCache();
  return { orderId: orderId, status: newStatus };
}

/** ສະຖານະຖັດໄປຕາມ State Machine (ຫຼື null ຖ້າສຸດທ້າຍ). */
function nextOrderStatus(current) {
  var i = ORDER_FLOW.indexOf(current);
  return (i >= 0 && i < ORDER_FLOW.length - 1) ? ORDER_FLOW[i + 1] : null;
}
