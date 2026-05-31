import { useTranslation } from '../../../../lib/translations.js';
import { useSelector } from 'react-redux';
import React from 'react';

import { Modal } from './Modal';
import { PhoneCall } from 'lucide-react';

const DemoBlockedModal = ({ isOpen, onClose, title, phone = '+966596775485' }) => {
  const { language } = useSelector(state => state.ui) || { language: 'en' };
  const { t } = useTranslation(language);
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || (language === 'ar' ? 'وضع العرض' : 'Demo Mode')}
      size="md"
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40 p-4">
          <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{(language === 'ar' ? 'هذا الإجراء غير متاح في العرض التجريبي.' : 'This action is disabled in Live Demo.')}</div>
          <div className="mt-1 text-sm text-gray-600 dark:text-slate-300">
            {t('demo.blockedSubtitle', { defaultValue: 'Contact sales team {{phone}} to get a free trial.', phone })}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={`https://wa.me/${String(phone || '').replace(/\D/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-90 transition-opacity"
          >
            <PhoneCall className="w-4 h-4" />
            {(language === 'ar' ? 'اتصل بالمبيعات' : 'Call Sales')}
          </a>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            {(language === 'ar' ? 'إغلاق' : 'Close')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DemoBlockedModal;
