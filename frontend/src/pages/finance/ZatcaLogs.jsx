import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Search, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import api from '../../lib/api';
import { useTranslation } from '../../lib/translations';
import { useSelector } from 'react-redux';

export default function ZatcaLogs() {
  const { language } = useSelector(state => state.ui);
  const { t } = useTranslation(language);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['zatca-logs-stats'],
    queryFn: () => api.get('/zatca/logs/stats').then(res => res.data)
  });

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['zatca-logs', page, filterStatus, searchTerm],
    queryFn: () => api.get('/zatca/logs', { 
      params: { page, limit: 10, status: filterStatus, search: searchTerm } 
    }).then(res => res.data)
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'success': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'warning': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'error': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Shield className="w-8 h-8 text-indigo-500" />
          {language === 'ar' ? 'سجل زاتكا' : 'ZATCA Integration Logs'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {language === 'ar' 
            ? 'تتبع حالة رفع ومزامنة الفواتير مع هيئة الزكاة والضريبة والجمارك' 
            : 'Track status of invoice reporting and clearance with ZATCA'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-6 border-l-4 border-l-indigo-500 cursor-pointer" onClick={() => setFilterStatus('')}>
          <p className="text-sm font-medium text-gray-500">{language === 'ar' ? 'إجمالي السجلات' : 'Total Logs'}</p>
          <h4 className="text-2xl font-bold text-gray-900">{stats?.total || 0}</h4>
        </div>
        <div className="card p-6 border-l-4 border-l-emerald-500 cursor-pointer" onClick={() => setFilterStatus('success')}>
          <p className="text-sm font-medium text-gray-500">{language === 'ar' ? 'ناجحة' : 'Successful'}</p>
          <h4 className="text-2xl font-bold text-gray-900">{stats?.success || 0}</h4>
        </div>
        <div className="card p-6 border-l-4 border-l-amber-500 cursor-pointer" onClick={() => setFilterStatus('warning')}>
          <p className="text-sm font-medium text-gray-500">{language === 'ar' ? 'تحذيرات' : 'Warnings'}</p>
          <h4 className="text-2xl font-bold text-gray-900">{stats?.warning || 0}</h4>
        </div>
        <div className="card p-6 border-l-4 border-l-rose-500 cursor-pointer" onClick={() => setFilterStatus('error')}>
          <p className="text-sm font-medium text-gray-500">{language === 'ar' ? 'أخطاء' : 'Errors'}</p>
          <h4 className="text-2xl font-bold text-gray-900">{stats?.error || 0}</h4>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold">{language === 'ar' ? 'السجلات' : 'Logs'}</h3>
            {filterStatus && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBg(filterStatus)} flex items-center gap-2`}>
                {getStatusIcon(filterStatus)}
                {filterStatus.toUpperCase()}
                <button onClick={() => setFilterStatus('')} className="ml-2 hover:opacity-70">&times;</button>
              </span>
            )}
          </div>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder={language === 'ar' ? 'بحث برقم الفاتورة...' : 'Search invoice number...'}
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{language === 'ar' ? 'تاريخ ووقت' : 'Date & Time'}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{language === 'ar' ? 'رقم الفاتورة' : 'Invoice Number'}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{language === 'ar' ? 'الإجراء' : 'Action'}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{language === 'ar' ? 'الرسالة' : 'Message'}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">{language === 'ar' ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">{t('loading')}...</td></tr>
              ) : logsData?.logs?.length > 0 ? logsData.logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 font-medium text-indigo-600">{log.invoiceNumber || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={log.message}>
                    {log.message || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusBg(log.status)}`}>
                      {getStatusIcon(log.status)}
                      {log.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <Shield className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p>{language === 'ar' ? 'لا توجد سجلات زاتكا' : 'No ZATCA logs found'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {logsData?.pagination?.pages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-secondary text-sm"
            >
              {language === 'ar' ? 'السابق' : 'Previous'}
            </button>
            <span className="text-sm text-gray-500">
              {language === 'ar' ? `صفحة ${page} من ${logsData.pagination.pages}` : `Page ${page} of ${logsData.pagination.pages}`}
            </span>
            <button 
              onClick={() => setPage(p => Math.min(logsData.pagination.pages, p + 1))}
              disabled={page === logsData.pagination.pages}
              className="btn btn-secondary text-sm"
            >
              {language === 'ar' ? 'التالي' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
