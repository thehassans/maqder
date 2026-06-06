import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Printer, ArrowLeft, Receipt, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useTranslation } from '../../lib/translations';
import Money from '../../components/ui/Money';

export default function KhayyatQuickInvoice() {
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.ui);
  const { tenant } = useSelector((state) => state.auth);
  const { t } = useTranslation(language);
  const isRTL = ['ar', 'ur'].includes((language || 'en').split('-')[0]);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [items, setItems] = useState([{ id: Date.now(), name: '', quantity: 1, price: '' }]);

  const { data: workersRes } = useQuery({
    queryKey: ['khayyat-workers-lookup'],
    queryFn: () => api.get('/khayyat/worker').then(res => res.data)
  });
  const workers = workersRes?.workers || [];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (parseFloat(item.price || 0) * (item.quantity || 1)), 0);
  };

  const subtotal = calculateSubtotal();
  const discountVal = parseFloat(discount || 0);
  const grandTotal = Math.max(0, subtotal - discountVal);

  const createMutation = useMutation({
    mutationFn: async (formData) => {
      return api.post('/khayyat/stitchings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      });
    },
    onSuccess: (res) => {
      toast.success(language === 'ar' ? 'تم إنشاء الطلب بنجاح' : 'Order created successfully');
      navigate(`/app/dashboard/khayyat/stitchings`);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || error?.message || 'Failed to create order');
    }
  });

  const handleSave = () => {
    if (!customerName.trim() && !customerPhone.trim()) {
      toast.error(language === 'ar' ? 'أدخل اسم العميل أو رقم الجوال' : 'Enter Customer Name or Phone');
      return;
    }

    const validItems = items.filter(i => i.name.trim() && parseFloat(i.price || 0) > 0);
    if (validItems.length === 0) {
      toast.error(language === 'ar' ? 'أضف صنف واحد على الأقل' : 'Add at least one item');
      return;
    }

    const formData = new FormData();
    formData.append('customerName', customerName.trim());
    formData.append('customerPhone', customerPhone.trim());
    
    if (workerId) formData.append('workerId', workerId);
    
    // Create a combined description from line items
    const descriptionLines = validItems.map(i => `${i.quantity}x ${i.name} (${parseFloat(i.price).toFixed(2)})`);
    formData.append('description', descriptionLines.join('\n'));
    
    formData.append('price', grandTotal);
    formData.append('paidAmount', 0);
    
    if (notes) formData.append('notes', notes);
    if (imageFile) formData.append('measurementImage', imageFile);

    createMutation.mutate(formData);
  };

  return (
    <div className="min-h-[80vh] flex items-start justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden relative">
        
        {/* Header - Receipt Top Edge */}
        <div className="absolute top-0 inset-x-0 h-4 w-full" style={{
          backgroundImage: 'radial-gradient(circle at 10px 0, transparent 10px, #ffffff 11px)',
          backgroundSize: '20px 20px',
          backgroundPosition: '-10px 0',
          backgroundRepeat: 'repeat-x'
        }} />
        <div className="absolute top-0 inset-x-0 h-4 w-full hidden dark:block" style={{
          backgroundImage: 'radial-gradient(circle at 10px 0, transparent 10px, #0f172a 11px)',
          backgroundSize: '20px 20px',
          backgroundPosition: '-10px 0',
          backgroundRepeat: 'repeat-x'
        }} />

        <div className="p-8 pt-10 pb-16 h-[85vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-500">
              <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2">
                <Receipt className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {language === 'ar' ? 'طلب سريع' : 'Quick Order'}
              </h2>
            </div>
            <div className="w-9" />
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 pb-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider ml-1 mb-1 block">
                  {language === 'ar' ? 'اسم العميل' : 'Customer Name'} *
                </label>
                <input
                  type="text"
                  placeholder={language === 'ar' ? 'نقدي' : 'Cash'}
                  className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 p-3 focus:ring-gray-200"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider ml-1 mb-1 block">
                  {language === 'ar' ? 'رقم الجوال' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  placeholder="05XXXXXXXX"
                  className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 p-3 focus:ring-gray-200"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="pb-4">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider ml-1 mb-1 block">
                {language === 'ar' ? 'صورة المقاسات' : 'Measurement Image'}
              </label>
              <div className="relative">
                {!imagePreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500">
                      <Upload className="w-6 h-6 mb-2" />
                      <p className="text-xs">{language === 'ar' ? 'اضغط لرفع صورة' : 'Click to upload image'}</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                ) : (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden group">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-rose-500 text-white rounded-lg backdrop-blur-sm transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pb-6 border-b border-dashed border-gray-200 dark:border-slate-700">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider ml-1 mb-1 block">
                {language === 'ar' ? 'العامل' : 'Worker'}
              </label>
              <select
                value={workerId}
                onChange={e => setWorkerId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 p-3 focus:ring-gray-200"
              >
                <option value="">{language === 'ar' ? 'غير محدد' : 'Unassigned'}</option>
                {workers.map(w => (
                  <option key={w._id} value={w._id}>{w.nameI18n?.[language?.split('-')[0]] || w.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                <div className="flex-1">{language === 'ar' ? 'الوصف' : 'Description'}</div>
                <div className="w-16 text-center">{language === 'ar' ? 'الكمية' : 'Qty'}</div>
                <div className="w-20 text-end">{language === 'ar' ? 'السعر' : 'Price'}</div>
                <div className="w-8" />
              </div>

              <AnimatePresence>
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      placeholder={language === 'ar' ? 'تفصيل ثوب...' : 'Item name...'}
                      className="flex-1 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-sm p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-200 dark:focus:ring-slate-700"
                      value={item.name}
                      onChange={e => {
                        const newItems = [...items];
                        newItems[index].name = e.target.value;
                        setItems(newItems);
                      }}
                    />
                    <input
                      type="number"
                      min="1"
                      className="w-16 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-sm p-3 text-center text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-200 dark:focus:ring-slate-700"
                      value={item.quantity}
                      onChange={e => {
                        const newItems = [...items];
                        newItems[index].quantity = parseInt(e.target.value) || 1;
                        setItems(newItems);
                      }}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-20 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-sm p-3 text-end text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-200 dark:focus:ring-slate-700"
                      value={item.price}
                      onChange={e => {
                        const newItems = [...items];
                        newItems[index].price = e.target.value;
                        setItems(newItems);
                      }}
                    />
                    <button
                      onClick={() => setItems(items.filter(i => i.id !== item.id))}
                      className="w-8 h-10 flex items-center justify-center text-gray-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              <button
                onClick={() => setItems([...items, { id: Date.now(), name: '', quantity: 1, price: '' }])}
                className="w-full py-3 flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors border border-dashed border-gray-200 dark:border-slate-700"
              >
                <Plus className="w-4 h-4" />
                {language === 'ar' ? 'أضف بند' : 'Add Item'}
              </button>
            </div>

            <div className="pt-6 border-t border-dashed border-gray-200 dark:border-slate-700 space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider ml-1 mb-1 block">
                  {language === 'ar' ? 'ملاحظات' : 'Notes'}
                </label>
                <textarea
                  placeholder={language === 'ar' ? 'أضف ملاحظة...' : 'Add a note...'}
                  rows="2"
                  className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-sm p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-200 dark:focus:ring-slate-700 resize-none"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 pt-4">
                <span>{language === 'ar' ? 'المجموع' : 'Subtotal'}</span>
                <span><Money value={subtotal} /></span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-24 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm p-2 text-end text-rose-500 focus:ring-2 focus:ring-gray-200 dark:focus:ring-slate-700"
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                />
              </div>
              <div className="flex justify-between items-end text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-dashed border-gray-200 dark:border-slate-700">
                <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                <span><Money value={grandTotal} /></span>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={createMutation.isPending}
              className="w-full mt-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-xl shadow-gray-900/20 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Printer className="w-5 h-5" />
                  {language === 'ar' ? 'حفظ وطباعة' : 'Save & Print'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer - Receipt Bottom Edge */}
        <div className="absolute bottom-0 inset-x-0 h-4 w-full" style={{
          backgroundImage: 'radial-gradient(circle at 10px 10px, transparent 10px, #ffffff 11px)',
          backgroundSize: '20px 20px',
          backgroundPosition: '-10px -10px',
          backgroundRepeat: 'repeat-x'
        }} />
        <div className="absolute bottom-0 inset-x-0 h-4 w-full hidden dark:block z-10" style={{
          backgroundImage: 'radial-gradient(circle at 10px 10px, transparent 10px, #0f172a 11px)',
          backgroundSize: '20px 20px',
          backgroundPosition: '-10px -10px',
          backgroundRepeat: 'repeat-x'
        }} />
      </div>
    </div>
  );
}
