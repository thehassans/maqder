const { ipcMain } = require('electron');
const axios = require('axios');
const { db } = require('../db/database');

// Default API URL (can be updated from settings)
let API_BASE_URL = 'https://maqder.com/api';
// In development, you might want to use: 'http://localhost:5000/api'

let syncInterval = null;
let currentToken = null;

/**
 * Update the API URL based on settings or env
 */
async function loadSyncSettings() {
  const url = await db.settings.findOne({ key: 'api_url' });
  if (url && url.value) {
    API_BASE_URL = url.value;
  }
  const token = await db.settings.findOne({ key: 'auth_token' });
  if (token && token.value) {
    currentToken = token.value;
  }
}

/**
 * Helper to emit events to the renderer process
 */
function emitSyncEvent(window, status, message, payload = null) {
  if (window && !window.isDestroyed()) {
    window.webContents.send('sync:event', { status, message, payload });
  }
}

/**
 * Pushes unsynced data (invoices, customers) to the cloud
 */
async function pushToCloud(mainWindow) {
  if (!currentToken) return false;

  try {
    emitSyncEvent(mainWindow, 'pushing', 'Pushing data to cloud...');
    
    // Find unsynced records
    const unsyncedInvoices = await db.invoices.find({ _syncStatus: 'local' });
    const unsyncedCustomers = await db.customers.find({ _syncStatus: 'local' });

    if (unsyncedInvoices.length === 0 && unsyncedCustomers.length === 0) {
      emitSyncEvent(mainWindow, 'idle', 'Nothing to push.');
      return true;
    }

    // Call backend push endpoint
    const response = await axios.post(\`\${API_BASE_URL}/desktop/sync/push\`, {
      invoices: unsyncedInvoices,
      customers: unsyncedCustomers
    }, {
      headers: { Authorization: \`Bearer \${currentToken}\` }
    });

    if (response.data.success) {
      // Mark as synced locally
      for (const inv of unsyncedInvoices) {
        await db.invoices.update({ _id: inv._id }, { $set: { _syncStatus: 'synced' } });
      }
      for (const cust of unsyncedCustomers) {
        await db.customers.update({ _id: cust._id }, { $set: { _syncStatus: 'synced' } });
      }
      
      emitSyncEvent(mainWindow, 'success', 'Push completed successfully.');
      return true;
    }
  } catch (error) {
    console.error('Push error:', error.message);
    emitSyncEvent(mainWindow, 'error', \`Push failed: \${error.message}\`);
    return false;
  }
}

/**
 * Pulls updated products, customers, and syncs settings from cloud
 */
async function pullFromCloud(mainWindow) {
  if (!currentToken) return false;

  try {
    emitSyncEvent(mainWindow, 'pulling', 'Pulling data from cloud...');
    
    const lastSyncDoc = await db.settings.findOne({ key: 'last_sync_timestamp' });
    const lastSync = lastSyncDoc ? lastSyncDoc.value : null;

    const response = await axios.get(\`\${API_BASE_URL}/desktop/sync/pull\`, {
      params: { since: lastSync },
      headers: { Authorization: \`Bearer \${currentToken}\` }
    });

    if (response.data.success) {
      const { products, customers } = response.data.data;

      // Upsert products
      if (products && products.length > 0) {
        for (const p of products) {
          await db.products.update({ _id: p._id }, p, { upsert: true });
        }
      }

      // Upsert customers (server wins)
      if (customers && customers.length > 0) {
        for (const c of customers) {
          c._syncStatus = 'synced';
          await db.customers.update({ _id: c._id }, c, { upsert: true });
        }
      }

      // Update last sync timestamp
      await db.settings.update(
        { key: 'last_sync_timestamp' },
        { key: 'last_sync_timestamp', value: new Date().toISOString() },
        { upsert: true }
      );

      emitSyncEvent(mainWindow, 'success', 'Pull completed successfully.');
      return true;
    }
  } catch (error) {
    console.error('Pull error:', error.message);
    emitSyncEvent(mainWindow, 'error', \`Pull failed: \${error.message}\`);
    return false;
  }
}

/**
 * Full sync cycle (Push then Pull)
 */
async function performSync(mainWindow) {
  await loadSyncSettings();
  if (!currentToken) return;

  emitSyncEvent(mainWindow, 'syncing', 'Starting sync cycle...');
  const pushSuccess = await pushToCloud(mainWindow);
  if (pushSuccess) {
    await pullFromCloud(mainWindow);
  }
}

/**
 * Start the background sync interval
 */
function startBackgroundSync(mainWindow, intervalMs = 60000) {
  if (syncInterval) clearInterval(syncInterval);
  
  syncInterval = setInterval(() => {
    performSync(mainWindow);
  }, intervalMs);
}

/**
 * Register IPC Handlers for manual sync triggers from renderer
 */
function registerSyncIpcHandlers(mainWindow) {
  ipcMain.handle('sync:pushToCloud', async () => {
    return await pushToCloud(mainWindow);
  });

  ipcMain.handle('sync:pullFromCloud', async () => {
    return await pullFromCloud(mainWindow);
  });

  ipcMain.handle('sync:getStatus', async () => {
    // Return counts of unsynced items
    const unsyncedInvoices = await db.invoices.count({ _syncStatus: 'local' });
    const unsyncedCustomers = await db.customers.count({ _syncStatus: 'local' });
    const lastSync = await db.settings.findOne({ key: 'last_sync_timestamp' });
    
    return {
      unsyncedInvoices,
      unsyncedCustomers,
      lastSyncTimestamp: lastSync ? lastSync.value : null
    };
  });
}

module.exports = {
  performSync,
  startBackgroundSync,
  registerSyncIpcHandlers
};
