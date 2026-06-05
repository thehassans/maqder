import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import api from '../../../lib/api';
import { useTranslation } from '../../../lib/translations';
import Money from '../../../components/ui/Money';
import { FileText, Printer } from 'lucide-react';

export default function CustomerStatement() {
  const { language } = useSelector((state) => state.ui);
  const { t } = useTranslation(language);

  const [customerId, setCustomerId] = useState('');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => api.get('/customers').then(res => res.data.customers || res.data)
  });

  const { data: statementData, isLoading } = useQuery({
    queryKey: ['customer-statement', customerId, startDate, endDate],
    queryFn: () => api.get('/reports/customer-statement', { params: { customerId, startDate, endDate } }).then(res => res.data),
    enabled: !!customerId
  });

  const printStatement = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary-500" />
            {language === 'ar' ? 'كشف حساب عميل' : 'Customer Account Statement'}
          </h1>
        </div>
        <button onClick={printStatement} className="btn btn-secondary gap-2" disabled={!statementData}>
          <Printer className="w-4 h-4" />
          {language === 'ar' ? 'طباعة' : 'Print'}
        </button>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700 grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">{language === 'ar' ? 'العميل' : 'Customer'}</label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="select">
            <option value="">{language === 'ar' ? 'اختر العميل' : 'Select Customer'}</option>
            {customers.map(c => (
              <option key={c._id} value={c._id}>{c.name || c.companyName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">{language === 'ar' ? 'من تاريخ' : 'Start Date'}</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">{language === 'ar' ? 'إلى تاريخ' : 'End Date'}</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" />
        </div>
      </div>

      {customerId && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-dark-700">
            <h2 className="text-xl font-bold">{customers.find(c => c._id === customerId)?.name || customers.find(c => c._id === customerId)?.companyName}</h2>
            <p className="text-gray-500">{startDate} - {endDate}</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-dark-700/50">
                <tr>
                  <th className="px-6 py-3">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th className="px-6 py-3">{language === 'ar' ? 'رقم المرجع' : 'Reference'}</th>
                  <th className="px-6 py-3">{language === 'ar' ? 'البيان' : 'Description'}</th>
                  <th className="px-6 py-3 text-right">{language === 'ar' ? 'مدين (المطلوب)' : 'Debit'}</th>
                  <th className="px-6 py-3 text-right">{language === 'ar' ? 'دائن (المدفوع)' : 'Credit'}</th>
                  <th className="px-6 py-3 text-right">{language === 'ar' ? 'الرصيد' : 'Balance'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                {isLoading ? (
                  <tr><td colSpan="6" className="p-8 text-center"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
                ) : statementData?.statement?.length === 0 ? (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-500">{language === 'ar' ? 'لا يوجد حركات' : 'No transactions'}</td></tr>
                ) : (
                  statementData?.statement?.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-dark-700/50">
                      <td className="px-6 py-4">{new Date(row.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-medium">{row.id}</td>
                      <td className="px-6 py-4 text-gray-500">{row.desc}</td>
                      <td className="px-6 py-4 text-right text-red-600">{row.debit > 0 ? <Money value={row.debit} /> : '-'}</td>
                      <td className="px-6 py-4 text-right text-emerald-600">{row.credit > 0 ? <Money value={row.credit} /> : '-'}</td>
                      <td className="px-6 py-4 text-right font-bold" dir="ltr"><Money value={row.balance} /></td>
                    </tr>
                  ))
                )}
                {statementData && (
                  <tr className="bg-gray-50 dark:bg-dark-700/30 font-bold">
                    <td colSpan="5" className="px-6 py-4 text-right">{language === 'ar' ? 'الرصيد النهائي:' : 'Ending Balance:'}</td>
                    <td className="px-6 py-4 text-right" dir="ltr"><Money value={statementData.totalBalance} /></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
