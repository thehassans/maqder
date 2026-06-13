import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, PackageCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function CompleteOrder() {
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.ui);
  const isRTL = ['ar', 'ur'].includes((language || 'en').split('-')[0]);

  const [orderNumber, setOrderNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleComplete = async (e) => {
    if (e) e.preventDefault();
    if (!orderNumber.trim()) {
      toast.error(language === 'ar' ? 'الرجاء إدخال رقم الطلب' : 'Please enter order number');
      return;
    }

    setIsSubmitting(true);
    setSuccessData(null);
    try {
      const res = await api.post('/khayyat/stitchings/complete-by-receipt', { receiptNumber: orderNumber.trim() });
      toast.success(res.data.message || (language === 'ar' ? 'تم اكتمال الطلب بنجاح' : 'Order completed successfully'));
      setSuccessData(res.data);
      setOrderNumber('');
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to complete order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-xl relative z-10"
      >
        <button 
          onClick={() => navigate(-1)} 
          className="absolute -top-16 left-0 p-3 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-500 backdrop-blur-md"
        >
          <ArrowLeft className={`w-6 h-6 ${isRTL ? 'rotate-180' : ''}`} />
        </button>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/20 dark:border-slate-700/50 rounded-[2.5rem] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] p-10 md:p-14 text-center">
          
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/30">
            <PackageCheck className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 mb-3 tracking-tight">
            {language === 'ar' ? 'اكتمال الطلب' : 'Complete Order'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-10 text-sm md:text-base font-medium">
            {language === 'ar' ? 'قم بإدخال رقم الطلب أو رقم الإيصال لتحديث حالته وإرسال إشعار للعميل' : 'Enter the order or receipt number to update its status and notify the customer'}
          </p>

          <form onSubmit={handleComplete} className="space-y-6">
            <div className="relative group">
              <input
                ref={inputRef}
                type="text"
                placeholder={language === 'ar' ? 'رقم الطلب أو الإيصال' : 'Order or Receipt Number'}
                className="w-full bg-white/50 dark:bg-slate-800/50 border-2 border-gray-100 dark:border-slate-700 rounded-2xl text-center text-2xl font-bold p-6 text-gray-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none uppercase placeholder:normal-case placeholder:text-gray-300 dark:placeholder:text-gray-600"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                disabled={isSubmitting}
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !orderNumber.trim()}
              className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-gray-900/20 dark:shadow-white/10"
            >
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  {language === 'ar' ? 'تأكيد الاكتمال' : 'Confirm Completion'}
                  <CheckCircle className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <AnimatePresence>
            {successData && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                  {language === 'ar' 
                    ? `تم اكتمال ${successData?.stitchings?.length || 1} طلب/عنصر بنجاح. تم إرسال إشعار للعميل.`
                    : `Successfully completed ${successData?.stitchings?.length || 1} order/item(s). Customer notified.`
                  }
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
