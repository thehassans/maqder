import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Scissors, Database, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function KhayyatSeeder() {
  const { id } = useParams();
  const { language } = useSelector((state) => state.ui);
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من بذر البيانات؟' : 'Are you sure you want to seed default Khayyat data?')) {
      return;
    }
    
    setLoading(true);
    try {
      await api.post(`/super-admin/tenants/${id}/seed-khayyat`);
      toast.success(language === 'ar' ? 'تم بذر البيانات بنجاح' : 'Khayyat data seeded successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || (language === 'ar' ? 'فشل بذر البيانات' : 'Failed to seed Khayyat data'));
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {language === 'ar' ? 'بيانات الخياط الافتراضية' : 'Default Khayyat Data'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {language === 'ar' 
                ? 'قم ببذر بيانات الأقمشة والتصاميم التطريزية والموردين الافتراضية لمستأجر الخياط هذا.' 
                : 'Seed default fabrics, embroidery designs, and suppliers for this tailoring tenant.'}
            </p>
            
            <div className="mt-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-300">
                {language === 'ar' 
                  ? 'هذا الإجراء سيضيف بيانات جديدة فقط ولن يحذف البيانات الموجودة.' 
                  : 'This action will only add new data and will not delete any existing data.'}
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleSeed}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Scissors className="w-4 h-4" />
                )}
                {language === 'ar' ? 'بذر بيانات الخياط' : 'Seed Khayyat Data'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
