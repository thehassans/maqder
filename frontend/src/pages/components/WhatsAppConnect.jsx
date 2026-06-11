import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { QrCode, LogOut, RefreshCw, Smartphone, CheckCircle } from 'lucide-react';
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

  const status = statusData?.status || 'DISCONNECTED';
  const qrCode = statusData?.qrCode;
  
  // Also check if the mutation itself failed synchronously
  const errorMsg = statusData?.error || (initMutation.isError ? (initMutation.error?.userMessage || initMutation.error?.message || 'API Error') : null);

  return (
    <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {language === 'ar' ? 'ربط واتساب الخاص بك' : 'Link Your WhatsApp'}
          </h2>
          <p className="text-sm text-gray-500">
            {language === 'ar' 
              ? 'اربط حساب واتساب لإرسال الفواتير للعملاء مباشرة' 
              : 'Link your WhatsApp account to send invoices directly to customers'}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col gap-2 text-red-700 text-sm">
          <strong className="font-semibold">{language === 'ar' ? 'حدث خطأ أثناء التشغيل' : 'Initialization Error'}</strong>
          <span className="font-mono text-xs break-all">{errorMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-8">
          <RefreshCw className="w-8 h-8 text-green-500 animate-spin" />
        </div>
      ) : status === 'READY' || status === 'CONNECTED' ? (
        <div className="flex flex-col items-center p-6 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20">
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <h3 className="text-lg font-bold text-green-800 dark:text-green-400 mb-2">
            {language === 'ar' ? 'تم الربط بنجاح' : 'Successfully Connected!'}
          </h3>
          <p className="text-sm text-green-700 dark:text-green-500 mb-6 text-center">
            {language === 'ar' 
              ? 'واتساب الخاص بك جاهز لإرسال الفواتير.' 
              : 'Your WhatsApp is ready to send invoices.'}
          </p>
          <button 
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-dark-800 text-red-600 font-medium rounded-xl border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {language === 'ar' ? 'إلغاء الربط' : 'Disconnect'}
          </button>
        </div>
      ) : status === 'QR_READY' && qrCode ? (
        <div className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4">
            <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
          </div>
          <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-decimal list-inside max-w-sm text-start mb-6">
            <li>{language === 'ar' ? 'افتح واتساب على هاتفك' : 'Open WhatsApp on your phone'}</li>
            <li>{language === 'ar' ? 'اذهب إلى الإعدادات > الأجهزة المرتبطة' : 'Go to Settings > Linked Devices'}</li>
            <li>{language === 'ar' ? 'اضغط على "ربط جهاز"' : 'Tap on "Link a Device"'}</li>
            <li>{language === 'ar' ? 'وجه الكاميرا نحو الرمز للربط' : 'Point your phone to this screen to capture the code'}</li>
          </ol>
          <button 
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
            {language === 'ar' ? 'تحديث الرمز' : 'Refresh QR Code'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center p-8 bg-gray-50 dark:bg-dark-700/50 rounded-xl border border-gray-100 dark:border-dark-700">
          <QrCode className="w-16 h-16 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-6 text-center max-w-sm">
            {language === 'ar' 
              ? 'انقر لبدء جلسة واتساب. سيظهر لك رمز QR لمسحه بهاتفك.' 
              : 'Click to start WhatsApp session. A QR code will appear for you to scan.'}
          </p>
          <button 
            onClick={() => initMutation.mutate()}
            disabled={initMutation.isPending || status === 'INITIALIZING'}
            className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-green-600/20"
          >
            {initMutation.isPending || status === 'INITIALIZING' ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Smartphone className="w-5 h-5" />
            )}
            {language === 'ar' ? 'إنشاء رمز الربط' : 'Generate QR Code'}
          </button>
        </div>
      )}
    </div>
  );
}
