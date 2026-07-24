/**
 * DocumentService.gs — Document module with versioning (see docs-v2/06_module_specs/documents.md).
 */
const DOCUMENT_HEADERS = ['document_id', 'name', 'type', 'category', 'drive_file_id',
  'version', 'status', 'history', 'created_at'];
const DOCUMENT_TYPES = ['PDF', 'DOCX', 'XLSX', 'PPTX', 'PSD', 'AI', 'ZIP', 'PNG', 'JPEG', 'RAW', 'SVG'];

function parseHistory_(s) {
  if (!s) return [];
  try { return JSON.parse(s); } catch (e) { return []; }
}

const DocumentService = {
  _repo: function () {
    const r = new SheetRepository();
    r.ensureSheet(CONFIG.SHEETS.Documents, DOCUMENT_HEADERS);
    return r;
  },
  _drive: function () { return new DriveRepository(); },

  list: function () {
    return guardResult(function () {
      Auth.guard('document.read');
      return ok(DocumentService._repo().findAll(CONFIG.SHEETS.Documents));
    });
  },
  get: function (id) {
    return guardResult(function () {
      Auth.guard('document.read');
      const d = DocumentService._repo().findById(CONFIG.SHEETS.Documents, 'document_id', id);
      if (!d) throw AppError(ERR.NOT_FOUND, 'document ' + id);
      return ok(d);
    });
  },
  upload: function (input) {
    return guardResult(function () {
      Auth.guard('document.write');
      input = input || {};
      requireFields(input, ['name', 'type', 'blob']);
      assert_(DOCUMENT_TYPES.indexOf(String(input.type).toUpperCase()) >= 0, ERR.VALIDATION, 'unsupported type');
      const repo = DocumentService._repo();
      const type = String(input.type).toUpperCase();
      const file = DocumentService._drive().uploadTo([CONFIG.DRIVE.documents, type], input.blob, input.name);
      const history = [{ version: 1, drive_file_id: file.getId(), at: nowIso_() }];
      const rec = {
        document_id: nextId('Documents', repo.ids(CONFIG.SHEETS.Documents, 'document_id')),
        name: input.name,
        type: type,
        category: input.category || '',
        drive_file_id: file.getId(),
        version: 1,
        status: 'active',
        history: JSON.stringify(history),
        created_at: nowIso_()
      };
      repo.insert(CONFIG.SHEETS.Documents, rec);
      return ok(rec);
    });
  },
  /** Add a new version of an existing document. */
  newVersion: function (id, input) {
    return guardResult(function () {
      Auth.guard('document.write');
      input = input || {};
      requireFields(input, ['blob']);
      const repo = DocumentService._repo();
      const d = repo.findById(CONFIG.SHEETS.Documents, 'document_id', id);
      if (!d) throw AppError(ERR.NOT_FOUND, 'document ' + id);
      const history = parseHistory_(d.history);
      const version = history.length + 1;
      const file = DocumentService._drive().uploadTo([CONFIG.DRIVE.documents, d.type], input.blob, d.name);
      history.push({ version: version, drive_file_id: file.getId(), at: nowIso_() });
      return ok(repo.update(CONFIG.SHEETS.Documents, 'document_id', id, {
        drive_file_id: file.getId(), version: version, history: JSON.stringify(history)
      }));
    });
  },
  history: function (id) {
    return guardResult(function () {
      Auth.guard('document.read');
      const d = DocumentService._repo().findById(CONFIG.SHEETS.Documents, 'document_id', id);
      if (!d) throw AppError(ERR.NOT_FOUND, 'document ' + id);
      return ok(parseHistory_(d.history));
    });
  },
  /** Soft delete (reversible): mark status='deleted'. Editor+ (document.write). */
  softDelete: function (id) {
    return guardResult(function () {
      Auth.guard('document.write');
      return ok(DocumentService._repo().update(CONFIG.SHEETS.Documents, 'document_id', id, { status: 'deleted' }));
    });
  },
  restore: function (id) {
    return guardResult(function () {
      Auth.guard('document.write');
      return ok(DocumentService._repo().update(CONFIG.SHEETS.Documents, 'document_id', id, { status: 'active' }));
    });
  },
  remove: function (id) {
    return guardResult(function () {
      Auth.guard('document.delete');
      DocumentService._repo().deleteById(CONFIG.SHEETS.Documents, 'document_id', id);
      return ok({ deleted: id });
    });
  }
};
