import React, { useState, useEffect, useRef } from 'react';

import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../lib/api';
const t = (key, opts) => opts?.defaultValue || key;

import { Card, CardBody } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import DemoBlockedModal from './components/ui/DemoBlockedModal';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const WorkerForm = () => {
  
  const { user } = useSelector(state => state.auth);
  const { language } = useSelector(state => state.ui);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const langKey = (language || 'en').split('-')[0];
  const isRtl = langKey === 'ar' || langKey === 'ur';

  const isDemo = !!user?.isDemoSession;
  const [demoBlockedOpen, setDemoBlockedOpen] = useState(false);

  const translateTimerRef = useRef(null);
  const [nameTranslating, setNameTranslating] = useState(false);
  const [nameI18nPreview, setNameI18nPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    paymentType: 'per_stitching',
    paymentAmount: 0,
    isActive: true
  });

  useEffect(() => {
    if (isEdit) fetchWorker();
  }, [id]);

  useEffect(() => {
    const text = typeof formData.name === 'string' ? formData.name.trim() : '';

    if (translateTimerRef.current) {
      clearTimeout(translateTimerRef.current);
      translateTimerRef.current = null;
    }

    if (!text) {
      setNameI18nPreview(null);
      setNameTranslating(false);
      return;
    }

    translateTimerRef.current = setTimeout(async () => {
      try {
        setNameTranslating(true);
        const resp = await api.post('/khayyat/settings/translate', {
          entries: [{ id: 'name', text }],
          targetLangs: ['en', 'ar']
        });
        const tr = resp.data?.translations?.name || null;
        if (tr && typeof tr === 'object') {
          setNameI18nPreview(tr);
        }
      } catch (e) {

      }
      setNameTranslating(false);
    }, 650);

    return () => {
      if (translateTimerRef.current) {
        clearTimeout(translateTimerRef.current);
        translateTimerRef.current = null;
      }
    };
  }, [api, formData.name]);

  const fetchWorker = async () => {
    try {
      const response = await api.get(`/khayyat/worker/${id}`);
      const worker = response.data.worker;
      setFormData({
        name: worker.name,
        phone: worker.phone,
        password: '',
        paymentType: worker.paymentType,
        paymentAmount: worker.paymentAmount,
        isActive: worker.isActive
      });
    } catch (error) {
      toast.error('Failed to load worker');
      navigate('/app/dashboard/khayyat/workers');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    setLoading(true);

    try {
      const data = { ...formData };
      if (!data.password) delete data.password;

      if (isEdit) {
        await api.put(`/khayyat/worker/${id}`, data);
        toast.success('Worker updated');
      } else {
        await api.post('/khayyat/worker', data);
        toast.success('Worker created');
      }
      navigate('/app/dashboard/khayyat/workers');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/app/dashboard/khayyat/workers')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800/50 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
          {isEdit ? (language === 'ar' ? 'تعديل العامل' : 'Edit Worker') : (language === 'ar' ? 'إضافة عامل' : 'Create Worker')}
        </h1>
      </div>

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Input
                  data-tutorial="worker-form-name"
                  label={(language === 'ar' ? 'الاسم' : 'Name')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                {nameI18nPreview?.[langKey] ? (
                  <div className="text-xs text-gray-500 dark:text-slate-400" dir={isRtl ? 'rtl' : 'ltr'}>
                    {nameI18nPreview[langKey]}
                  </div>
                ) : null}
              </div>
              <Input
                label={(language === 'ar' ? 'رقم الجوال' : 'Phone Number')}
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+966501234567"
                required
              />
            </div>

            {(nameTranslating || nameI18nPreview?.[langKey]) ? (
              <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{(language === 'ar' ? 'common.translation' : 'common.translation')}</div>
                  {nameTranslating ? (
                    <div className="text-xs text-gray-500 dark:text-slate-400">{(language === 'ar' ? 'جارٍ التحميل...' : 'Loading...')}</div>
                  ) : null}
                </div>
                {nameI18nPreview?.[langKey] ? (
                  <div className="mt-3 text-xs text-gray-700 dark:text-slate-200" dir={isRtl ? 'rtl' : 'ltr'}>
                    {nameI18nPreview[langKey] || ''}
                  </div>
                ) : null}
              </div>
            ) : null}

            <Input
              label={(language === 'ar' ? 'كلمة المرور' : 'Password')}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={isEdit ? '••••••••' : ''}
              required={!isEdit}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                {(language === 'ar' ? 'نوع الدفع' : 'Payment Type')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentType: 'per_stitching' })}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    formData.paymentType === 'per_stitching'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-slate-700 dark:hover:border-slate-600'
                  }`}
                >
                  <p className={`font-medium ${formData.paymentType === 'per_stitching' ? 'text-primary-700 dark:text-primary-200' : 'text-gray-700 dark:text-slate-200'}`}>
                    {(language === 'ar' ? 'لكل قطعة' : 'Per Stitching')}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentType: 'salary' })}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    formData.paymentType === 'salary'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-slate-700 dark:hover:border-slate-600'
                  }`}
                >
                  <p className={`font-medium ${formData.paymentType === 'salary' ? 'text-primary-700 dark:text-primary-200' : 'text-gray-700 dark:text-slate-200'}`}>
                    {(language === 'ar' ? 'راتب' : 'Salary')}
                  </p>
                </button>
              </div>
            </div>

            <Input
              label={(language === 'ar' ? 'مبلغ الدفع' : 'Payment Amount')}
              type="number"
              value={formData.paymentAmount}
              onChange={(e) => setFormData({ ...formData, paymentAmount: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
            />

            {isEdit && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 dark:border-slate-700 text-primary-600"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-slate-200">
                  {(language === 'ar' ? 'نشط' : 'Active')}
                </label>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" loading={loading} className="flex-1" disabled={isDemo}>
                {isEdit ? (language === 'ar' ? 'حفظ' : 'Save') : (language === 'ar' ? 'إضافة عامل' : 'Create Worker')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/app/dashboard/khayyat/workers')}>
                {(language === 'ar' ? 'إلغاء' : 'Cancel')}
              </Button>
            </div>

            <DemoBlockedModal
              isOpen={demoBlockedOpen}
              onClose={() => setDemoBlockedOpen(false)}
              title={(language === 'ar' ? 'وضع العرض' : 'Demo Mode')}
              phone="+966596775485"
            />
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default WorkerForm;




