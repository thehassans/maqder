import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Scissors, Loader2, Info } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from '../../lib/translations';

export default function SaloonSeeder() {
  const { id } = useParams();
  const { language } = useSelector((state) => state.ui);
  const { t } = useTranslation(language);
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await api.post(`/super-admin/tenants/${id}/seed-saloon`);
      toast.success(language === 'ar' ? 'تم حقن بيانات الصالون بنجاح' : 'Saloon data seeded successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || (language === 'ar' ? 'فشل حقن البيانات' : 'Failed to seed saloon data'));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Scissors className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {language === 'ar' ? 'بيانات الصالون الأساسية' : 'Saloon Base Data'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {language === 'ar' 
                ? 'حقن قائمة خدمات الصالون الافتراضية (مثل: حلاقة، سنفرة، صبغة) في قاعدة بيانات هذا المستأجر لتسريع عملية الإعداد.'
                : 'Inject the default list of saloon services (e.g. Haircut, Scrub, Dye) into this tenant\'s database to speed up onboarding.'}
            </p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-4 flex gap-3 mb-6">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <strong>{language === 'ar' ? 'ملاحظة:' : 'Note:'}</strong>{' '}
            {language === 'ar'
              ? 'تجاوز السجلات الموجودة بنفس الاسم مسبقاً.'
              : 'Existing services with the same name will be safely skipped.'}
          </div>
        </div>

        <button
          onClick={handleSeed}
          disabled={seeding}
          className="btn btn-primary w-full sm:w-auto"
        >
          {seeding ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              {language === 'ar' ? 'جاري الحقن...' : 'Seeding Data...'}
            </>
          ) : (
            <>
              <Scissors className="w-5 h-5 mr-2" />
              {language === 'ar' ? 'حقن بيانات الصالون' : 'Seed Saloon Data'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
