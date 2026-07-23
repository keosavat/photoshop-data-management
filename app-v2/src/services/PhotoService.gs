/**
 * PhotoService.gs — Photo module (see docs-v2/06_module_specs/photos.md).
 * Upload → SHA-256 dedup → Drive store → Sheet record. RBAC guarded.
 */
const PHOTO_HEADERS = ['photo_id', 'album_id', 'customer_id', 'name', 'drive_file_id',
  'sha256', 'size', 'favorite', 'status', 'created_at'];

function sha256Hex_(blob) {
  const bytes = blob.getBytes();
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes);
  return digest.map(function (b) {
    const v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

const PhotoService = {
  _repo: function () {
    const r = new SheetRepository();
    r.ensureSheet(CONFIG.SHEETS.Photos, PHOTO_HEADERS);
    return r;
  },
  _drive: function () { return new DriveRepository(); },

  list: function (albumId) {
    return guardResult(function () {
      Auth.guard('photo.read');
      let rows = PhotoService._repo().findAll(CONFIG.SHEETS.Photos);
      if (albumId) rows = rows.filter(function (p) { return String(p.album_id) === String(albumId); });
      return ok(rows);
    });
  },

  get: function (id) {
    return guardResult(function () {
      Auth.guard('photo.read');
      const p = PhotoService._repo().findById(CONFIG.SHEETS.Photos, 'photo_id', id);
      if (!p) throw AppError(ERR.NOT_FOUND, 'photo ' + id);
      return ok(p);
    });
  },

  /** Upload a blob. input: { blob, name, album_id?, customer_id? }. Dedups by sha256. */
  upload: function (input) {
    return guardResult(function () {
      Auth.guard('photo.write');
      input = input || {};
      requireFields(input, ['name', 'blob']);
      const repo = PhotoService._repo();
      const hash = sha256Hex_(input.blob);

      const existing = repo.findAll(CONFIG.SHEETS.Photos).filter(function (p) {
        return p.sha256 === hash && p.status !== 'deleted';
      })[0];
      if (existing) return ok(existing, { deduped: true });

      const album = input.album_id || '_unsorted';
      const file = PhotoService._drive().uploadTo([CONFIG.DRIVE.albums, album], input.blob, input.name);
      const rec = {
        photo_id: nextId('Photos', repo.ids(CONFIG.SHEETS.Photos, 'photo_id')),
        album_id: input.album_id || '',
        customer_id: input.customer_id || '',
        name: input.name,
        drive_file_id: file.getId(),
        sha256: hash,
        size: (input.blob.getBytes ? input.blob.getBytes().length : 0),
        favorite: false,
        status: 'active',
        created_at: nowIso_()
      };
      repo.insert(CONFIG.SHEETS.Photos, rec);
      return ok(rec, { deduped: false });
    });
  },

  move: function (id, albumId) {
    return guardResult(function () {
      Auth.guard('photo.write');
      return ok(PhotoService._repo().update(CONFIG.SHEETS.Photos, 'photo_id', id, { album_id: albumId }));
    });
  },

  setFavorite: function (id, fav) {
    return guardResult(function () {
      Auth.guard('photo.write');
      return ok(PhotoService._repo().update(CONFIG.SHEETS.Photos, 'photo_id', id, { favorite: !!fav }));
    });
  },

  softDelete: function (id) {
    return guardResult(function () {
      Auth.guard('photo.write');
      return ok(PhotoService._repo().update(CONFIG.SHEETS.Photos, 'photo_id', id, { status: 'deleted' }));
    });
  },

  restore: function (id) {
    return guardResult(function () {
      Auth.guard('photo.write');
      return ok(PhotoService._repo().update(CONFIG.SHEETS.Photos, 'photo_id', id, { status: 'active' }));
    });
  },

  remove: function (id) {
    return guardResult(function () {
      Auth.guard('photo.delete');
      PhotoService._repo().deleteById(CONFIG.SHEETS.Photos, 'photo_id', id);
      return ok({ deleted: id });
    });
  }
};
