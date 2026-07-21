const Datastore = require('nedb-promises');
const path = require('path');
const { app, ipcMain } = require('electron');

// Store data in %APPDATA%/maqder-desktop/data/
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'data');

const db = {
  invoices: Datastore.create({ filename: path.join(dbPath, 'invoices.db'), autoload: true }),
  customers: Datastore.create({ filename: path.join(dbPath, 'customers.db'), autoload: true }),
  products: Datastore.create({ filename: path.join(dbPath, 'products.db'), autoload: true }),
  settings: Datastore.create({ filename: path.join(dbPath, 'settings.db'), autoload: true }),
};

// Add timestamps and indices automatically where needed
db.invoices.ensureIndex({ fieldName: 'createdAt' });
db.invoices.ensureIndex({ fieldName: '_syncStatus' });

/**
 * Register all IPC handlers for database operations.
 * Must be called in main.js
 */
function registerDbIpcHandlers() {
  // Invoices
  ipcMain.handle('db:invoices:insert', async (event, doc) => {
    doc.createdAt = new Date();
    doc.updatedAt = new Date();
    doc._syncStatus = 'local';
    return await db.invoices.insert(doc);
  });
  
  ipcMain.handle('db:invoices:find', async (event, query) => {
    return await db.invoices.find(query).sort({ createdAt: -1 });
  });

  ipcMain.handle('db:invoices:update', async (event, query, update, options) => {
    if (update.$set) update.$set.updatedAt = new Date();
    return await db.invoices.update(query, update, options);
  });

  ipcMain.handle('db:invoices:remove', async (event, query, options) => {
    return await db.invoices.remove(query, options);
  });

  // Customers
  ipcMain.handle('db:customers:insert', async (event, doc) => {
    doc.createdAt = new Date();
    doc.updatedAt = new Date();
    doc._syncStatus = 'local';
    return await db.customers.insert(doc);
  });

  ipcMain.handle('db:customers:find', async (event, query) => {
    return await db.customers.find(query);
  });

  // Products
  ipcMain.handle('db:products:insert', async (event, doc) => {
    return await db.products.insert(doc);
  });

  ipcMain.handle('db:products:find', async (event, query) => {
    return await db.products.find(query);
  });

  // Settings
  ipcMain.handle('db:settings:get', async (event, key) => {
    const doc = await db.settings.findOne({ key });
    return doc ? doc.value : null;
  });

  ipcMain.handle('db:settings:set', async (event, key, value) => {
    return await db.settings.update({ key }, { key, value }, { upsert: true });
  });
}

module.exports = {
  db,
  registerDbIpcHandlers
};
