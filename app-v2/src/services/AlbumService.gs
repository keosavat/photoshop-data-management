/**
 * AlbumService.gs — Album module (see docs-v2/06_module_specs/albums.md).
 */
const ALBUM_HEADERS = ['album_id', 'name', 'customer_id', 'cover_photo_id', 'status', 'created_at'];

const AlbumService = {
  _repo: function () {
    const r = new SheetRepository();
    r.ensureSheet(CONFIG.SHEETS.Albums, ALBUM_HEADERS);
    return r;
  },
  list: function () {
    return guardResult(function () {
      Auth.guard('album.read');
      return ok(AlbumService._repo().findAll(CONFIG.SHEETS.Albums));
    });
  },
  get: function (id) {
    return guardResult(function () {
      Auth.guard('album.read');
      const a = AlbumService._repo().findById(CONFIG.SHEETS.Albums, 'album_id', id);
      if (!a) throw AppError(ERR.NOT_FOUND, 'album ' + id);
      return ok(a);
    });
  },
  create: function (input) {
    return guardResult(function () {
      Auth.guard('album.write');
      input = input || {};
      requireFields(input, ['name']);
      const repo = AlbumService._repo();
      const rec = {
        album_id: nextId('Albums', repo.ids(CONFIG.SHEETS.Albums, 'album_id')),
        name: input.name,
        customer_id: input.customer_id || '',
        cover_photo_id: input.cover_photo_id || '',
        status: 'active',
        created_at: nowIso_()
      };
      repo.insert(CONFIG.SHEETS.Albums, rec);
      return ok(rec);
    });
  },
  update: function (id, patch) {
    return guardResult(function () {
      Auth.guard('album.write');
      return ok(AlbumService._repo().update(CONFIG.SHEETS.Albums, 'album_id', id, patch || {}));
    });
  },
  archive: function (id) {
    return guardResult(function () {
      Auth.guard('album.write');
      return ok(AlbumService._repo().update(CONFIG.SHEETS.Albums, 'album_id', id, { status: 'archived' }));
    });
  },
  setCover: function (id, photoId) {
    return guardResult(function () {
      Auth.guard('album.write');
      return ok(AlbumService._repo().update(CONFIG.SHEETS.Albums, 'album_id', id, { cover_photo_id: photoId }));
    });
  },
  remove: function (id) {
    return guardResult(function () {
      Auth.guard('album.delete');
      AlbumService._repo().deleteById(CONFIG.SHEETS.Albums, 'album_id', id);
      return ok({ deleted: id });
    });
  }
};
