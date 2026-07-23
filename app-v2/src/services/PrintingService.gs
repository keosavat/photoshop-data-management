/**
 * PrintingService.gs — Printing module (see docs-v2/06_module_specs/printing.md).
 * Print jobs with fixed print types + queue states.
 */
const PRINT_HEADERS = ['print_id', 'order_id', 'type', 'size', 'qty', 'status', 'assigned_to', 'created_at'];
const PRINT_TYPES = ['Passport', 'Wedding', 'Certificate', 'Frame', 'Canvas', 'ID Card'];
const PRINT_TRANSITIONS = {
  'queued': ['printing', 'cancelled'],
  'printing': ['done', 'cancelled'],
  'done': ['reprint'],
  'reprint': ['printing', 'cancelled'],
  'cancelled': []
};

const PrintingService = {
  _repo: function () {
    const r = new SheetRepository();
    r.ensureSheet(CONFIG.SHEETS.PrintJobs, PRINT_HEADERS);
    return r;
  },
  queue: function () {
    return guardResult(function () {
      Auth.guard('printing.read');
      return ok(PrintingService._repo().findAll(CONFIG.SHEETS.PrintJobs));
    });
  },
  create: function (input) {
    return guardResult(function () {
      Auth.guard('printing.write');
      input = input || {};
      requireFields(input, ['order_id', 'type']);
      assert_(PRINT_TYPES.indexOf(input.type) >= 0, ERR.VALIDATION, 'invalid print type');
      const repo = PrintingService._repo();
      const rec = {
        print_id: nextId('PrintJobs', repo.ids(CONFIG.SHEETS.PrintJobs, 'print_id')),
        order_id: input.order_id,
        type: input.type,
        size: input.size || '',
        qty: Number(input.qty || 1),
        status: 'queued',
        assigned_to: input.assigned_to || '',
        created_at: nowIso_()
      };
      repo.insert(CONFIG.SHEETS.PrintJobs, rec);
      return ok(rec);
    });
  },
  setStatus: function (id, next) {
    return guardResult(function () {
      Auth.guard('printing.write');
      const repo = PrintingService._repo();
      const j = repo.findById(CONFIG.SHEETS.PrintJobs, 'print_id', id);
      if (!j) throw AppError(ERR.NOT_FOUND, 'print job ' + id);
      const allowed = PRINT_TRANSITIONS[j.status] || [];
      assert_(allowed.indexOf(next) >= 0, ERR.VALIDATION, 'cannot move ' + j.status + ' -> ' + next);
      return ok(repo.update(CONFIG.SHEETS.PrintJobs, 'print_id', id, { status: next }));
    });
  },
  assign: function (id, user) {
    return guardResult(function () {
      Auth.guard('printing.write');
      return ok(PrintingService._repo().update(CONFIG.SHEETS.PrintJobs, 'print_id', id, { assigned_to: user }));
    });
  }
};
