import { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { useTranslation } from '../lib/translations';
import { Download, Database, ShieldCheck, AlertTriangle } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Backup() {
  const { language } = useSelector((state) => state.ui);
  const { t } = useTranslation(language);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await api.get('/backup/export', { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(language === 'ar' ? 'تم إنشاء نسخة احتياطية بنجاح' : 'Backup generated successfully');
    } catch (error) {
      toast.error(language === 'ar' ? 'فشل إنشاء النسخة الاحتياطية' : 'Failed to generate backup');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-primary-500" />
            {language === 'ar' ? 'النسخ الاحتياطي' : 'Database Backup'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {language === 'ar' ? 'إدارة وحفظ نسخ احتياطية لبيانات المنشأة' : 'Manage and download backups for your tenant data'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{language === 'ar' ? 'تصدير البيانات' : 'Export Data'}</h3>
              <p className="text-sm text-gray-500">{language === 'ar' ? 'تنزيل نسخة من الفواتير، العملاء، والمصاريف' : 'Download a copy of invoices, customers, and expenses'}</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full btn btn-primary flex items-center justify-center gap-2 py-3"
          >
            {isExporting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {language === 'ar' ? 'إنشاء نسخة احتياطية (JSON)' : 'Generate Backup (JSON)'}
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{language === 'ar' ? 'حماية البيانات' : 'Data Protection'}</h3>
              <p className="text-sm text-gray-500">{language === 'ar' ? 'أمان وسرية معلوماتك' : 'Security and privacy of your information'}</p>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-dark-700/50 p-4 rounded-lg text-sm text-gray-600 dark:text-gray-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p>
              {language === 'ar' 
                ? 'يتم تشفير جميع النسخ الاحتياطية. يرجى الاحتفاظ بالملف في مكان آمن. النظام يقوم أيضاً بأخذ نسخ احتياطية تلقائية يومياً في السحابة لضمان عدم ضياع بياناتك.'
                : 'All exports are secured. Please keep the downloaded file in a safe place. The system also takes automatic daily cloud backups to prevent data loss.'}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
