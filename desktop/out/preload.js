const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  
  // Database operations
  db: {
    invoices: {
      insert: (doc) => ipcRenderer.invoke('db:invoices:insert', doc),
      find: (query) => ipcRenderer.invoke('db:invoices:find', query),
      update: (query, update, options) => ipcRenderer.invoke('db:invoices:update', query, update, options),
      remove: (query, options) => ipcRenderer.invoke('db:invoices:remove', query, options),
    },
    customers: {
      insert: (doc) => ipcRenderer.invoke('db:customers:insert', doc),
      find: (query) => ipcRenderer.invoke('db:customers:find', query),
    },
    products: {
      insert: (doc) => ipcRenderer.invoke('db:products:insert', doc),
      find: (query) => ipcRenderer.invoke('db:products:find', query),
    },
    settings: {
      get: (key) => ipcRenderer.invoke('db:settings:get', key),
      set: (key, value) => ipcRenderer.invoke('db:settings:set', key, value),
    }
  },

  // ZATCA specific
  zatca: {
    generatePhase1QR: (data) => ipcRenderer.invoke('zatca:generatePhase1QR', data)
  },

  // Sync operations
  sync: {
    pushToCloud: () => ipcRenderer.invoke('sync:pushToCloud'),
    pullFromCloud: () => ipcRenderer.invoke('sync:pullFromCloud'),
    getStatus: () => ipcRenderer.invoke('sync:getStatus'),
    onSyncEvent: (callback) => ipcRenderer.on('sync:event', (_event, value) => callback(value))
  },
  
  // Printing
  print: {
    invoice: (htmlContent) => ipcRenderer.invoke('print:invoice', htmlContent)
  }
});
