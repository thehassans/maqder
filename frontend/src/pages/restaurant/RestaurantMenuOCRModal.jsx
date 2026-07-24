import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, Upload, Loader2, Sparkles, X, Check, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../lib/translations';

export default function RestaurantMenuOCRModal({ isOpen, onClose, onSaved }) {
  const { language } = useSelector((state) => state.ui);
  const { t } = useTranslation(language);
  
  const uploadInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  const [previewSrc, setPreviewSrc] = useState('');
  const [fileName, setFileName] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedItems, setExtractedItems] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectFile = async (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    setFileName(file.name);
    setPreviewSrc(URL.createObjectURL(file));
    setExtractedItems(null);
    
    try {
      setIsExtracting(true);
      const formData = new FormData();
      formData.append('image', file);

      const { data } = await api.post('/ai/restaurant-menu-ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data?.success && data?.items) {
        setExtractedItems(data.items);
        toast.success(language === 'ar' ? 'تم استخراج العناصر بنجاح!' : 'Items extracted successfully!');
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error) {
      console.error('Failed to extract items:', error);
      toast.error(error.response?.data?.error || (language === 'ar' ? 'فشل استخراج العناصر من الصورة' : 'Failed to extract items from image.'));
    } finally {
      setIsExtracting(false);
    }
    
    event.target.value = '';
  };

  const handleRemove = () => {
    setPreviewSrc('');
    setFileName('');
    setExtractedItems(null);
  };

  const handleSave = async () => {
    if (!extractedItems || extractedItems.length === 0) return;
    try {
      setIsSaving(true);
      await api.post('/restaurant/menu-items/bulk', { items: extractedItems });
      toast.success(language === 'ar' ? 'تم حفظ العناصر بنجاح' : 'Items saved successfully');
      onSaved();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || (language === 'ar' ? 'فشل حفظ العناصر' : 'Failed to save items'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveItem = (index) => {
    setExtractedItems(prev => prev.filter((_, i) => i !== index));
  };

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
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white dark:bg-slate-900 shadow-2xl z-10 p-6 sm:p-8"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {language === 'ar' ? 'استخراج قائمة الطعام بالذكاء الاصطناعي' : 'AI Menu Extraction (OCR)'}
              </h2>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                {language === 'ar' 
                  ? 'قم برفع صورة قائمة الطعام وسيقوم الذكاء الاصطناعي باستخراج الأصناف، الفئات والأسعار تلقائياً' 
                  : 'Upload a menu image and AI will auto-extract items, categories, and prices.'}
              </p>
            </div>

            <div className={`rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 p-6 ${previewSrc ? 'mb-6' : ''}`}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                    {language === 'ar' ? 'صورة القائمة' : 'Menu Image'}
                  </div>
                </div>
                {previewSrc && !isExtracting ? (
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1 rounded-xl border border-rose-200 dark:border-rose-800/40 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {language === 'ar' ? 'حذف' : 'Remove'}
                  </button>
                ) : null}
              </div>

              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                onChange={handleSelectFile}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleSelectFile}
                className="hidden"
              />

              {previewSrc ? (
                <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-950/70 h-64">
                  <img src={previewSrc} alt="Menu preview" className="h-full w-full object-contain" />
                  {isExtracting && (
                    <div className="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center">
                      <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
                      <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" /> 
                        {language === 'ar' ? 'جاري استخراج الأصناف...' : 'Extracting menu items...'}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 h-64 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20 mb-4">
                    <ImageIcon className="w-8 h-8 text-primary-500" />
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                    {language === 'ar' ? 'لم يتم اختيار صورة' : 'No image selected'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 mb-6">
                    {language === 'ar' ? 'JPG, PNG, GIF' : 'JPG, PNG, GIF'}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => uploadInputRef.current?.click()}
                      className="btn btn-primary"
                    >
                      <Upload className="w-4 h-4" />
                      {language === 'ar' ? 'رفع صورة' : 'Upload Image'}
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="btn btn-secondary border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <Camera className="w-4 h-4 text-gray-600 dark:text-slate-300" />
                      {language === 'ar' ? 'التقاط' : 'Take Photo'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {extractedItems && !isExtracting && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Check className="w-5 h-5 text-emerald-500" />
                    {language === 'ar' ? `تم استخراج ${extractedItems.length} صنف` : `Extracted ${extractedItems.length} Items`}
                  </h3>
                </div>

                <div className="table-container rounded-xl border border-gray-200 dark:border-slate-700 max-h-80 overflow-y-auto">
                  <table className="table w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-800 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'الاسم' : 'Name'}</th>
                        <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'الفئة' : 'Category'}</th>
                        <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white text-right">{language === 'ar' ? 'السعر' : 'Price'}</th>
                        <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white text-right">{language === 'ar' ? 'إجراء' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50 bg-white dark:bg-slate-900">
                      {extractedItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 text-gray-900 dark:text-slate-100 font-medium">
                            {language === 'ar' ? (item.nameAr || item.nameEn) : (item.nameEn || item.nameAr)}
                            {(item.descriptionEn || item.descriptionAr) && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 font-normal mt-0.5 truncate max-w-[200px]">
                                {language === 'ar' ? (item.descriptionAr || item.descriptionEn) : (item.descriptionEn || item.descriptionAr)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 dark:bg-slate-800 text-xs font-medium text-gray-700 dark:text-slate-300">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                            {item.sellingPrice?.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                              title={language === 'ar' ? 'إزالة' : 'Remove'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800">
                  <button onClick={onClose} disabled={isSaving} className="btn btn-secondary">
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button 
                    onClick={handleSave} 
                    disabled={isSaving || extractedItems.length === 0} 
                    className="btn btn-primary bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/30"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {language === 'ar' ? 'حفظ وإضافة للقائمة' : 'Save All Items'}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
