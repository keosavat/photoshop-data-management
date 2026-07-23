/**
 * Config.gs — ຄ່າ configuration ກາງ ແລະ SCHEMA (STEP 3).
 * ອ້າງອີງ Book 1: §13 (Security), §44 (Configuration Management), §6/§10 (Database/Naming).
 * ຄ່າ sensitive (ROOT_FOLDER_ID, SHEET_ID) ເກັບໃນ PropertiesService — ຫ້າມ commit ລົງ Git (§13).
 */

// ---- ຄ່າ default (override ໄດ້ຜ່ານ Script Properties) ----
var CONFIG_DEFAULTS = {
  DEFAULT_LANGUAGE: 'lo',              // lo | th | en
  MAX_UPLOAD_MB: 25,                   // ຂະໜາດ upload ສູງສຸດ (MB)
  ALLOWED_EXTENSIONS: 'jpg,jpeg,png,pdf,heic',
  THUMBNAIL_SIZE: 400,                 // px ດ້ານຍາວ Thumbnail
  CACHE_TIME_SEC: 300,                 // ອາຍຸ Cache (§48)
  DOC_ALLOWED_EXTENSIONS: 'pdf,jpg,jpeg,png,docx,xlsx',           // ນາມສະກຸນເອກະສານ (STEP 10)
  DOC_CATEGORIES: 'passport,visa,id_card,certificate,contract,other', // ໝວດເອກະສານ (ເພີ່ມໄດ້ — STEP 10)
  SYSTEM_VERSION: '1.0.0',
  SCHEMA_VERSION: '1.4.0'              // 1.4.0: Metrics snapshots — STEP 14
};

/** ອ່ານຄ່າ config: Script Property ກ່ອນ, ຖ້າບໍ່ມີໃຊ້ default. */
function getConfig(key) {
  var v = PropertiesService.getScriptProperties().getProperty(key);
  if (v !== null && v !== '') return v;
  if (key in CONFIG_DEFAULTS) return CONFIG_DEFAULTS[key];
  return null;
}

/** ຕັ້ງຄ່າ config (ໃຊ້ຕອນ setup ຫຼືໜ້າ Settings — Phase 13). */
function setConfig(key, value) {
  PropertiesService.getScriptProperties().setProperty(key, String(value));
}

function getRootFolderId()  { return getConfig('ROOT_FOLDER_ID'); }
function getSpreadsheetId() { return getConfig('SHEET_ID'); }

// ======================================================================
//  SCHEMA — single source of truth (ໃຊ້ໂດຍ Migration + Database + validate)
//  ທຸກ Sheet (ຍົກເວັ້ນ append_only) ຈະໄດ້ຮັບ SOFT_DELETE_COLS + AUDIT_COLS ອັດຕະໂນມັດ.
// ======================================================================
var AUDIT_COLS       = ['CreatedBy', 'CreatedAt', 'UpdatedBy', 'UpdatedAt'];
var SOFT_DELETE_COLS = ['IsDeleted', 'DeletedAt', 'DeletedBy'];

var SCHEMA = {
  Users:     { prefix: 'USR',   pk: 'UserID',       fields: ['UserID', 'Email', 'Name', 'Role', 'Active'] },
  Customers: { prefix: 'CUS',   pk: 'CustomerCode', fields: ['CustomerCode', 'Name', 'Phone', 'Note'] },
  Photos:    { prefix: 'PHOTO', pk: 'PhotoID',      fields: ['PhotoID', 'CustomerCode', 'Category', 'DriveFileID', 'ThumbID', 'Hash', 'UploadedBy', 'Version', 'Status'] },
  Orders:    { prefix: 'ORD',   pk: 'OrderID',      fields: ['OrderID', 'CustomerCode', 'Status', 'Type', 'Priority', 'AssignedTo'] },
  Documents: { prefix: 'DOC',   pk: 'DocID',        fields: ['DocID', 'CustomerCode', 'OrderID', 'Title', 'Category', 'FileName', 'MimeType', 'Hash', 'DriveFileID', 'Version', 'ReplacesDocID', 'Status'] },
  AuditLogs: { prefix: 'LOG',   pk: 'LogID',        fields: ['LogID', 'EventType', 'UserID', 'Detail', 'IP', 'Browser', 'Device', 'Timestamp'], append_only: true },
  SchemaMigrations: { prefix: 'MIG', pk: 'MigrationID', fields: ['MigrationID', 'Version', 'AppliedAt', 'AppliedBy'], append_only: true },
  // Unified Search Index (STEP 11 §47) — derived data, ບໍ່ audit/soft-delete
  SearchIndex: { prefix: 'IDX', pk: 'IndexID', fields: ['IndexID', 'RefType', 'RefID', 'CustomerCode', 'OrderID', 'Category', 'Name', 'FileType', 'Status', 'Keywords', 'Date'], append_only: true },
  // Metrics snapshots (STEP 14 §35/§37) — flush ຈາກ CacheService aggregates
  Metrics: { prefix: 'MET', pk: 'MetricID', fields: ['MetricID', 'Name', 'Count', 'AvgMs', 'MaxMs', 'CacheHitRate', 'At'], append_only: true }
};

// enum ທີ່ຍອມຮັບ (ໃຊ້ຕອນ validate)
var ENUMS = {
  Role:        ['Admin', 'Editor', 'Viewer'],                                          // §13
  Category:    ['general', 'event', 'id', 'restoration'],
  OrderStatus: ['New', 'Uploaded', 'Verified', 'Printing', 'Completed', 'Archived'],   // §55 State Machine
  OrderType:   ['print', 'event', 'id', 'restoration'],
  Priority:    ['Normal', 'Urgent'],                                                   // ພິມດ່ວນ
  PhotoStatus: ['Uploading', 'Processing', 'Ready', 'Archived', 'Deleted'],            // §55 Photo state (STEP 9)
  DocStatus:   ['Uploading', 'Ready', 'Archived', 'Deleted']                           // Document state (STEP 10)
};

/** ໝວດເອກະສານ (dynamic — ເພີ່ມໄດ້ຜ່ານ Settings). */
function getDocCategories() {
  return String(getConfig('DOC_CATEGORIES')).split(',').map(function (s) { return s.trim(); }).filter(String);
}
/** ເພີ່ມໝວດເອກະສານໃໝ່ (idempotent). */
function addDocCategory(name) {
  name = String(name).trim().toLowerCase();
  if (!name) return getDocCategories();
  var list = getDocCategories();
  if (list.indexOf(name) < 0) { list.push(name); setConfig('DOC_CATEGORIES', list.join(',')); }
  return list;
}

/** ຄືນລາຍຊື່ Column ເຕັມຂອງ Sheet (fields + soft-delete + audit). */
function headersFor(sheetName) {
  var s = SCHEMA[sheetName];
  if (!s) throw new Error('E004: Unknown sheet ' + sheetName);
  var cols = s.fields.slice();
  if (!s.append_only) cols = cols.concat(SOFT_DELETE_COLS).concat(AUDIT_COLS);
  return cols;
}
