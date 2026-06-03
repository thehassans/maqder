import { openDB } from 'idb';

const DB_NAME = 'maqder_bakala_pos';
const DB_VERSION = 1;

export const initBakalaDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('products_cache')) {
        db.createObjectStore('products_cache', { keyPath: 'primaryBarcode' });
      }
      if (!db.objectStoreNames.contains('offline_invoices')) {
        const store = db.createObjectStore('offline_invoices', { keyPath: 'offlineId' });
        store.createIndex('timestamp', 'timestamp');
      }
      if (!db.objectStoreNames.contains('pending_daftar_charges')) {
        const store = db.createObjectStore('pending_daftar_charges', { keyPath: 'offlineId' });
        store.createIndex('timestamp', 'timestamp');
      }
    },
  });
};

export const saveOfflineInvoice = async (invoice) => {
  const db = await initBakalaDB();
  await db.put('offline_invoices', {
    ...invoice,
    timestamp: Date.now()
  });
};

export const getOfflineInvoices = async () => {
  const db = await initBakalaDB();
  return db.getAllFromIndex('offline_invoices', 'timestamp');
};

export const removeOfflineInvoice = async (offlineId) => {
  const db = await initBakalaDB();
  await db.delete('offline_invoices', offlineId);
};

export const saveProductsCache = async (products) => {
  const db = await initBakalaDB();
  const tx = db.transaction('products_cache', 'readwrite');
  await Promise.all([
    ...products.map(product => tx.store.put(product)),
    tx.done
  ]);
};

export const getProductByBarcode = async (barcode) => {
  const db = await initBakalaDB();
  return db.get('products_cache', barcode);
};

export const getAllProducts = async () => {
  const db = await initBakalaDB();
  return db.getAll('products_cache');
};
