import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Printer, ArrowLeft, Receipt } from 'lucide-react';
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
  const [items, setItems] = useState([{ id: Date.now(), name: '', quantity: 1, price: '' }]);

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (parseFloat(item.price || 0) * (item.quantity || 1)), 0);
  };

  const subtotal = calculateSubtotal();
  const tax = subtotal * 0.15;
  const grandTotal = subtotal + tax;

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/invoices/sell', data, { timeout: 120000 }),
    onSuccess: (res) => {
      toast.success(language === 'ar' ? 'تم إنشاء الفاتورة' : 'Invoice created successfully');
      navigate(`/app/dashboard/invoices/${res.data._id}`);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || error?.message || 'Failed to create invoice');
    }
  });

  const handleSave = () => {
    const validItems = items.filter(i => i.name.trim() && parseFloat(i.price || 0) > 0);
    if (validItems.length === 0) {
      toast.error(language === 'ar' ? 'أضف صنف واحد على الأقل' : 'Add at least one item');
      return;
    }

    const invoiceData = {
      flow: 'sell',
      transactionType: 'B2C',
      invoiceTypeCode: '0200000',
      invoiceSubtype: 'standard',
      issueDate: new Date(),
      buyer: {
        name: customerName.trim() || (language === 'ar' ? 'عميل نقدي' : 'Cash Customer'),
        contactPhone: customerPhone.trim() || ''
      },
      lineItems: validItems.map((line, i) => ({
        lineNumber: i + 1,
        productName: line.name,
        productNameAr: line.name,
        unitCode: 'PCE',
        quantity: line.quantity,
        unitPrice: parseFloat(line.price),
        taxRate: 15,
        taxCategory: 'S'
      }))
    };

    createMutation.mutate(invoiceData);
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

        <div className="p-8 pt-10">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-500">
              <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2">
                <Receipt className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {language === 'ar' ? 'فاتورة سريعة' : 'Quick Invoice'}
              </h2>
            </div>
            <div className="w-9" /> {/* Spacer */}
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 border-b border-dashed border-gray-200 dark:border-slate-700 pb-6">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider ml-1 mb-1 block">
                  {language === 'ar' ? 'اسم العميل' : 'Customer Name'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'ar' ? 'نقدي' : 'Cash'}
                  className="w-full bg-transparent border-none text-sm font-medium text-gray-900 dark:text-white focus:ring-0 p-0"
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
                  className="w-full bg-transparent border-none text-sm font-medium text-gray-900 dark:text-white focus:ring-0 p-0"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  dir="ltr"
                />
              </div>
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

            <div className="pt-6 border-t border-dashed border-gray-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{language === 'ar' ? 'المجموع' : 'Subtotal'}</span>
                <span><Money value={subtotal} /></span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{language === 'ar' ? 'الضريبة (15%)' : 'VAT (15%)'}</span>
                <span><Money value={tax} /></span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2">
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
        <div className="absolute bottom-0 inset-x-0 h-4 w-full hidden dark:block" style={{
          backgroundImage: 'radial-gradient(circle at 10px 10px, transparent 10px, #0f172a 11px)',
          backgroundSize: '20px 20px',
          backgroundPosition: '-10px -10px',
          backgroundRepeat: 'repeat-x'
        }} />
      </div>
    </div>
  );
}
