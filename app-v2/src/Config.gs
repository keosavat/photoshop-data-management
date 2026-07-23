/**
 * Config.gs — central configuration for PhotoShop Enterprise DAMS v2.0
 * ໄຟລ໌ຕັ້ງຄ່າກາງ. ບໍ່ເກັບ secret ໃນນີ້ — ໃຊ້ Script Properties.
 */
const CONFIG = {
  APP: { name: 'PhotoShop Enterprise DAMS', version: '2.0.0' },

  // Google Sheets tab names (see docs-v2/03)
  SHEETS: {
    Customers: 'Customers',
    Albums: 'Albums',
    Photos: 'Photos',
    Documents: 'Documents',
    Orders: 'Orders',
    OrderItems: 'OrderItems',
    Payments: 'Payments',
    PrintJobs: 'PrintJobs',
    Users: 'Users',
    Settings: 'Settings',
    Logs: 'Logs'
  },

  // ID prefixes (see docs-v2/03 §ID strategy)
  ID_PREFIX: {
    Customers: 'CUS',
    Albums: 'ALB',
    Photos: 'PHO',
    Documents: 'DOC',
    Orders: 'ORD',
    OrderItems: 'ITM',
    Payments: 'PAY',
    PrintJobs: 'PRT',
    Users: 'USR'
  },
  ID_PAD: 4,

  // Drive folder layout (see docs-v2/04)
  DRIVE: {
    root: 'PhotoShop-DAMS',
    customers: 'Customers',
    albums: 'Albums',
    documents: 'Documents',
    orders: 'Orders',
    thumbnails: '_Thumbnails',
    recycleBin: '_RecycleBin'
  },

  // Roles ordered high → low privilege (see docs-v2/06 settings)
  ROLES: ['Owner', 'Admin', 'Manager', 'Editor', 'Staff', 'Viewer'],

  CACHE_TTL_SEC: 300
};

/** Read a Script Property (e.g. SHEET_ID). */
function getProp_(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}
