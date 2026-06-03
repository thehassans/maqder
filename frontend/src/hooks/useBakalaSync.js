import { useEffect, useState, useCallback } from 'react';
import { getOfflineInvoices, removeOfflineInvoice } from '../lib/bakalaDb';
import api from '../lib/api';
import toast from 'react-hot-toast';

export const useBakalaSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const checkPending = useCallback(async () => {
    const invoices = await getOfflineInvoices();
    setPendingCount(invoices.length);
  }, []);

  const syncOfflineData = useCallback(async () => {
    if (!navigator.onLine || syncing) return;
    
    try {
      setSyncing(true);
      const invoices = await getOfflineInvoices();
      if (invoices.length === 0) return;

      const response = await api.post('/bakala/sync', { invoices });
      if (response.data.success) {
        // Remove synced invoices from IndexedDB
        for (const synced of response.data.syncedInvoices) {
          await removeOfflineInvoice(synced.offlineId);
        }
        
        if (response.data.syncedInvoices.length > 0) {
          toast.success(`Synced ${response.data.syncedInvoices.length} offline invoices`);
        }
        if (response.data.errors && response.data.errors.length > 0) {
          toast.error(`Failed to sync ${response.data.errors.length} invoices`);
        }
      }
      await checkPending();
    } catch (error) {
      console.error('Offline sync failed', error);
    } finally {
      setSyncing(false);
    }
  }, [syncing, checkPending]);

  useEffect(() => {
    checkPending();
    
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Polling interval just in case
    const interval = setInterval(() => {
      if (navigator.onLine) syncOfflineData();
      checkPending();
    }, 60000); // Check every minute

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [syncOfflineData, checkPending]);

  return { isOnline, syncing, pendingCount, syncOfflineData };
};
