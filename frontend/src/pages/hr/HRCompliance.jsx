import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, AlertTriangle, CheckCircle, Search, Clock } from 'lucide-react';
import api from '../../lib/api';
import { useTranslation } from '../../lib/translations';
import { useSelector } from 'react-redux';

export default function HRCompliance() {
  const { language } = useSelector(state => state.ui);
  const { t } = useTranslation(language);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['hr-compliance-alerts'],
    queryFn: () => api.get('/employees/compliance/alerts').then(res => res.data)
  });

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">{t('loading')}...</div>;
  }

  const filteredAlerts = alerts?.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-indigo-500" />
          {language === 'ar' ? 'لوحة الامتثال وتجديد الرخص' : 'Compliance & Renewals Dashboard'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {language === 'ar' 
            ? 'تتبع انتهاء صلاحية الإقامات، شهادات بلدي، الرخص، والمستندات الرسمية الأخرى.' 
            : 'Track expirations for Iqamas, Balady Certificates, and other official documents.'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 border-l-4 border-l-rose-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{language === 'ar' ? 'منتهية الصلاحية' : 'Expired'}</p>
              <h4 className="text-2xl font-bold text-gray-900">{alerts?.filter(a => a.isExpired).length || 0}</h4>
            </div>
          </div>
        </div>
        <div className="card p-6 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{language === 'ar' ? 'تنتهي خلال 60 يوم' : 'Expiring in < 60 Days'}</p>
              <h4 className="text-2xl font-bold text-gray-900">{alerts?.filter(a => !a.isExpired).length || 0}</h4>
            </div>
          </div>
        </div>
        <div className="card p-6 border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{language === 'ar' ? 'جميع المستندات السليمة' : 'Healthy Documents'}</p>
              <h4 className="text-xl font-bold text-gray-900 mt-1">{language === 'ar' ? 'متابعة آلية' : 'Auto-tracked'}</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-bold">{language === 'ar' ? 'تنبيهات التجديد' : 'Renewal Alerts'}</h3>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder={language === 'ar' ? 'بحث عن موظف...' : 'Search employee...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{language === 'ar' ? 'الموظف' : 'Employee'}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{language === 'ar' ? 'المستند' : 'Document'}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{language === 'ar' ? 'الرقم' : 'Number'}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">{language === 'ar' ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAlerts.length > 0 ? filteredAlerts.map((alert, idx) => (
                <tr key={`${alert.employeeId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                        {alert.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{alert.name}</p>
                        <p className="text-xs text-gray-500">{alert.employeeCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{alert.documentType}</td>
                  <td className="px-6 py-4 text-gray-500">{alert.documentNumber || '-'}</td>
                  <td className="px-6 py-4 text-gray-900">{new Date(alert.expiryDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    {alert.isExpired ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {language === 'ar' ? `منتهي منذ ${Math.abs(alert.daysRemaining)} يوم` : `Expired ${Math.abs(alert.daysRemaining)} days ago`}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                        <Clock className="w-3.5 h-3.5" />
                        {language === 'ar' ? `باقي ${alert.daysRemaining} يوم` : `${alert.daysRemaining} days left`}
                      </span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <ShieldAlert className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p>{language === 'ar' ? 'لا توجد تنبيهات حالية' : 'No alerts found'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
