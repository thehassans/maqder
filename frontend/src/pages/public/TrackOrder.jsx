import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Clock, Scissors, PackageCheck, Star, AlertCircle, Shirt } from 'lucide-react';
import { useTranslation } from '../../lib/translations';
import { useSelector } from 'react-redux';
import Money from '../../components/ui/Money';

const statusMap = {
  'pending': { en: 'Pending', ar: 'قيد الانتظار', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500', step: 1 },
  'in_progress': { en: 'In Progress', ar: 'قيد التنفيذ', icon: Scissors, color: 'text-blue-500', bg: 'bg-blue-500', step: 2 },
  'completed': { en: 'Completed', ar: 'مكتمل', icon: PackageCheck, color: 'text-emerald-500', bg: 'bg-emerald-500', step: 3 },
  'delivered': { en: 'Delivered', ar: 'تم التسليم', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-600', step: 4 },
  'cancelled': { en: 'Cancelled', ar: 'ملغي', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500', step: 0 }
};

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default to arabic if no auth state available, else use redux state
  const reduxLanguage = useSelector((state) => state.ui?.language);
  const language = reduxLanguage || 'ar';
  const isRTL = ['ar', 'ur'].includes(language.split('-')[0]);

  useEffect(() => {
    if (!id) {
      setError(language === 'ar' ? 'رقم الطلب غير صحيح' : 'Invalid Order ID');
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await axios.get(`${API_URL}/public/track/khayyat/${id}`);
        setOrder(res.data);
      } catch (err) {
        setError(language === 'ar' ? 'لم يتم العثور على الطلب' : 'Order not found');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, language]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-black text-slate-900 mb-2">
          {error}
        </h1>
        <p className="text-slate-500">
          {language === 'ar' ? 'يرجى التأكد من مسح الرمز الصحيح من الفاتورة.' : 'Please ensure you scanned the correct QR code from your receipt.'}
        </p>
      </div>
    );
  }

  const tenant = order.tenantId;
  const currentStatus = order.status || 'pending';
  const statusInfo = statusMap[currentStatus];
  const currentStep = statusInfo?.step || 0;

  const steps = [
    { key: 'pending', ...statusMap['pending'] },
    { key: 'in_progress', ...statusMap['in_progress'] },
    { key: 'completed', ...statusMap['completed'] },
    { key: 'delivered', ...statusMap['delivered'] }
  ];

  return (
    <div className={`min-h-screen bg-slate-50 font-sans ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Premium Hero Header */}
      <div className="relative overflow-hidden bg-slate-900 text-white pb-20 pt-10">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-300 via-transparent to-transparent"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        
        <div className="max-w-xl mx-auto px-6 relative z-10 text-center">
          {tenant?.branding?.logo ? (
            <motion.img 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              src={tenant.branding.logo} 
              alt={tenant.name} 
              className="h-16 mx-auto mb-6 object-contain bg-white/10 p-2 rounded-2xl backdrop-blur-sm" 
            />
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-black mb-6 tracking-tight"
            >
              {tenant?.name || 'Maqder'}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-semibold tracking-wide border border-white/20 mb-4">
              <Shirt className="w-4 h-4 text-indigo-400" />
              {language === 'ar' ? 'تتبع طلب خياطة' : 'Tailoring Order Tracker'}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight">
              {language === 'ar' ? 'مرحباً،' : 'Hello,'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">{order.customerName || language === 'ar' ? 'عميلنا العزيز' : 'Valued Customer'}</span>
            </h1>
            <p className="text-slate-400 font-medium">
              {language === 'ar' ? 'رقم الطلب' : 'Order No.'} #{order.receiptNumber}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-12 relative z-20 pb-20">
        
        {/* Status Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[2rem] shadow-2xl shadow-indigo-900/5 p-8 border border-slate-100 mb-6"
        >
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${statusInfo.bg}/10 ${statusInfo.color} mb-4 ring-8 ring-slate-50`}>
              <statusInfo.icon className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">
              {language === 'ar' ? statusInfo.ar : statusInfo.en}
            </h2>
            {order.dueDate && (
              <p className="text-slate-500 font-medium">
                {language === 'ar' ? 'تاريخ الاستلام المتوقع:' : 'Expected Delivery:'} 
                <span className="font-bold text-slate-900 ml-2">
                  {new Date(order.dueDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </p>
            )}
          </div>

          {/* Stepper */}
          {currentStatus !== 'cancelled' && (
            <div className="relative flex justify-between items-center px-2">
              <div className="absolute top-1/2 left-6 right-6 h-1 bg-slate-100 -translate-y-1/2 z-0 rounded-full"></div>
              <motion.div 
                className="absolute top-1/2 left-6 h-1 bg-gradient-to-r from-indigo-500 to-cyan-400 -translate-y-1/2 z-0 rounded-full origin-left"
                initial={{ width: '0%' }}
                animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              ></motion.div>

              {steps.map((step, idx) => {
                const isCompleted = step.step <= currentStep;
                const isActive = step.step === currentStep;
                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors duration-500 ${isCompleted ? 'bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-3 h-3" />}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-indigo-600' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                      {language === 'ar' ? step.ar : step.en}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Order Details Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-6 sm:p-8 border border-slate-100"
        >
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            {language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}
          </h3>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200">
              <span className="text-slate-500 font-medium">{language === 'ar' ? 'الوصف' : 'Description'}</span>
              <span className="font-bold text-slate-900">{order.description || (language === 'ar' ? 'طلب تفصيل' : 'Tailoring Order')}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200">
              <span className="text-slate-500 font-medium">{language === 'ar' ? 'الكمية' : 'Quantity'}</span>
              <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">{order.quantity || 1}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200">
              <span className="text-slate-500 font-medium">{language === 'ar' ? 'المبلغ الإجمالي' : 'Total Amount'}</span>
              <span className="font-bold text-slate-900"><Money value={order.price || 0} /></span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-dashed border-slate-200">
              <span className="text-slate-500 font-medium">{language === 'ar' ? 'المبلغ المدفوع' : 'Paid Amount'}</span>
              <span className="font-bold text-emerald-600"><Money value={order.paidAmount || 0} /></span>
            </div>
            <div className="flex justify-between items-center pt-3">
              <span className="text-slate-500 font-medium">{language === 'ar' ? 'المبلغ المتبقي' : 'Remaining Balance'}</span>
              <span className="font-black text-rose-500 text-lg"><Money value={Math.max(0, (order.price || 0) - (order.paidAmount || 0))} /></span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 text-center">
            <p className="text-slate-500 text-sm mb-2">
              {language === 'ar' ? 'هل تحتاج إلى مساعدة؟' : 'Need help with your order?'}
            </p>
            <p className="font-bold text-slate-900">
              {tenant?.business?.phone || tenant?.email || (language === 'ar' ? 'تواصل مع الفرع' : 'Contact Store')}
            </p>
          </div>
        </motion.div>
        
      </div>
    </div>
  );
}
