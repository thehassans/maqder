import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { QrCode, LogOut, RefreshCw, Smartphone, CheckCircle, Download, Users } from 'lucide-react';
import api from '../../lib/api';

export default function WhatsAppConnect() {
  const { language } = useSelector((state) => state.ui);

  const { data: statusData, refetch, isLoading } = useQuery({
    queryKey: ['whatsapp-client-status'],
    queryFn: () => api.get('/whatsapp/client/status').then(r => r.data),
    refetchInterval: (query) => {
      const currentData = query?.state?.data;
      if (currentData?.status === 'INITIALIZING' || currentData?.status === 'QR_READY') return 2000;
      return false;
    }
  });

  const initMutation = useMutation({
    mutationFn: () => api.post('/whatsapp/client/init').then(r => r.data),
    onSuccess: () => refetch()
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post('/whatsapp/client/logout').then(r => r.data),
    onSuccess: () => refetch()
  });

  const syncMutation = useMutation({
    mutationFn: () => api.post('/whatsapp/client/sync-contacts').then(r => r.data),
    onSuccess: () => {
      refetch();
      window.dispatchEvent(new CustomEvent('whatsapp-contacts-synced'));
    }
  });

  const exportContacts = (format = 'csv', type = 'all') => {
    const url = `/whatsapp/contacts/export?format=${format}&type=${type}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `whatsapp-contacts.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const status = statusData?.status || 'DISCONNECTED';
  const qrCode = statusData?.qrCode;
  const errorMsg = statusData?.error || (initMutation.isError ? (initMutation.error?.userMessage || initMutation.error?.message || 'API Error') : null);

  return (
    <div className="px-4 py-3">
      {errorMsg && (
        <div className="mb-3 p-2 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs">
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <RefreshCw className="w-3 h-3 animate-spin" />
          {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </div>
      ) : status === 'READY' || status === 'CONNECTED' ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-medium text-green-700 dark:text-green-400">
              {language === 'ar' ? 'متصل' : 'Connected'}
            </span>
            {syncMutation.isSuccess && (
              <span className="text-[10px] text-green-600">
                {syncMutation.data?.individuals || 0} · {syncMutation.data?.groups || 0}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              title={language === 'ar' ? 'مزامنة' : 'Sync'}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 hover:text-green-600 transition-colors"
            >
              {syncMutation.isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Users className="w-3 h-3" />}
            </button>
            <button
              onClick={() => exportContacts('csv', 'all')}
              title={language === 'ar' ? 'تصدير' : 'Export'}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 hover:text-blue-600 transition-colors"
            >
              <Download className="w-3 h-3" />
            </button>
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              title={language === 'ar' ? 'فصل' : 'Disconnect'}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : status === 'QR_READY' && qrCode ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
            <span className="text-xs text-amber-600 font-medium">
              {language === 'ar' ? 'في انتظار المسح...' : 'Waiting for scan...'}
            </span>
          </div>
          <div className="bg-white p-2 rounded-lg border border-gray-200 mx-auto w-fit">
            <img src={qrCode} alt="QR" className="w-40 h-40" />
          </div>
          <button onClick={() => refetch()} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mx-auto">
            <RefreshCw className="w-3 h-3" />
            {language === 'ar' ? 'تحديث' : 'Refresh'}
          </button>
        </div>
      ) : (
        <button
          onClick={() => initMutation.mutate()}
          disabled={initMutation.isPending || status === 'INITIALIZING'}
          className="flex items-center gap-2 text-xs font-medium text-green-600 hover:text-green-700 transition-colors"
        >
          {initMutation.isPending || status === 'INITIALIZING' ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <Smartphone className="w-3 h-3" />
          )}
          {language === 'ar' ? 'ربط واتساب' : 'Connect WhatsApp'}
        </button>
      )}
    </div>
  );
}
