import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Link as LinkIcon, Upload, X, Save, Loader2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { getImageUrl } from '../../lib/api';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../lib/translations';

export default function RestaurantMenuBulkImagesModal({ isOpen, onClose, onSaved }) {
  const { language } = useSelector((state) => state.ui);
  const { t } = useTranslation(language);

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track changes: { itemId: { type: 'url' | 'file', value: string | File, preview: string } }
  const [changes, setChanges] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchItems();
      setChanges({});
      setSearchQuery('');
    }
  }, [isOpen]);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      // Fetch all items (limit 1000 to ensure we get most items)
      const { data } = await api.get('/restaurant/menu-items?limit=1000');
      setItems(data.items || []);
    } catch (error) {
      toast.error('Failed to load menu items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlChange = (id, url) => {
    if (!url) {
      const newChanges = { ...changes };
      delete newChanges[id];
      setChanges(newChanges);
    } else {
      setChanges(prev => ({
        ...prev,
        [id]: { type: 'url', value: url, preview: url }
      }));
    }
  };

  const handleFileChange = (id, file) => {
    if (file) {
      setChanges(prev => ({
        ...prev,
        [id]: { type: 'file', value: file, preview: URL.createObjectURL(file) }
      }));
    }
  };

  const handleSave = async () => {
    const changedIds = Object.keys(changes);
    if (changedIds.length === 0) {
      onClose();
      return;
    }

    try {
      setIsSaving(true);
      
      const promises = changedIds.map(async (id) => {
        const change = changes[id];
        let finalImageUrl = '';

        if (change.type === 'file') {
          const formData = new FormData();
          formData.append('image', change.value);
          const { data } = await api.post('/restaurant/menu-items/upload-image', formData);
          finalImageUrl = data.imageUrl;
        } else {
          finalImageUrl = change.value; // URL
        }

        return api.put(`/restaurant/menu-items/${id}`, { imageUrl: finalImageUrl });
      });

      await Promise.all(promises);
      toast.success(language === 'ar' ? 'تم حفظ الصور بنجاح' : 'Images saved successfully');
      onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(language === 'ar' ? 'فشل حفظ بعض الصور' : 'Failed to save some images');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredItems = items.filter(item => 
    (item.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     item.nameAr?.includes(searchQuery) ||
     item.sku?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-[2rem] bg-white dark:bg-slate-900 shadow-2xl z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {language === 'ar' ? 'إضافة صور للمنيو' : 'Bulk Menu Images'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {language === 'ar' ? 'قم برفع الصور أو إضافة روابط للأصناف' : 'Upload files or paste image URLs for your menu items'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col p-6 sm:p-8">
              <div className="mb-6 relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={language === 'ar' ? 'ابحث عن صنف...' : 'Search items...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input ps-10 w-full"
                />
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-40">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-2" />
                    <span className="text-gray-500">{language === 'ar' ? 'جاري التحميل...' : 'Loading items...'}</span>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                    {language === 'ar' ? 'لا توجد أصناف تطابق بحثك' : 'No items match your search'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredItems.map(item => {
                      const change = changes[item._id];
                      const preview = change ? change.preview : item.imageUrl ? getImageUrl(item.imageUrl) : null;
                      
                      return (
                        <div key={item._id} className="flex gap-4 p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                          <div className="w-20 h-20 rounded-lg bg-gray-200 dark:bg-slate-700 flex-shrink-0 overflow-hidden relative group">
                            {preview ? (
                              <img src={preview} alt={item.nameEn} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <ImageIcon className="w-8 h-8" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <label className="cursor-pointer p-2">
                                <Upload className="w-5 h-5 text-white" />
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={(e) => handleFileChange(item._id, e.target.files?.[0])}
                                />
                              </label>
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 dark:text-white truncate">
                              {language === 'ar' ? (item.nameAr || item.nameEn) : (item.nameEn || item.nameAr)}
                            </div>
                            <div className="text-xs text-gray-500 mb-3">{item.category}</div>
                            
                            <div className="relative">
                              <div className="absolute inset-y-0 start-0 flex items-center ps-2.5 pointer-events-none">
                                <LinkIcon className="w-3.5 h-3.5 text-gray-400" />
                              </div>
                              <input
                                type="url"
                                placeholder={language === 'ar' ? 'أو ضع رابط الصورة هنا...' : 'Or paste image URL...'}
                                value={change?.type === 'url' ? change.value : ''}
                                onChange={(e) => handleUrlChange(item._id, e.target.value)}
                                className="input text-xs h-8 ps-8 w-full"
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 sm:p-8 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 rounded-b-[2rem]">
              <button onClick={onClose} disabled={isSaving} className="btn btn-secondary">
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button 
                onClick={handleSave} 
                disabled={isSaving || Object.keys(changes).length === 0} 
                className="btn btn-primary bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/30 min-w-[120px]"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {language === 'ar' ? 'حفظ التغييرات' : `Save ${Object.keys(changes).length || ''} Changes`}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
