/**
 * Setup.gs — one-time database bootstrap (see docs-v2/03, 08).
 * ແລ່ນ setupDatabase() ຄັ້ງດຽວຫຼັງຕັ້ງ Script Property SHEET_ID.
 * ສ້າງທຸກ tab + seed ຜູ້ໃຊ້ Owner ຈາກ Google account ທີ່ແລ່ນ.
 */
const ALL_SHEETS = {
  Customers: CUSTOMER_HEADERS,
  Albums: ALBUM_HEADERS,
  Photos: PHOTO_HEADERS,
  Documents: DOCUMENT_HEADERS,
  Orders: ORDER_HEADERS,
  OrderItems: ['item_id', 'order_id', 'description', 'qty', 'unit_price', 'amount'],
  Payments: PAYMENT_HEADERS,
  PrintJobs: PRINT_HEADERS,
  Users: USER_HEADERS,
  Settings: SETTING_HEADERS,
  Logs: ['log_id', 'at', 'user', 'action', 'message']
};

/**
 * Create every sheet tab (idempotent) and seed the running user as Owner.
 * Returns Result { ok, data:{ sheets, ownerSeeded, owner } }.
 */
function setupDatabase() {
  return guardResult(function () {
    if (!getProp_('SHEET_ID')) {
      throw AppError(ERR.INTERNAL, 'Set Script Property SHEET_ID first');
    }
    const repo = new SheetRepository();
    const sheets = [];
    Object.keys(ALL_SHEETS).forEach(function (name) {
      repo.ensureSheet(name, ALL_SHEETS[name]);
      sheets.push(name);
    });

    const owner = Session.getActiveUser().getEmail();
    let ownerSeeded = false;
    if (owner && !repo.findById(CONFIG.SHEETS.Users, 'email', owner)) {
      repo.insert(CONFIG.SHEETS.Users, {
        user_id: nextId('Users', repo.ids(CONFIG.SHEETS.Users, 'user_id')),
        email: owner, name: 'Owner', role: 'Owner', active: true
      });
      ownerSeeded = true;
    }
    Log_.info('setupDatabase done', { sheets: sheets.length, owner: owner });
    return ok({ sheets: sheets, ownerSeeded: ownerSeeded, owner: owner });
  });
}

/** Verify all required tabs exist. Returns { ok, missing }. */
function validateSchema() {
  return guardResult(function () {
    const repo = new SheetRepository();
    const missing = [];
    Object.keys(ALL_SHEETS).forEach(function (name) {
      try { repo._sheet(name); } catch (e) { missing.push(name); }
    });
    return ok({ ok: missing.length === 0, missing: missing });
  });
}

/** Optional: load a little demo data (safe to skip in production). */
function seedDemo() {
  return guardResult(function () {
    const repo = new SheetRepository();
    repo.ensureSheet(CONFIG.SHEETS.Customers, CUSTOMER_HEADERS);
    if (repo.findAll(CONFIG.SHEETS.Customers).length === 0) {
      ['ນາງ ດາວ', 'ທ້າວ ສີ', 'ນາງ ຄຳ'].forEach(function (nm) {
        repo.insert(CONFIG.SHEETS.Customers, {
          customer_id: nextId('Customers', repo.ids(CONFIG.SHEETS.Customers, 'customer_id')),
          name: nm, created_at: new Date().toISOString()
        });
      });
    }
    return ok({ seeded: true });
  });
}
