/**
 * SearchService.gs — unified search (see docs-v2/06_module_specs/search.md).
 * Searches only entity types the current role may read.
 */
const SEARCH_TYPES = [
  ['customers', CONFIG.SHEETS.Customers, 'customer.read'],
  ['albums', CONFIG.SHEETS.Albums, 'album.read'],
  ['photos', CONFIG.SHEETS.Photos, 'photo.read'],
  ['orders', CONFIG.SHEETS.Orders, 'order.read'],
  ['documents', CONFIG.SHEETS.Documents, 'document.read']
];

const SearchService = {
  search: function (query, filters) {
    return guardResult(function () {
      const role = Auth.currentRole();
      if (!role) throw AppError(ERR.UNAUTHORIZED, 'Not signed in');
      const q = String(query || '').toLowerCase();
      const repo = new SheetRepository();
      const out = {};
      SEARCH_TYPES.forEach(function (t) {
        const key = t[0], sheet = t[1], perm = t[2];
        if (!Auth.can(perm)) return;
        let rows;
        try { rows = repo.findAll(sheet); } catch (e) { rows = []; }
        out[key] = rows.filter(function (r) {
          return Object.keys(r).some(function (k) {
            return String(r[k]).toLowerCase().indexOf(q) >= 0;
          });
        });
      });
      return ok(out);
    });
  }
};
