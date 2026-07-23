/**
 * OrderService.gs — Order module (see docs-v2/06_module_specs/orders.md).
 * CRUD + state machine. RBAC guarded.
 */
const ORDER_HEADERS = ['order_id', 'customer_id', 'type', 'status', 'total', 'note', 'created_at'];

/** Allowed status transitions. */
const ORDER_TRANSITIONS = {
  'new': ['in_progress', 'cancelled'],
  'in_progress': ['printing', 'cancelled'],
  'printing': ['delivery', 'cancelled'],
  'delivery': ['complete', 'cancelled'],
  'complete': [],
  'cancelled': []
};

const OrderService = {
  _repo: function () {
    const r = new SheetRepository();
    r.ensureSheet(CONFIG.SHEETS.Orders, ORDER_HEADERS);
    return r;
  },

  list: function () {
    return guardResult(function () {
      Auth.guard('order.read');
      return ok(OrderService._repo().findAll(CONFIG.SHEETS.Orders));
    });
  },

  get: function (id) {
    return guardResult(function () {
      Auth.guard('order.read');
      const o = OrderService._repo().findById(CONFIG.SHEETS.Orders, 'order_id', id);
      if (!o) throw AppError(ERR.NOT_FOUND, 'order ' + id);
      return ok(o);
    });
  },

  create: function (input) {
    return guardResult(function () {
      Auth.guard('order.write');
      input = input || {};
      requireFields(input, ['customer_id', 'type']);
      const repo = OrderService._repo();
      const rec = {
        order_id: nextId('Orders', repo.ids(CONFIG.SHEETS.Orders, 'order_id')),
        customer_id: input.customer_id,
        type: input.type,
        status: 'new',
        total: Number(input.total || 0),
        note: input.note || '',
        created_at: nowIso_()
      };
      repo.insert(CONFIG.SHEETS.Orders, rec);
      return ok(rec);
    });
  },

  /** Transition to `next` status if allowed, else E_VALIDATION. */
  setStatus: function (id, next) {
    return guardResult(function () {
      Auth.guard('order.write');
      const repo = OrderService._repo();
      const o = repo.findById(CONFIG.SHEETS.Orders, 'order_id', id);
      if (!o) throw AppError(ERR.NOT_FOUND, 'order ' + id);
      const allowed = ORDER_TRANSITIONS[o.status] || [];
      assert_(allowed.indexOf(next) >= 0, ERR.VALIDATION,
        'cannot move ' + o.status + ' -> ' + next);
      return ok(repo.update(CONFIG.SHEETS.Orders, 'order_id', id, { status: next }));
    });
  },

  cancel: function (id) { return OrderService.setStatus(id, 'cancelled'); },

  remove: function (id) {
    return guardResult(function () {
      Auth.guard('order.delete');
      OrderService._repo().deleteById(CONFIG.SHEETS.Orders, 'order_id', id);
      return ok({ deleted: id });
    });
  }
};
