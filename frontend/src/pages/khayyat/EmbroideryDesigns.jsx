import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../lib/api';
const t = (key, opts) => opts?.defaultValue || key;

import { Card, CardBody } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Modal } from './components/ui/Modal';
import DemoBlockedModal from './components/ui/DemoBlockedModal';
import { Input, Textarea } from './components/ui/Input';
import { ChevronLeft, ChevronRight, Plus, Upload, Trash2, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const EmbroideryDesigns = () => {
  
  const { user } = useSelector(state => state.auth);
  const { language } = useSelector(state => state.ui);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isDemo = !!user?.isDemoSession;
  const [demoBlockedOpen, setDemoBlockedOpen] = useState(false);

  const langKey = (language || 'en').split('-')[0];

  const [loading, setLoading] = useState(true);
  const [designs, setDesigns] = useState([]);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewModal, setPreviewModal] = useState({ open: false, design: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, design: null, loading: false });

  const [previewIndex, setPreviewIndex] = useState(-1);
  const swipeStartXRef = useRef(null);
  const tutorialCreateOpenedRef = useRef(false);

  const [uploading, setUploading] = useState(false);
  const [newDesign, setNewDesign] = useState({ name: '', note: '', image: null, preview: null });

  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const resolveUploadsUrl = useCallback((src) => {
    if (!src) return src;
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    if (!src.startsWith('/uploads/')) return src;
    const baseUrl = api?.defaults?.baseURL;
    if (!baseUrl || typeof baseUrl !== 'string') return src;
    try {
      if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
        return `${new URL(baseUrl).origin}${src}`;
      }
    } catch (e) {
      return src;
    }
    return src;
  }, [api]);

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/khayyat/embroidery-designs');
      setDesigns(Array.isArray(response.data?.designs) ? response.data.designs : []);
    } catch (error) {
      toast.error('Failed to load designs');
      setDesigns([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDesigns();
  }, []);

  const sortedDesigns = useMemo(() => {
    return (designs || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
  }, [designs]);

  const openUploadModal = () => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    setNewDesign({ name: '', note: '', image: null, preview: null });
    setUploadModalOpen(true);
  };

  useEffect(() => {
    const shouldOpen = (searchParams.get('create') || '') === '1';
    if (!shouldOpen) return;
    if (tutorialCreateOpenedRef.current) return;
    if (uploadModalOpen) return;
    tutorialCreateOpenedRef.current = true;
    openUploadModal();
  }, [openUploadModal, searchParams, uploadModalOpen]);

  const closeUploadModal = () => {
    setUploadModalOpen(false);
    setNewDesign({ name: '', note: '', image: null, preview: null });
  };

  const convertImageToWebp = async (file, maxWidth = 1200, quality = 0.85) => {
    if (!file) return { webpFile: null, previewDataUrl: null };

    const readAsDataUrl = (f) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(f);
    });

    if (file.type === 'image/webp') {
      const dataUrl = await readAsDataUrl(file);
      return { webpFile: file, previewDataUrl: typeof dataUrl === 'string' ? dataUrl : null };
    }

    const inputDataUrl = await readAsDataUrl(file);
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to load image'));
      el.src = typeof inputDataUrl === 'string' ? inputDataUrl : '';
    });

    const scale = img.width ? Math.min(1, maxWidth / img.width) : 1;
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available');
    ctx.drawImage(img, 0, 0, w, h);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (!blob) throw new Error('Failed to convert image');

    const base = (file.name || 'image').replace(/\.[^/.]+$/, '');
    const webpFile = new File([blob], `${base}.webp`, { type: 'image/webp' });
    const previewDataUrl = canvas.toDataURL('image/webp', quality);
    return { webpFile, previewDataUrl };
  };

  const handlePickDesignImage = async (file) => {
    try {
      const { webpFile, previewDataUrl } = await convertImageToWebp(file, 1200, 0.85);
      setNewDesign((prev) => ({ ...prev, image: webpFile, preview: previewDataUrl }));
    } catch (e) {
      toast.error('Failed to prepare image');
      setNewDesign((prev) => ({ ...prev, image: null, preview: null }));
    }
  };

  const handleUpload = async () => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    if (!newDesign.name.trim()) {
      toast.error('Design name is required');
      return;
    }

    setUploading(true);
    try {
      const data = new FormData();
      data.append('name', newDesign.name.trim());
      data.append('note', newDesign.note || '');
      if (newDesign.image) data.append('image', newDesign.image);

      await api.post('/khayyat/embroidery-designs', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Design uploaded');
      closeUploadModal();
      fetchDesigns();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Upload failed');
    }
    setUploading(false);
  };

  const requestDelete = (design) => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    setDeleteModal({ open: true, design, loading: false });
  };

  const closeDelete = () => {
    setDeleteModal({ open: false, design: null, loading: false });
  };

  const confirmDelete = async () => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      closeDelete();
      return;
    }
    const id = deleteModal?.design?._id;
    if (!id) {
      closeDelete();
      return;
    }
    setDeleteModal((p) => ({ ...p, loading: true }));
    try {
      await api.delete(`/khayyat/embroidery-designs/${id}`);
      toast.success('Design deleted');
      closeDelete();
      fetchDesigns();
    } catch (error) {
      toast.error('Failed to delete');
      setDeleteModal((p) => ({ ...p, loading: false }));
    }
  };

  const setPreviewByIndex = (idx) => {
    const list = Array.isArray(sortedDesigns) ? sortedDesigns : [];
    if (list.length === 0) return;
    const nextIndex = ((idx % list.length) + list.length) % list.length;
    const next = list[nextIndex];
    setPreviewIndex(nextIndex);
    setNoteDraft(typeof next?.note === 'string' ? next.note : '');
    setPreviewModal({ open: true, design: next });
  };

  const openPreview = (design, idx) => {
    if (typeof idx === 'number' && idx >= 0) {
      setPreviewByIndex(idx);
      return;
    }
    const list = Array.isArray(sortedDesigns) ? sortedDesigns : [];
    const i = list.findIndex((x) => x?._id === design?._id);
    setPreviewByIndex(i >= 0 ? i : 0);
  };

  const closePreview = () => {
    setSavingNote(false);
    setPreviewIndex(-1);
    setPreviewModal({ open: false, design: null });
  };

  const goPrev = () => {
    if (!previewModal.open) return;
    setPreviewByIndex((previewIndex >= 0 ? previewIndex : 0) - 1);
  };

  const goNext = () => {
    if (!previewModal.open) return;
    setPreviewByIndex((previewIndex >= 0 ? previewIndex : 0) + 1);
  };

  useEffect(() => {
    if (!previewModal.open) return;
    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'Escape') closePreview();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [previewIndex, previewModal.open]);

  const saveDesignNote = async () => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    const id = previewModal?.design?._id;
    if (!id) return;

    setSavingNote(true);
    try {
      const data = new FormData();
      data.append('note', noteDraft || '');
      const res = await api.put(`/khayyat/embroidery-designs/${id}`, data);
      const updated = res.data?.design;

      setPreviewModal((p) => ({
        ...p,
        design: updated ? { ...p.design, ...updated } : p.design
      }));

      setDesigns((prev) => (Array.isArray(prev)
        ? prev.map((d) => (d._id === id ? { ...d, ...(updated || {}), note: typeof noteDraft === 'string' ? noteDraft : d.note } : d))
        : prev));

      toast.success((language === 'ar' ? 'حفظ' : 'Save'));
    } catch (e) {
      toast.error((language === 'ar' ? 'حدث خطأ' : 'Error'));
    }
    setSavingNote(false);
  };

  const createOrderWithDesign = (design) => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    closePreview();
    navigate(`/user/stitchings/new?embroideryDesignId=${design._id}`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100">{(language === 'ar' ? 'تصاميم التطريز' : 'Embroidery Designs')}</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">{(language === 'ar' ? 'ارفع مكتبتك وأنشئ الطلبات بسرعة.' : 'Upload your library and create orders faster.')}</p>
        </div>
        <Button data-tutorial="embroidery-upload-button" onClick={openUploadModal} icon={Plus}>
          {(language === 'ar' ? 'رفع تصميم جديد' : 'Upload New Design')}
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardBody>
            <div className="flex items-center justify-center h-56">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
            </div>
          </CardBody>
        </Card>
      ) : sortedDesigns.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-7 h-7 text-gray-400 dark:text-slate-500" />
              </div>
              <div className="text-sm text-gray-500 dark:text-slate-400">{(language === 'ar' ? 'لا توجد تصاميم بعد. ارفع أول تصميم لك.' : 'No designs yet. Upload your first design.')}</div>
              <div className="mt-4 flex justify-center">
                <Button onClick={openUploadModal} icon={Upload}>{(language === 'ar' ? 'رفع تصميم جديد' : 'Upload New Design')}</Button>
              </div>
            </div>
          </CardBody>
        </Card>
      ) : (
        <motion.div 
          className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6"
          initial="hidden" animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
        >
          {sortedDesigns.map((d, idx) => {
            const imageUrl = d.image ? resolveUploadsUrl(d.image) : null;
            const imageSrc = imageUrl ? `${imageUrl}${d.imageUpdatedAt ? `?v=${d.imageUpdatedAt}` : ''}` : null;
            const displayName = d?.nameI18n?.[langKey] || d.name;

            return (
              <motion.div
                key={d._id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
                className="group relative rounded-[2rem] border border-white/40 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-black/50 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1 transition-all duration-500 break-inside-avoid"
              >
                <div className="relative w-full aspect-[4/5] bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer" onClick={() => openPreview(d, idx)}>
                  {imageSrc ? (
                    <>
                      <img src={imageSrc} alt={displayName} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                      <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <h3 className="text-white font-bold text-xl drop-shadow-md mb-2">{displayName}</h3>
                    {d?.note && (
                      <p className="text-white/80 text-sm line-clamp-2 drop-shadow mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                        {d.note}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
                      <button 
                        onClick={(e) => { e.stopPropagation(); createOrderWithDesign(d); }}
                        disabled={isDemo}
                        className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-black/20"
                      >
                        {(language === 'ar' ? 'إنشاء طلب' : 'Create Order')}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); requestDelete(d); }}
                        disabled={isDemo}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-500/80 hover:bg-rose-500 backdrop-blur-md text-white border border-rose-400/50 transition-all shadow-lg shadow-black/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <Modal
        isOpen={uploadModalOpen}
        onClose={closeUploadModal}
        title={(language === 'ar' ? 'رفع تصميم جديد' : 'Upload New Design')}
        size="lg"
      >
        <div data-tutorial="embroidery-upload-modal" className="space-y-4">
          <Input
            label={(language === 'ar' ? 'اسم التصميم' : 'Design Name')}
            value={newDesign.name}
            onChange={(e) => setNewDesign({ ...newDesign, name: e.target.value })}
            placeholder="e.g. Golden Palm"
          />

          <Textarea
            label={(language === 'ar' ? 'ملاحظة' : 'Note')}
            value={newDesign.note}
            onChange={(e) => setNewDesign({ ...newDesign, note: e.target.value })}
            placeholder={(language === 'ar' ? 'أضف ملاحظة لهذا التصميم (اختياري)' : 'Add a note for this design (optional)')}
          />

          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-900/40">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-gray-700 dark:text-slate-200">{(language === 'ar' ? 'صورة التصميم' : 'Design Image')}</div>
              {newDesign.image ? (
                <button
                  type="button"
                  onClick={() => setNewDesign({ ...newDesign, image: null, preview: null })}
                  className="text-sm text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  {(language === 'ar' ? 'common.remove' : 'common.remove')}
                </button>
              ) : null}
            </div>

            <div className="mt-3 flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 overflow-hidden flex items-center justify-center">
                {newDesign.preview ? (
                  <img src={newDesign.preview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-7 h-7 text-gray-300 dark:text-slate-600" />
                )}
              </div>
              <div>
                <label className="cursor-pointer">
                  <span className="px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    {(language === 'ar' ? 'اختر ملف' : 'Choose File')}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      if (!f) {
                        setNewDesign({ ...newDesign, image: null, preview: null });
                        return;
                      }
                      handlePickDesignImage(f);
                    }}
                    className="hidden"
                  />
                </label>
                <div className="text-xs text-gray-500 dark:text-slate-400 mt-2">PNG, JPG, WEBP up to 5MB</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleUpload} loading={uploading} className="flex-1" disabled={isDemo}>
              {(language === 'ar' ? 'حفظ' : 'Save')}
            </Button>
            <Button variant="secondary" onClick={closeUploadModal} className="flex-1">
              {(language === 'ar' ? 'إلغاء' : 'Cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={previewModal.open}
        onClose={closePreview}
        title={(previewModal.design?.nameI18n?.[langKey] || previewModal.design?.name) || (language === 'ar' ? 'معاينة' : 'Preview')}
        size="full"
      >
        <div className="grid gap-5 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div
              className="relative rounded-3xl overflow-hidden border border-gray-200/70 dark:border-slate-700/70 bg-gray-950"
              onPointerDown={(e) => {
                swipeStartXRef.current = e.clientX;
              }}
              onPointerUp={(e) => {
                const start = swipeStartXRef.current;
                swipeStartXRef.current = null;
                if (start == null) return;
                const dx = e.clientX - start;
                if (Math.abs(dx) < 60) return;
                if (dx > 0) goPrev();
                else goNext();
              }}
            >
              {previewModal.design?.image ? (
                <img
                  src={`${resolveUploadsUrl(previewModal.design.image)}${previewModal.design.imageUpdatedAt ? `?v=${previewModal.design.imageUpdatedAt}` : ''}`}
                  alt={previewModal.design?.name}
                  className="w-full max-h-[76vh] lg:h-[76vh] object-contain bg-black"
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-300 dark:text-slate-600">
                  <ImageIcon className="w-10 h-10" />
                </div>
              )}

              {sortedDesigns.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-white hover:bg-black/55 transition-colors flex items-center justify-center"
                    title="Previous"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-white hover:bg-black/55 transition-colors flex items-center justify-center"
                    title="Next"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-white/80 text-xs tracking-widest">
                    {(previewIndex >= 0 ? previewIndex + 1 : 1)}/{sortedDesigns.length}
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-3xl border border-gray-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl p-4">
              <Textarea
                label={(language === 'ar' ? 'ملاحظة' : 'Note')}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder={(language === 'ar' ? 'أضف ملاحظة لهذا التصميم (اختياري)' : 'Add a note for this design (optional)')}
              />
              <div className="mt-3 flex gap-3">
                <Button onClick={saveDesignNote} loading={savingNote} className="flex-1 rounded-2xl" disabled={isDemo}>
                  {(language === 'ar' ? 'حفظ' : 'Save')}
                </Button>
                <Button variant="secondary" onClick={closePreview} className="flex-1 rounded-2xl" disabled={savingNote}>
                  {(language === 'ar' ? 'إغلاق' : 'Close')}
                </Button>
              </div>
            </div>

            <Button
              variant="success"
              onClick={() => previewModal.design && createOrderWithDesign(previewModal.design)}
              className="w-full rounded-2xl py-3"
              disabled={isDemo}
            >
              {(language === 'ar' ? 'إنشاء طلب' : 'Create Order')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteModal.open}
        onClose={closeDelete}
        title={(language === 'ar' ? 'حذف' : 'Delete')}
        size="lg"
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-900/10 p-4">
            <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">
              {(language === 'ar' ? 'حذف هذا التصميم؟' : 'Delete this design?')}
            </div>
            <div className="text-sm text-gray-600 dark:text-slate-300 mt-1">
              {(language === 'ar' ? 'لا يمكن التراجع عن هذا الإجراء.' : 'This action cannot be undone.')}
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 bg-white/60 dark:bg-slate-900/30">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
              {deleteModal?.design?.image ? (
                <img
                  src={`${resolveUploadsUrl(deleteModal.design.image)}${deleteModal.design.imageUpdatedAt ? `?v=${deleteModal.design.imageUpdatedAt}` : ''}`}
                  alt={deleteModal?.design?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-7 h-7 text-gray-300 dark:text-slate-600" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                {deleteModal?.design?.nameI18n?.[langKey] || deleteModal?.design?.name || '—'}
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-400 truncate">
                {(language === 'ar' ? 'حذف التصميم لن يؤثر على الطلبات السابقة التي استخدمته.' : 'Removing it will not delete existing orders that used this design.')}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="danger" onClick={confirmDelete} loading={deleteModal.loading} className="flex-1" disabled={isDemo}>
              {(language === 'ar' ? 'حذف' : 'Delete')}
            </Button>
            <Button variant="secondary" onClick={closeDelete} className="flex-1" disabled={deleteModal.loading}>
              {(language === 'ar' ? 'إلغاء' : 'Cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      <DemoBlockedModal
        isOpen={demoBlockedOpen}
        onClose={() => setDemoBlockedOpen(false)}
        title={(language === 'ar' ? 'وضع العرض' : 'Demo Mode')}
        phone="+966596775485"
      />
    </div>
  );
};

export default EmbroideryDesigns;




