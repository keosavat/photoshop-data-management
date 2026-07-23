/**
 * CustomerService.gs — Customer module (see docs-v2/06_module_specs/customers.md).
 * CRUD over the Customers sheet with validation + RBAC. Returns Result envelopes.
 */
const CUSTOMER_HEADERS = ['customer_id', 'name', 'phone', 'email', 'address', 'birthday', 'tags', 'created_at'];

function nowIso_() { return new Date().toISOString(); }

const CustomerService = {
  _repo: function () {
    const r = new SheetRepository();
    r.ensureSheet(CONFIG.SHEETS.Customers, CUSTOMER_HEADERS);
    return r;
  },

  list: function () {
    return guardResult(function () {
      Auth.guard('customer.read');
      return ok(CustomerService._repo().findAll(CONFIG.SHEETS.Customers));
    });
  },

  get: function (id) {
    return guardResult(function () {
      Auth.guard('customer.read');
      const c = CustomerService._repo().findById(CONFIG.SHEETS.Customers, 'customer_id', id);
      if (!c) throw AppError(ERR.NOT_FOUND, 'customer ' + id);
      return ok(c);
    });
  },

  create: function (input) {
    return guardResult(function () {
      Auth.guard('customer.write');
      input = input || {};
      requireFields(input, ['name']);
      if (input.phone) assert_(isPhone(input.phone), ERR.VALIDATION, 'invalid phone');
      if (input.email) assert_(isEmail(input.email), ERR.VALIDATION, 'invalid email');
      const repo = CustomerService._repo();
      const id = nextId('Customers', repo.ids(CONFIG.SHEETS.Customers, 'customer_id'));
      const rec = {
        customer_id: id,
        name: input.name,
        phone: input.phone || '',
        email: input.email || '',
        address: input.address || '',
        birthday: input.birthday || '',
        tags: Array.isArray(input.tags) ? input.tags.join(',') : (input.tags || ''),
        created_at: nowIso_()
      };
      repo.insert(CONFIG.SHEETS.Customers, rec);
      return ok(rec);
    });
  },

  update: function (id, patch) {
    return guardResult(function () {
      Auth.guard('customer.write');
      patch = patch || {};
      if (patch.phone) assert_(isPhone(patch.phone), ERR.VALIDATION, 'invalid phone');
      if (patch.email) assert_(isEmail(patch.email), ERR.VALIDATION, 'invalid email');
      if (Array.isArray(patch.tags)) patch.tags = patch.tags.join(',');
      const rec = CustomerService._repo().update(CONFIG.SHEETS.Customers, 'customer_id', id, patch);
      return ok(rec);
    });
  },

  remove: function (id) {
    return guardResult(function () {
      Auth.guard('customer.delete');
      CustomerService._repo().deleteById(CONFIG.SHEETS.Customers, 'customer_id', id);
      return ok({ deleted: id });
    });
  }
};
