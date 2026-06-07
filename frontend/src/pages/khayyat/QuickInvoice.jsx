import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Printer, ArrowLeft, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useTranslation } from '../../lib/translations';
import { formatSaudiRiyal } from './utils/saudi';
import SARIcon from './components/ui/SARIcon';

export default function KhayyatQuickInvoice() {
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.ui);
  const { tenant } = useSelector((state) => state.auth);
  const { t } = useTranslation(language);
  const isRTL = ['ar', 'ur'].includes((language || 'en').split('-')[0]);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [customSubtotal, setCustomSubtotal] = useState('');
  const [discount, setDiscount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Each item represents a family member / order
  const [items, setItems] = useState([{ 
    id: Date.now(), 
    name: '', // Family member name
    quantity: 1, 
    price: '',
    imageFile: null,
    imagePreview: null
  }]);

  useEffect(() => {
    // Cleanup image previews
    return () => {
      items.forEach(item => {
        if (item.imagePreview) URL.revokeObjectURL(item.imagePreview);
      });
    };
  }, []);

  const handleImageChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newItems = [...items];
      if (newItems[index].imagePreview) URL.revokeObjectURL(newItems[index].imagePreview);
      newItems[index].imageFile = file;
      newItems[index].imagePreview = url;
      setItems(newItems);
    }
  };

  const removeImage = (index) => {
    const newItems = [...items];
    if (newItems[index].imagePreview) URL.revokeObjectURL(newItems[index].imagePreview);
    newItems[index].imageFile = null;
    newItems[index].imagePreview = null;
    setItems(newItems);
  };

  const calculateAutoSubtotal = () => {
    return items.reduce((sum, item) => sum + (parseFloat(item.price || 0) * (item.quantity || 1)), 0);
  };

  const autoSubtotal = calculateAutoSubtotal();
  const subtotal = customSubtotal !== '' ? parseFloat(customSubtotal || 0) : autoSubtotal;
  const discountVal = parseFloat(discount || 0);
  const grandTotal = Math.max(0, subtotal - discountVal);
  const paidVal = parseFloat(paidAmount || 0);
  const pendingVal = Math.max(0, grandTotal - paidVal);

  // Sync custom subtotal placeholder
  useEffect(() => {
    if (customSubtotal === '' && autoSubtotal > 0) {
      // We don't automatically set it so the placeholder shows the auto calculation
    }
  }, [autoSubtotal]);

  const handleSave = async () => {
    if (!customerName.trim() && !customerPhone.trim()) {
      toast.error(language === 'ar' ? 'أدخل اسم العميل الرئيسي أو رقم الجوال' : 'Enter Main Customer Name or Phone');
      return;
    }

    const validItems = items.filter(i => i.name.trim() && (parseFloat(i.price || 0) > 0 || subtotal > 0));
    if (validItems.length === 0) {
      toast.error(language === 'ar' ? 'أضف فرد واحد على الأقل' : 'Add at least one member');
      return;
    }

    setIsSubmitting(true);
    let currentCustomerId = null;
    let remainingPaid = paidVal;
    let remainingDiscount = discountVal;

    try {
      const createdOrders = [];
      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        const formData = new FormData();
        
        if (currentCustomerId) {
          formData.append('customerId', currentCustomerId);
        } else {
          formData.append('customerName', customerName.trim());
          formData.append('customerPhone', customerPhone.trim());
        }

        const itemTotal = parseFloat(item.price || 0) * (item.quantity || 1);
        
        // Distribute subtotal and discount proportionally
        let itemProportion = autoSubtotal > 0 ? (itemTotal / autoSubtotal) : (1 / validItems.length);
        let finalItemPrice = (subtotal * itemProportion) - (discountVal * itemProportion);
        finalItemPrice = Math.max(0, finalItemPrice);

        formData.append('price', finalItemPrice);

        // Distribute paid amount
        let itemPaid = 0;
        if (remainingPaid > 0) {
          itemPaid = Math.min(finalItemPrice, remainingPaid);
          remainingPaid -= itemPaid;
        }
        formData.append('paidAmount', itemPaid);

        formData.append('quantity', item.quantity || 1);
        
        // Put member name in description and notes
        const desc = `${item.name}`;
        formData.append('description', desc);
        formData.append('orderFor', item.name);
        
        if (notes) formData.append('notes', notes);
        if (item.imageFile) formData.append('measurementImage', item.imageFile);

        const res = await api.post('/khayyat/stitchings', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000
        });

        if (!currentCustomerId && res.data.stitching.customerId) {
          currentCustomerId = res.data.stitching.customerId;
        }
        createdOrders.push(res.data.stitching);
      }

      const aggregatedOrder = {
        _id: createdOrders[0]._id,
        createdAt: createdOrders[0].createdAt,
        receiptNumber: createdOrders[0].receiptNumber || createdOrders[0].orderNumber || createdOrders[0]._id.slice(-8),
        customerName: createdOrders[0].customerName || customerName.trim(),
        customerPhone: createdOrders[0].customerPhone || customerPhone.trim(),
        price: createdOrders.reduce((s, o) => s + (Number(o?.price) || 0), 0),
        paidAmount: createdOrders.reduce((s, o) => s + (Number(o?.paidAmount) || 0), 0),
        quantity: createdOrders.reduce((s, o) => s + (Number(o?.quantity) || 0), 0),
        items: createdOrders.map(o => ({
          nameEn: `Tailoring Order (${o.orderFor || o.description || 'Member'})`,
          nameAr: `طلب خياطة (${o.orderFor || o.description || 'الفرد'})`,
          quantity: o.quantity || 1,
          unitPrice: o.price || 0,
          total: o.price || 0
        }))
      };

      toast.success(language === 'ar' ? 'تم إنشاء الطلبات بنجاح' : 'Orders created successfully');
      navigate(`/app/dashboard/khayyat/stitchings`, { state: { autoPrintOrder: aggregatedOrder } });
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message || 'Failed to create orders');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-start justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden relative">
        
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
              {tenant?.branding?.logo ? (
                <img src={tenant.branding.logo} alt="Logo" className="h-12 mx-auto mb-2 object-contain" />
              ) : (
                <div className="text-2xl font-black text-gray-900 dark:text-white mb-2">{tenant?.name}</div>
              )}
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {language === 'ar' ? 'طلب سريع' : 'Quick Order'}
              </h2>
            </div>
            <div className="w-9" />
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 pb-4 border-b border-dashed border-gray-200 dark:border-slate-700">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider ml-1 mb-1 block">
                  {language === 'ar' ? 'العميل الرئيسي' : 'Main Customer Name'} *
                </label>
                <input
                  type="text"
                  placeholder={language === 'ar' ? 'محمد' : 'Mohammed'}
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

            <div className="space-y-6">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider ml-1 block">
                {language === 'ar' ? 'أفراد العائلة / الطلبات' : 'Family Members / Orders'}
              </label>

              <AnimatePresence>
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700/50 space-y-3 relative group"
                  >
                    {items.length > 1 && (
                      <button
                        onClick={() => {
                          const newItems = items.filter(i => i.id !== item.id);
                          if (item.imagePreview) URL.revokeObjectURL(item.imagePreview);
                          setItems(newItems);
                        }}
                        className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <div className="pr-8">
                      <input
                        type="text"
                        placeholder={language === 'ar' ? 'أحمد' : 'Ahmed'}
                        className="w-full bg-white dark:bg-slate-900 border-none rounded-xl text-sm font-medium p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-200 dark:focus:ring-slate-700"
                        value={item.name}
                        onChange={e => {
                          const newItems = [...items];
                          newItems[index].name = e.target.value;
                          setItems(newItems);
                        }}
                      />
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className="relative">
                          {!item.imagePreview ? (
                            <label className="flex flex-col items-center justify-center w-full h-12 bg-white dark:bg-slate-900 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-gray-300 transition-colors">
                              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                                <Upload className="w-4 h-4" />
                                {language === 'ar' ? 'رفع المقاسات' : 'Upload Measurement'}
                              </div>
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(index, e)} />
                            </label>
                          ) : (
                            <div className="relative w-full h-12 rounded-xl overflow-hidden group/img">
                              <img src={item.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                              <button
                                onClick={() => removeImage(index)}
                                className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover/img:opacity-100 transition-opacity"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        className="w-16 bg-white dark:bg-slate-900 border-none rounded-xl text-sm p-3 text-center text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                        step="any"
                        placeholder="Price"
                        className="w-24 bg-white dark:bg-slate-900 border-none rounded-xl text-sm p-3 text-end text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={item.price}
                        onChange={e => {
                          const newItems = [...items];
                          newItems[index].price = e.target.value;
                          setItems(newItems);
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <button
                onClick={() => setItems([...items, { id: Date.now(), name: '', quantity: 1, price: '', imageFile: null, imagePreview: null }])}
                className="w-full py-3 flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors border border-dashed border-gray-200 dark:border-slate-700"
              >
                <Plus className="w-4 h-4" />
                {language === 'ar' ? 'أضف فرد آخر' : 'Add Another Member'}
              </button>
            </div>

            <div className="pt-6 border-t border-dashed border-gray-200 dark:border-slate-700 space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider ml-1 mb-1 block">
                  {language === 'ar' ? 'ملاحظات عامة' : 'General Notes'}
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
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder={autoSubtotal.toString()}
                  className="w-24 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm p-2 text-end text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-200 dark:focus:ring-slate-700 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={customSubtotal}
                  onChange={e => setCustomSubtotal(e.target.value)}
                />
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  className="w-24 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm p-2 text-end text-rose-500 focus:ring-2 focus:ring-gray-200 dark:focus:ring-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                />
              </div>
              
              <div className="flex justify-between items-center text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-dashed border-gray-200 dark:border-slate-700">
                <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                <span><span className="flex items-center gap-1">{formatSaudiRiyal(grandTotal)} <SARIcon className="w-5 h-5" /></span></span>
              </div>

              <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300 pt-2">
                <span className="font-medium">{language === 'ar' ? 'المدفوع' : 'Paid'}</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  className="w-28 bg-emerald-50 dark:bg-emerald-900/20 border-none rounded-lg font-bold text-sm p-2 text-end text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={paidAmount}
                  onChange={e => setPaidAmount(e.target.value)}
                />
              </div>
              
              <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">{language === 'ar' ? 'المتبقي' : 'Pending'}</span>
                <span className="font-bold text-rose-500 flex items-center gap-1">{formatSaudiRiyal(pendingVal)} <SARIcon className="w-5 h-5 text-rose-500" /></span>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="w-full mt-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-xl shadow-gray-900/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Printer className="w-5 h-5" />
                  {language === 'ar' ? 'حفظ الطلبات' : 'Save Orders'}
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
