/**
 * PhotoService.gs — Service Layer: Photo Archive Core (STEP 9).
 * ອ້າງອີງ Book 1: §22.1 (Layer), §45 (Lifecycle), §46 (Background), §52 (Audit), §53 (Workflow), §55 (State), §56 (SLA).
 * Pipeline: Upload → Validate → Hash → Drive → Thumbnail → Metadata → Sheet → Audit.
 * ຮຽກຜ່ານ DriveService (uploadPhoto/moveToArchive) + Database (create/update) ເທົ່ານັ້ນ.
 *
 * Photo State Machine (§55): Uploading → Processing → Ready → Archived → Deleted.
 * ໝາຍເຫດ naming: DriveService ມີ uploadPhoto(blob,opts); Service ນີ້ໃຊ້ຊື່ photoUpload() ເພື່ອຫຼີກ collision.
 */

/** SHA256 hex ຂອງ bytes (Duplicate Detection — Photos.Hash STEP 3). */
function computePhotoHash(bytes) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes);
  var hex = '';
  for (var i = 0; i < digest.length; i++) {
    var b = (digest[i] & 0xFF).toString(16);
    hex += (b.length === 1 ? '0' : '') + b;
  }
  return hex;
}

/** ຫາຮູບຊ້ຳຕາມ hash (ບໍ່ລວມ soft-deleted). */
function findPhotoByHash(hash) {
  var found = listAll('Photos').filter(function (p) { return p.Hash === hash; });
  return found.length ? found[0] : null;
}

/**
 * Upload ຮູບ 1 ໄຟລ໌ ຜ່ານ pipeline ເຕັມ. ຕ້ອງຜ່ານ CSRF ກ່ອນ.
 * payload = { name, mime, dataBase64, customerCode, category, allowDuplicate }
 * ຄືນ { photoId, fileId, thumbUrl, hash, status } ຫຼື { duplicate:true, existing }.
 */
function photoUpload(payload, token, csrf, meta) {
  var t0 = Date.now();
  var user = requireCsrf(token, csrf);          // CSRF + session (STEP 9)
  if (!can(user, 'photos', 'create')) { audit('PERMISSION_DENIED', user.userId, 'photos/create', meta); throw new Error('E005: ' + tAuth('error.E005')); }
  rateLimit_(user.userId, 'upload', 120);       // §13.2 rate limit (STEP 14)
  payload = payload || {};

  var bytes = Utilities.base64Decode(payload.dataBase64);
  var hash = computePhotoHash(bytes);

  // Duplicate Detection (SHA256)
  if (!payload.allowDuplicate) {
    var dup = findPhotoByHash(hash);
    if (dup) { audit('PHOTO_DUPLICATE', user.userId, dup.PhotoID, meta); return { duplicate: true, existing: dup.PhotoID }; }
  }

  // 1) create metadata — Status=Uploading
  var rec = create('Photos', {
    CustomerCode: payload.customerCode, Category: payload.category || 'general',
    Hash: hash, UploadedBy: user.userId, Version: 1, Status: 'Uploading'
  }, user.userId);

  try {
    // 2) Processing — Drive upload + thumbnail (DriveService.uploadPhoto)
    update('Photos', rec.PhotoID, { Status: 'Processing' }, user.userId);
    var blob = Utilities.newBlob(bytes, payload.mime, payload.name);
    var drive = uploadPhoto(blob, { customerCode: payload.customerCode, category: payload.category, id: rec.PhotoID });

    // 3) Ready — ບັນທຶກ DriveFileID + ThumbID
    update('Photos', rec.PhotoID, { DriveFileID: drive.fileId, ThumbID: drive.thumbUrl, Status: 'Ready' }, user.userId);
    audit('PHOTO_UPLOADED', user.userId, rec.PhotoID, meta);
    indexRef('photo', rec.PhotoID);   // incremental index (STEP 11)
    invalidateDashboardCache();
    recordMetric('upload', Date.now() - t0);   // STEP 14 metric
    return { photoId: rec.PhotoID, fileId: drive.fileId, thumbUrl: drive.thumbUrl, hash: hash, status: 'Ready' };
  } catch (e) {
    // Error Recovery — ຄົງ record ໄວ້ (Status=Uploading) ເພື່ອ retry, ບໍ່ລຶບ
    update('Photos', rec.PhotoID, { Status: 'Uploading' }, user.userId);
    audit('PHOTO_UPLOAD_FAILED', user.userId, rec.PhotoID + ' ' + e.message, meta);
    throw e;
  }
}

/**
 * Batch Upload — ຫຼາຍໄຟລ໌ພ້ອມກັນ ພ້ອມ Error Recovery:
 * ໄຟລ໌ໃດລົ້ມ ບໍ່ຍົກເລີກທັງໝົດ — ຄືນ { success:[], failed:[], duplicates:[] }.
 * files = [ {name, mime, dataBase64}, ... ]
 */
function photoBatchUpload(files, opts, token, csrf, meta) {
  requireCsrf(token, csrf);                     // ກວດຄັ້ງດຽວ (csrf/session)
  opts = opts || {};
  var out = { success: [], failed: [], duplicates: [] };
  (files || []).forEach(function (f) {
    try {
      var r = photoUpload({
        name: f.name, mime: f.mime, dataBase64: f.dataBase64,
        customerCode: opts.customerCode, category: opts.category, allowDuplicate: opts.allowDuplicate
      }, token, csrf, meta);
      if (r.duplicate) out.duplicates.push({ name: f.name, existing: r.existing });
      else out.success.push({ name: f.name, photoId: r.photoId, thumbUrl: r.thumbUrl });
    } catch (e) {
      out.failed.push({ name: f.name, error: String(e.message) });   // Error Recovery — ໄປໄຟລ໌ຕໍ່ໄປ
    }
  });
  return out;
}

/** ແຜນທີ່ CustomerCode → Name (ອ່ານ Customers ຄັ້ງດຽວ ເພື່ອ join ໃສ່ຜົນ Photos). */
function _customerNameMap_() {
  var map = {};
  listAll('Customers').forEach(function (c) { map[c.CustomerCode] = c.Name || ''; });
  return map;
}

/** field ຫຍໍ້ຮ່ວມ ສຳລັບ gallery/search: ລະຫັດ (auto), ຊື່ລູກຄ້າ, ວັນທີ, ສະຖານະ. */
function _photoBrief_(p, custMap) {
  return {
    photoId: p.PhotoID, customerCode: p.CustomerCode,
    customerName: (custMap && custMap[p.CustomerCode]) || '',
    category: p.Category, thumbUrl: p.ThumbID, status: p.Status,
    createdAt: String(p.CreatedAt || '')
  };
}

/** ລາຍການຮູບ (gallery) — field ຫຍໍ້ສຳລັບ preview (lazy load ຝັ່ງ client). */
function listPhotos(opt) {
  opt = opt || {};
  var custMap = _customerNameMap_();
  var all = listAll('Photos').filter(function (p) {
    if (opt.customerCode && p.CustomerCode !== opt.customerCode) return false;
    if (opt.status && p.Status !== opt.status) return false;
    return true;
  });
  return all.map(function (p) { return _photoBrief_(p, custMap); });
}

/** ຄົ້ນຫາຮູບ — query (ລະຫັດ/ລູກຄ້າ/ຊື່ລູກຄ້າ/ໝວດ) + filters (category, status, customerCode, date). */
function searchPhotos(query, filters) {
  filters = filters || {};
  var q = String(query || '').toLowerCase();
  var custMap = _customerNameMap_();
  return listAll('Photos').filter(function (p) {
    if (p.Status === 'Deleted') return false;
    if (filters.category && p.Category !== filters.category) return false;
    if (filters.status && p.Status !== filters.status) return false;
    if (filters.customerCode && p.CustomerCode !== filters.customerCode) return false;
    if (filters.date && String(p.CreatedAt).indexOf(filters.date) < 0) return false;
    if (q) {
      var name = custMap[p.CustomerCode] || '';
      var hay = [p.PhotoID, p.CustomerCode, name, p.Category, p.Status].join(' ').toLowerCase();
      if (hay.indexOf(q) < 0) return false;
    }
    return true;
  }).map(function (p) { return _photoBrief_(p, custMap); });
}

/** ຄືນ URL ທັງໝົດ (view/preview/download) ຂອງຮູບ ສຳລັບປຸ່ມ ເບິ່ງ/ໂຫລດ/ປຣີ້ນ. RBAC: photos.view. */
function getPhotoLinks(photoId, token) {
  var user = getSession(token) || getCurrentUser();
  if (!user || !can(user, 'photos', 'view')) throw new Error('E005: ' + tAuth('error.E005'));
  var p = getById('Photos', photoId);
  if (!p || !p.DriveFileID) throw new Error('E004: photo ' + photoId);
  var id = p.DriveFileID;
  return {
    fileId: id,
    view: 'https://drive.google.com/file/d/' + id + '/view',
    preview: 'https://drive.google.com/file/d/' + id + '/preview',
    download: 'https://drive.google.com/uc?export=download&id=' + id,
    name: String(photoId)
  };
}

/** ເປີດ link-sharing (ໃຜມີ link ເບິ່ງໄດ້) ແລ້ວຄືນ link ສຳລັບແຊ. RBAC: photos.view. */
function sharePhoto(photoId, token) {
  var user = getSession(token) || getCurrentUser();
  if (!user || !can(user, 'photos', 'view')) throw new Error('E005: ' + tAuth('error.E005'));
  var p = getById('Photos', photoId);
  if (!p || !p.DriveFileID) throw new Error('E004: photo ' + photoId);
  try { DriveApp.getFileById(p.DriveFileID).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
  audit('PHOTO_SHARED', user.userId, photoId, null);
  return { url: 'https://drive.google.com/file/d/' + p.DriveFileID + '/view' };
}

/** Archive ຮູບ (state → Archived + ຍ້າຍໄຟລ໌ Drive ໄປ Archive). */
function archivePhoto(photoId, token, csrf, meta) {
  var user = requireCsrf(token, csrf);
  if (!can(user, 'photos', 'edit')) throw new Error('E005: ' + tAuth('error.E005'));
  var p = getById('Photos', photoId);
  if (!p) throw new Error('E004: photo ' + photoId);
  if (p.DriveFileID) moveToArchive(p.DriveFileID);   // DriveService
  update('Photos', photoId, { Status: 'Archived' }, user.userId);
  audit('PHOTO_ARCHIVED', user.userId, photoId, meta);
  indexRef('photo', photoId);   // re-index new status (STEP 11)
  return { photoId: photoId, status: 'Archived' };
}

/**
 * ລ້າງ record ຮູບທີ່ຄ້າງ (Status=Uploading ແລະບໍ່ມີ DriveFileID = upload ລົ້ມ).
 * ແລ່ນຈາກ editor ໄດ້ (Admin maintenance) — soft-delete ບໍ່ໃຫ້ສະແດງໃນ gallery.
 */
function cleanupFailedPhotos() {
  var cu = getCurrentUser();
  var actor = (cu && cu.userId) || 'admin';
  var n = 0;
  listAll('Photos').filter(function (p) { return p.Status === 'Uploading' && !p.DriveFileID; })
    .forEach(function (p) { softDelete('Photos', p.PhotoID, actor); indexRemove('photo', p.PhotoID); n++; });
  invalidateDashboardCache();
  Logger.log('cleanupFailedPhotos: removed ' + n);
  return { removed: n };
}
