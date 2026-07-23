/**
 * PaymentService.gs — Payment module (see docs-v2/06_module_specs/payments.md).
 * Record-only (no gateway). RBAC: Manager+ .
 */
const PAYMENT_HEADERS = ['payment_id', 'order_id', 'customer_id', 'amount', 'method', 'status', 'created_at'];
const PAYMENT_METHODS = ['cash', 'transfer', 'qr'];

const PaymentService = {
  _repo: function () {
    const r = new SheetRepository();
    r.ensureSheet(CONFIG.SHEETS.Payments, PAYMENT_HEADERS);
    return r;
  },

  /** Record a payment. input: { order_id, amount, method, customer_id? }. */
  record: function (input) {
    return guardResult(function () {
      Auth.guard('payment.write');
      input = input || {};
      requireFields(input, ['order_id', 'amount', 'method']);
      const amount = Number(input.amount);
      assert_(!isNaN(amount) && amount > 0, ERR.VALIDATION, 'amount must be > 0');
      assert_(PAYMENT_METHODS.indexOf(input.method) >= 0, ERR.VALIDATION, 'invalid method');
      const repo = PaymentService._repo();
      const rec = {
        payment_id: nextId('Payments', repo.ids(CONFIG.SHEETS.Payments, 'payment_id')),
        order_id: input.order_id,
        customer_id: input.customer_id || '',
        amount: amount,
        method: input.method,
        status: 'paid',
        created_at: nowIso_()
      };
      repo.insert(CONFIG.SHEETS.Payments, rec);
      return ok(rec);
    });
  },

  listByOrder: function (orderId) {
    return guardResult(function () {
      Auth.guard('payment.read');
      return ok(PaymentService._repo().findAll(CONFIG.SHEETS.Payments)
        .filter(function (p) { return String(p.order_id) === String(orderId); }));
    });
  },

  /** Sum payments vs order total → 'paid' | 'partial' | 'unpaid'. */
  statusForOrder: function (orderId, orderTotal) {
    return guardResult(function () {
      Auth.guard('payment.read');
      const paid = PaymentService._repo().findAll(CONFIG.SHEETS.Payments)
        .filter(function (p) { return String(p.order_id) === String(orderId); })
        .reduce(function (sum, p) { return sum + Number(p.amount || 0); }, 0);
      let status = 'unpaid';
      if (Number(orderTotal) > 0 && paid >= Number(orderTotal)) status = 'paid';
      else if (paid > 0) status = 'partial';
      return ok({ order_id: orderId, paid: paid, total: Number(orderTotal || 0), status: status });
    });
  }
};
