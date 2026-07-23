/**
 * DocumentService.gs — Service Layer: Document Management (STEP 10).
 * ອ້າງອີງ Book 1: §13 (RBAC), §22.1 (Layer), §45 (Lifecycle), §50 (Import/Export), §52 (Audit).
 * Pipeline: Validate → File-type/Safety check → Drive → Metadata → Sheet → Audit.
 * ຮຽກຜ່ານ DriveService (uploadDocument) + Database ເທົ່ານັ້ນ.
 *
 * Document State (Config.ENUMS.DocStatus): Uploading → Ready → Archived → Deleted.
 */

/** File-type + safety gate. ໝາຍເຫດ: AV scan ຈິງເປັນ integration point ອະນາຄົດ (hook ນີ້). */
function _scanDocument_(name, mime, bytes) {
  var ext = (name.indexOf('.') >= 0) ? name.split('.').pop().toLowerCase() : '';
  var allowed = String(getConfig('DOC_ALLOWED_EXTENSIONS')).split(',');
  if (allowed.indexOf(ext) < 0) throw new Error('E006: ນາມສະກຸນເອກະສານບໍ່ຮອງຮັບ: ' + ext);
  // TODO(future): ຮຽກ external AV API ທີ່ນີ້ (Book 1 §51 Integration + ADR).
  return { ext: ext, safe: true };
}

/**
 * Upload ເອກະສານຜ່ານ pipeline ເຕັມ. ຕ້ອງຜ່ານ CSRF + RBAC.
 * payload = { name, mime, dataBase64, title, category, customerCode, orderId, replacesDocId }
 * Version Control: ຖ້າມີ replacesDocId → old.Status=Archived, ໃໝ່ Version=old.Version+1.
 */
function documentUpload(payload, token, csrf, meta) {
  var user = requireCsrf(token, csrf);
  if (!can(user, 'documents', 'create')) { audit('PERMISSION_DENIED', user.userId, 'documents/create', meta); throw new Error('E005: ' + tAuth('error.E005')); }
  payload = payload || {};
  if (!payload.title) throw new Error('E_VALIDATION: ' + t('validation.required', { field: 'Title' }, (meta && meta.lang)));
  var category = String(payload.category || 'other').toLowerCase();
  if (getDocCategories().indexOf(category) < 0) throw new Error('E_VALIDATION: category ' + category);

  var bytes = Utilities.base64Decode(payload.dataBase64);
  _scanDocument_(payload.name || '', payload.mime, bytes);
  var hash = _docHash_(bytes);

  // Version control
  var version = 1, replaces = '';
  if (payload.replacesDocId) {
    var old = getById('Documents', payload.replacesDocId);
    if (old) { version = Number(old.Version || 1) + 1; replaces = old.DocID; update('Documents', old.DocID, { Status: 'Archived' }, user.userId); }
  }

  var rec = create('Documents', {
    CustomerCode: payload.customerCode, OrderID: payload.orderId || '',
    Title: payload.title, Category: category, FileName: payload.name, MimeType: payload.mime,
    Hash: hash, Version: version, ReplacesDocID: replaces, Status: 'Uploading'
  }, user.userId);

  try {
    var blob = Utilities.newBlob(bytes, payload.mime, payload.name);
    var drive = uploadDocument(blob, { customerCode: payload.customerCode, category: category, id: rec.DocID, name: payload.name });
    update('Documents', rec.DocID, { DriveFileID: drive.fileId, Status: 'Ready' }, user.userId);
    audit('DOC_UPLOADED', user.userId, rec.DocID, meta);
    indexRef('document', rec.DocID);                          // incremental index (STEP 11)
    if (replaces) indexRef('document', replaces);             // re-index old (now Archived)
    invalidateDashboardCache();
    return { docId: rec.DocID, fileId: drive.fileId, previewUrl: drive.previewUrl, version: version, status: 'Ready' };
  } catch (e) {
    update('Documents', rec.DocID, { Status: 'Uploading' }, user.userId);
    audit('DOC_UPLOAD_FAILED', user.userId, rec.DocID + ' ' + e.message, meta);
    throw e;
  }
}

function _docHash_(bytes) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes);
  var hex = '';
  for (var i = 0; i < digest.length; i++) { var b = (digest[i] & 0xFF).toString(16); hex += (b.length === 1 ? '0' : '') + b; }
  return hex;
}

/** ລາຍການເອກະສານ (default: ສະບັບຫຼ້າສຸດ — ບໍ່ລວມ Archived/Deleted). */
function listDocuments(opt) {
  opt = opt || {};
  return listAll('Documents').filter(function (d) {
    if (!opt.includeArchived && (d.Status === 'Archived' || d.Status === 'Deleted')) return false;
    if (opt.customerCode && d.CustomerCode !== opt.customerCode) return false;
    if (opt.category && d.Category !== opt.category) return false;
    return true;
  }).map(_docBrief_);
}

/** Search & Filters: Title / Category / FileName / Date / CustomerCode. */
function searchDocuments(query, filters) {
  filters = filters || {};
  var q = String(query || '').toLowerCase();
  return listAll('Documents').filter(function (d) {
    if (d.Status === 'Deleted') return false;
    if (filters.category && d.Category !== filters.category) return false;
    if (filters.customerCode && d.CustomerCode !== filters.customerCode) return false;
    if (filters.date && String(d.CreatedAt).indexOf(filters.date) < 0) return false;
    if (q) {
      var hay = [d.Title, d.Category, d.FileName, d.CustomerCode].join(' ').toLowerCase();
      if (hay.indexOf(q) < 0) return false;
    }
    return true;
  }).map(_docBrief_);
}

function _docBrief_(d) {
  return { docId: d.DocID, title: d.Title, category: d.Category, fileName: d.FileName,
           customerCode: d.CustomerCode, version: d.Version, status: d.Status, createdAt: String(d.CreatedAt || '') };
}

/** Preview URL (RBAC: documents.view). */
function getDocumentPreview(docId, token) {
  var user = getSession(token) || getCurrentUser();   // fallback: token ໝົດອາຍຸ → ໃຊ້ Google identity ຈິງ (USER_ACCESSING)
  if (!user || !can(user, 'documents', 'view')) throw new Error('E005: ' + tAuth('error.E005'));
  var d = getById('Documents', docId);
  if (!d || !d.DriveFileID) throw new Error('E004: document ' + docId);
  audit('DOC_PREVIEW', user.userId, docId, null);
  return { previewUrl: getDrivePreviewUrl(d.DriveFileID) };
}

/** Download URL (RBAC: documents.view) — ຄວບຄຸມສິດຕາມ §13. */
function getDocumentDownload(docId, token) {
  var user = getSession(token) || getCurrentUser();   // fallback: token ໝົດອາຍຸ → Google identity ຈິງ
  if (!user || !can(user, 'documents', 'view')) throw new Error('E005: ' + tAuth('error.E005'));
  var d = getById('Documents', docId);
  if (!d || !d.DriveFileID) throw new Error('E004: document ' + docId);
  audit('DOC_DOWNLOAD', user.userId, docId, null);
  return { url: DriveApp.getFileById(d.DriveFileID).getUrl() };
}

/** ຄືນ URL ທັງໝົດ (view/preview/download) ສຳລັບປຸ່ມ ເບິ່ງ/ໂຫລດ/ປຣີ້ນ. RBAC: documents.view. */
function getDocumentLinks(docId, token) {
  var user = getSession(token) || getCurrentUser();
  if (!user || !can(user, 'documents', 'view')) throw new Error('E005: ' + tAuth('error.E005'));
  var d = getById('Documents', docId);
  if (!d || !d.DriveFileID) throw new Error('E004: document ' + docId);
  var id = d.DriveFileID;
  return {
    fileId: id,
    view: 'https://drive.google.com/file/d/' + id + '/view',
    preview: 'https://drive.google.com/file/d/' + id + '/preview',
    download: 'https://drive.google.com/uc?export=download&id=' + id,
    name: String(d.FileName || d.Title || docId)
  };
}

/** ເປີດ link-sharing (ໃຜມີ link ເບິ່ງໄດ້) ແລ້ວຄືນ link ສຳລັບແຊ. RBAC: documents.view. */
function shareDocument(docId, token) {
  var user = getSession(token) || getCurrentUser();
  if (!user || !can(user, 'documents', 'view')) throw new Error('E005: ' + tAuth('error.E005'));
  var d = getById('Documents', docId);
  if (!d || !d.DriveFileID) throw new Error('E004: document ' + docId);
  try { DriveApp.getFileById(d.DriveFileID).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
  audit('DOC_SHARED', user.userId, docId, null);
  return { url: 'https://drive.google.com/file/d/' + d.DriveFileID + '/view' };
}

/** ປະຫວັດ Version (ຕາມ ReplacesDocID chain). */
function getDocumentVersions(docId) {
  var chain = [];
  var cur = getById('Documents', docId);
  var guard = 0;
  while (cur && guard++ < 50) {
    chain.push(_docBrief_(cur));
    cur = cur.ReplacesDocID ? getById('Documents', cur.ReplacesDocID) : null;
  }
  return chain;
}
