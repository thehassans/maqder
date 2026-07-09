import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Printer, ArrowLeft, Upload, X, Search, ChevronDown, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useTranslation } from '../../lib/translations';
import { useAutoTranslate } from '../../hooks/useAutoTranslate';
import { formatSaudiRiyal } from './utils/saudi';
import { canonicalSaudiMobile } from './utils/saudi';
import SARIcon from './components/ui/SARIcon';

export default function KhayyatQuickInvoice() {
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.ui);
  const { tenant } = useSelector((state) => state.auth);
  const { t } = useTranslation(language);
  const { translate } = useAutoTranslate();
  const isRTL = ['ar', 'ur'].includes((language || 'en').split('-')[0]);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [allCustomers, setAllCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetailsLoading, setCustomerDetailsLoading] = useState(false);
  const customerDropdownRef = useRef(null);
  const [searchParams] = useSearchParams();
  const langKey = (language || 'en').split('-')[0];
  const [customSubtotal, setCustomSubtotal] = useState('');
  const [discount, setDiscount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Each item represents a family member / order
  const [items, setItems] = useState([{ 
    id: Date.now(), 
    name: '', // Family member name
    phone: '', // Family member phone
    customerId: null, // Selected existing customer ID
    quantity: 1, 
    price: '',
    imageFile: null,
    imagePreview: null,
    dropdownOpen: false,
    search: ''
  }]);
  const itemDropdownRefs = useRef({});

  useEffect(() => {
    fetchAllCustomers();
    // Cleanup image previews
    return () => {
      items.forEach(item => {
        if (item.imagePreview) URL.revokeObjectURL(item.imagePreview);
      });
    };
  }, []);

  const fetchAllCustomers = async () => {
    try {
      const response = await api.get('/khayyat/customers', { params: { limit: 2000 } });
      const data = response.data;
      setAllCustomers(Array.isArray(data) ? data : data.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const filteredCustomers = allCustomers.filter(customer => {
    if (!customerSearch) return true;
    const search = customerSearch.toLowerCase();
    const searchPhone = canonicalSaudiMobile(customerSearch);
    return (customer.nameI18n?.[langKey] || customer.name || '')?.toLowerCase().includes(search) ||
           customer.phone?.includes(customerSearch) ||
           (customer.customerCode || '')?.toLowerCase().includes(search) ||
           (customer.khayyatReceiptNumbers || '')?.toLowerCase().includes(search) ||
           (!!searchPhone && canonicalSaudiMobile(customer.phone) === searchPhone);
  });

  const handleCustomerSelect = async (customer) => {
    setDropdownOpen(false);
    setCustomerSearch('');
    setCustomerDetailsLoading(true);
    try {
      const resp = await api.get(`/khayyat/customers/${customer._id}`);
      const fetched = resp.data?.customer || customer;
      setSelectedCustomer(fetched);
      setCustomerName(fetched.nameI18n?.[langKey] || fetched.name || '');
      setCustomerPhone(fetched.phone || '');
    } catch {
      setSelectedCustomer(customer);
      setCustomerName(customer.nameI18n?.[langKey] || customer.name || '');
      setCustomerPhone(customer.phone || '');
    }
    setCustomerDetailsLoading(false);
  };

  useEffect(() => {
    const customerId = searchParams.get('customerId');
    if (customerId && allCustomers.length > 0) {
      const found = allCustomers.find(c => c._id === customerId);
      if (found) {
        handleCustomerSelect(found);
      }
    }
  }, [searchParams, allCustomers]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      // Close item dropdowns when clicking outside
      Object.values(itemDropdownRefs.current).forEach(ref => {
        if (ref && !ref.contains(e.target)) {
          const itemId = ref.dataset.itemId;
          if (itemId) {
            setItems(prev => prev.map(it => 
              String(it.id) === itemId ? { ...it, dropdownOpen: false } : it
            ));
          }
        }
      });
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

    let customerNameAr = '';
    if (customerName.trim() && !/[\u0600-\u06FF]/.test(customerName)) {
      try {
        customerNameAr = await translate(customerName.trim(), 'en', 'ar');
      } catch (e) {
        console.error('Translation failed', e);
      }
    } else {
      customerNameAr = customerName.trim();
    }

    try {
      const createdOrders = [];
      const sharedOrderNumber = `ORD-${Date.now().toString().slice(-6)}${Math.floor(Math.random()*1000)}`;
      
      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        const formData = new window.FormData();
        
        formData.append('orderNumber', sharedOrderNumber);
        
        if (selectedCustomer?._id) {
          formData.append('customerId', selectedCustomer._id);
        } else if (currentCustomerId) {
          formData.append('customerId', currentCustomerId);
        } else {
          formData.append('customerName', customerName.trim());
          if (customerNameAr) formData.append('customerNameAr', customerNameAr);
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
        
        let orderForAr = item.name;
        if (item.name && !/[\u0600-\u06FF]/.test(item.name)) {
          try {
            orderForAr = await translate(item.name.trim(), 'en', 'ar');
          } catch(e) {}
        }
        formData.append('orderForAr', orderForAr);
        
        if (item.phone) formData.append('orderForPhone', item.phone.trim());
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
        orderNumber: sharedOrderNumber,
        receiptNumber: createdOrders[0].receiptNumber || sharedOrderNumber,
        customerName: createdOrders[0].customerName || customerName.trim(),
        customerPhone: createdOrders[0].customerPhone || customerPhone.trim(),
        price: createdOrders.reduce((s, o) => s + (Number(o?.price) || 0), 0),
        paidAmount: createdOrders.reduce((s, o) => s + (Number(o?.paidAmount) || 0), 0),
        quantity: createdOrders.reduce((s, o) => s + (Number(o?.quantity) || 0), 0),
        items: createdOrders.map(o => ({
          nameEn: `Tailoring Order (${o.orderFor || o.description || 'Member'})`,
          nameAr: `طلب خياطة (${o.orderForAr || o.orderFor || o.description || 'الفرد'})`,
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
              <div className="relative" ref={customerDropdownRef}>
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider ml-1 mb-1 block">
                  {language === 'ar' ? '\u0627\u0644\u0639\u0645\u064A\u0644' : 'Customer'} *
                </label>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full flex items-center justify-between bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 p-3 focus:ring-gray-200"
                >
                  {selectedCustomer ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-primary-700 dark:text-primary-200 font-medium text-xs">{(selectedCustomer.nameI18n?.[langKey] || selectedCustomer.name || '')?.charAt(0)}</span>
                      </div>
                      <div className="text-left min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{selectedCustomer.nameI18n?.[langKey] || selectedCustomer.name}</p>
                        {selectedCustomer.khayyatReceiptNumbers && (
                          <p className="text-[10px] text-gray-400 truncate">{language === 'ar' ? '\u0625\u064A\u0635\u0627\u0644\u0627\u062A' : 'Receipts'}: {selectedCustomer.khayyatReceiptNumbers}</p>
                        )}
                      </div>
                    </div>
                  ) : customerDetailsLoading ? (
                    <span className="text-gray-400">{language === 'ar' ? '\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644...' : 'Loading...'}</span>
                  ) : (
                    <span className="text-gray-400">{language === 'ar' ? '\u0627\u062E\u062A\u0631 \u0639\u0645\u064A\u0644...' : 'Select customer...'}</span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-slate-800 z-50">
                    <div className="p-2 border-b border-gray-100 dark:border-slate-700">
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder={language === 'ar' ? '\u0628\u062D\u062B \u0628\u0627\u0644\u0627\u0633\u0645 \u0623\u0648 \u0627\u0644\u0631\u0642\u0645 \u0623\u0648 \u0627\u0644\u0625\u064A\u0635\u0627\u0644...' : 'Search by name, phone, or receipt...'}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <button
                            key={customer._id}
                            type="button"
                            onClick={() => handleCustomerSelect(customer)}
                            className={`w-full p-2.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 flex items-center gap-2 text-left transition-colors border-b border-gray-100 dark:border-slate-700 last:border-b-0 ${selectedCustomer?._id === customer._id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                          >
                            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center shrink-0">
                              <span className="text-primary-700 dark:text-primary-200 font-medium text-xs">{(customer.nameI18n?.[langKey] || customer.name || '')?.charAt(0)}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 dark:text-slate-100 text-sm truncate">{customer.nameI18n?.[langKey] || customer.name}</p>
                              <p className="text-xs text-gray-500 dark:text-slate-400">{customer.phone}</p>
                              {customer.khayyatReceiptNumbers && (
                                <p className="text-[10px] text-gray-400 truncate">{language === 'ar' ? '\u0625\u064A\u0635\u0627\u0644\u0627\u062A' : 'Receipts'}: {customer.khayyatReceiptNumbers}</p>
                              )}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500 dark:text-slate-400 text-sm">{language === 'ar' ? '\u0644\u0627 \u064A\u0648\u062C\u062F \u0639\u0645\u0644\u0627\u0621' : 'No customers found'}</div>
                      )}
                    </div>
                  </div>
                )}

                <input
                  type="text"
                  placeholder={language === 'ar' ? '\u0623\u0648 \u0627\u0643\u062A\u0628 \u0627\u0633\u0645 \u062C\u062F\u064A\u062F' : 'Or type new name'}
                  className="w-full mt-2 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 p-3 focus:ring-gray-200"
                  value={customerName}
                  onChange={e => { setCustomerName(e.target.value); setSelectedCustomer(null); }}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider ml-1 mb-1 block">
                  {language === 'ar' ? '\u0631\u0642\u0645 \u0627\u0644\u062C\u0648\u0627\u0644' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  placeholder="05XXXXXXXX"
                  className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 p-3 focus:ring-gray-200"
                  value={customerPhone}
                  onChange={e => { setCustomerPhone(e.target.value); setSelectedCustomer(null); }}
                  dir="ltr"
                />
                {selectedCustomer?.khayyatHijriDate && (
                  <p className="text-[10px] text-gray-400 mt-1 ml-1">
                    {language === 'ar' ? '\u062A\u0627\u0631\u064A\u062E' : 'Date'}: {selectedCustomer.khayyatHijriDate}
                  </p>
                )}
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

                    <div className="pr-8 space-y-2">
                      {/* Customer dropdown for this member */}
                      <div className="relative" ref={el => { if (el) itemDropdownRefs.current[item.id] = el; el?.setAttribute('data-item-id', item.id); }}>
                        <button
                          type="button"
                          onClick={() => {
                            setItems(prev => prev.map(it => 
                              it.id === item.id ? { ...it, dropdownOpen: !it.dropdownOpen } : it
                            ));
                          }}
                          className="w-full flex items-center justify-between bg-white dark:bg-slate-900 border-none rounded-xl text-xs font-medium text-gray-600 dark:text-slate-300 focus:ring-2 focus:ring-gray-200 p-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <span className="flex items-center gap-1.5 text-gray-400">
                            <Search className="w-3.5 h-3.5" />
                            {item.customerId ? (
                              <span className="text-gray-700 dark:text-slate-200 truncate">
                                {allCustomers.find(c => c._id === item.customerId)?.nameI18n?.[langKey] || allCustomers.find(c => c._id === item.customerId)?.name || 'Selected'}
                              </span>
                            ) : (
                              <span>{language === 'ar' ? 'اختر عميل موجود' : 'Pick existing customer'}</span>
                            )}
                          </span>
                          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${item.dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {item.dropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-slate-800 z-50">
                            <div className="p-2 border-b border-gray-100 dark:border-slate-700">
                              <input
                                type="text"
                                value={item.search || ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  setItems(prev => prev.map(it => 
                                    it.id === item.id ? { ...it, search: val } : it
                                  ));
                                }}
                                placeholder={language === 'ar' ? 'بحث بالاسم أو الرقم' : 'Search name or phone'}
                                className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-xs text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                autoFocus
                              />
                            </div>
                            <div className="max-h-40 overflow-y-auto">
                              {(() => {
                                const q = (item.search || '').toLowerCase();
                                const results = allCustomers.filter(c => {
                                  if (String(c._id) === String(selectedCustomer?._id)) return false;
                                  if (!q) return true;
                                  return (c.nameI18n?.[langKey] || c.name || '')?.toLowerCase().includes(q) ||
                                         c.phone?.includes(item.search || '');
                                }).slice(0, 20);
                                if (results.length === 0) return <div className="p-3 text-center text-gray-400 text-xs">No customers</div>;
                                return results.map(c => (
                                  <button
                                    key={c._id}
                                    type="button"
                                    onClick={() => {
                                      setItems(prev => prev.map(it => 
                                        it.id === item.id ? { 
                                          ...it, 
                                          customerId: c._id, 
                                          name: c.nameI18n?.[langKey] || c.name || '',
                                          phone: c.phone || '',
                                          dropdownOpen: false,
                                          search: ''
                                        } : it
                                      ));
                                    }}
                                    className="w-full p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 flex items-center gap-2 text-left transition-colors border-b border-gray-100 dark:border-slate-700 last:border-b-0"
                                  >
                                    <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center shrink-0">
                                      <span className="text-primary-700 dark:text-primary-200 font-medium text-[10px]">{(c.nameI18n?.[langKey] || c.name || '')?.charAt(0)}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-medium text-gray-900 dark:text-slate-100 truncate">{c.nameI18n?.[langKey] || c.name}</p>
                                      <p className="text-[10px] text-gray-400">{c.phone}</p>
                                    </div>
                                  </button>
                                ));
                              })()}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Name + Phone row */}
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder={language === 'ar' ? 'أحمد' : 'Ahmed'}
                          className="w-full bg-white dark:bg-slate-900 border-none rounded-xl text-sm font-medium p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-200 dark:focus:ring-slate-700"
                          value={item.name}
                          onChange={e => {
                            const val = e.target.value;
                            const newItems = [...items];
                            newItems[index].name = val;
                            newItems[index].customerId = null;
                            setItems(newItems);
                            
                            if (index === 0 && !customerName) {
                              setCustomerName(val);
                            }
                          }}
                        />
                        <input
                          type="text"
                          placeholder={language === 'ar' ? '05XXXXXXXX' : '05XXXXXXXX'}
                          className="w-full bg-white dark:bg-slate-900 border-none rounded-xl text-sm font-medium p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-200 dark:focus:ring-slate-700"
                          value={item.phone || ''}
                          onChange={e => {
                            const val = e.target.value;
                            const newItems = [...items];
                            newItems[index].phone = val;
                            setItems(newItems);
                          }}
                          dir="ltr"
                        />
                      </div>
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
                onClick={() => setItems([...items, { id: Date.now(), name: '', phone: '', customerId: null, quantity: 1, price: '', imageFile: null, imagePreview: null, dropdownOpen: false, search: '' }])}
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
