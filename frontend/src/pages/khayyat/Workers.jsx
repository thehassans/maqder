import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../lib/api';
const t = (key, opts) => opts?.defaultValue || key;

import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { StatusBadge } from './components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from './components/ui/Table';
import { ConfirmModal } from './components/ui/ConfirmModal';
import DemoBlockedModal from './components/ui/DemoBlockedModal';
import { Plus, Edit, Trash2, LogIn } from 'lucide-react';
import SARIcon from './components/ui/SARIcon';
import toast from 'react-hot-toast';

const Workers = () => {
  
  const { user } = useSelector(state => state.auth);
  const { language } = useSelector(state => state.ui);
  const loginAsWorker = async (workerId) => { const res = await api.post(`/khayyat/worker/${workerId}/login`); /* handle token here if needed */ return res.data; };
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ open: false, worker: null, loading: false });
  const [demoBlockedOpen, setDemoBlockedOpen] = useState(false);
  const [loginWorkerId, setLoginWorkerId] = useState(null);

  const isDemo = !!user?.isDemoSession;

  const langKey = (language || 'en').split('-')[0];

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const response = await api.get('/khayyat/worker');
      const data = response.data;
      setWorkers(Array.isArray(data) ? data : data.workers || []);
    } catch (error) {
      console.error('Error fetching workers:', error);
      setWorkers([]);
    }
    setLoading(false);
  };

  const requestDelete = (worker) => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    setDeleteModal({ open: true, worker, loading: false });
  };

  const closeDelete = () => {
    setDeleteModal({ open: false, worker: null, loading: false });
  };

  const handleLoginAsWorker = async (workerId) => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    if (!workerId) return;
    setLoginWorkerId(workerId);
    const result = await loginAsWorker(workerId);
    setLoginWorkerId(null);
    if (result?.success) {
      toast.success((language === 'ar' ? 'workers.loginAsWorkerSuccess' : 'workers.loginAsWorkerSuccess'));
      navigate('/app/dashboard/khayyat/workers');
      return;
    }
    toast.error(result?.error || (language === 'ar' ? 'حدث خطأ' : 'Error'));
  };

  const confirmDelete = async () => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      closeDelete();
      return;
    }
    const id = deleteModal?.worker?._id;
    if (!id) {
      closeDelete();
      return;
    }
    setDeleteModal((p) => ({ ...p, loading: true }));
    try {
      await api.delete(`/khayyat/worker/${id}`);
      toast.success('Worker deleted');
      closeDelete();
      fetchWorkers();
    } catch (error) {
      toast.error('Failed to delete');
      setDeleteModal((p) => ({ ...p, loading: false }));
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100">{(language === 'ar' ? 'العمال' : 'Workers')}</h1>
        <Button data-tutorial="workers-create-button" onClick={() => (isDemo ? setDemoBlockedOpen(true) : navigate('/app/dashboard/khayyat/workers/new'))} icon={Plus} className="w-full sm:w-auto">
          {(language === 'ar' ? 'إضافة عامل' : 'Create Worker')}
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : workers.length > 0 ? (
          <Table>
            <Thead>
              <Tr>
                <Th>{(language === 'ar' ? 'الاسم' : 'Name')}</Th>
                <Th>{(language === 'ar' ? 'رقم الجوال' : 'Phone Number')}</Th>
                <Th>{(language === 'ar' ? 'نوع الدفع' : 'Payment Type')}</Th>
                <Th>{(language === 'ar' ? 'المبلغ المعلق' : 'Pending Amount')}</Th>
                <Th>{(language === 'ar' ? 'الحالة' : 'Status')}</Th>
                <Th>{(language === 'ar' ? 'إجراءات' : 'Actions')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {workers.map((worker) => (
                <Tr key={worker._id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                        <span className="text-emerald-700 dark:text-emerald-200 font-medium">{(worker.nameI18n?.[langKey] || worker.name || '')?.charAt(0)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/user/workers/${worker._id}`)}
                        className="font-medium text-left hover:underline"
                      >
                        {worker.nameI18n?.[langKey] || worker.name}
                      </button>
                    </div>
                  </Td>
                  <Td>{worker.phone}</Td>
                  <Td>
                    <span className="capitalize">
                      {worker.paymentType === 'per_stitching' ? (language === 'ar' ? 'لكل قطعة' : 'Per Stitching') : (language === 'ar' ? 'راتب' : 'Salary')}
                    </span>
                    <span className="text-gray-500 dark:text-slate-400 ml-1 inline-flex items-center gap-1">({worker.paymentAmount} <SARIcon className="w-3 h-3" />)</span>
                  </Td>
                  <Td className="font-medium text-amber-600"><span className="inline-flex items-center gap-1">{worker.pendingAmount || 0} <SARIcon className="w-3 h-3" /></span></Td>
                  <Td><StatusBadge status={worker.isActive ? 'active' : 'inactive'} /></Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLoginAsWorker(worker._id)}
                        disabled={loginWorkerId === worker._id}
                        className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-300 rounded-lg disabled:opacity-50"
                      >
                        <LogIn className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => (isDemo ? setDemoBlockedOpen(true) : navigate(`/user/workers/${worker._id}/edit`))}
                        disabled={isDemo}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800/50 text-gray-600 dark:text-slate-300 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => requestDelete(worker)}
                        disabled={isDemo}
                        className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <div className="p-12 text-center text-gray-500 dark:text-slate-400">
            {(language === 'ar' ? 'لا توجد بيانات' : 'No data available')}
          </div>
        )}
      </Card>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={closeDelete}
        title={(language === 'ar' ? 'حذف' : 'Delete')}
        message={(language === 'ar' ? 'workers.deleteConfirmTitle' : 'workers.deleteConfirmTitle')}
        subtitle={(language === 'ar' ? 'workers.deleteConfirmSubtitle' : 'workers.deleteConfirmSubtitle')}
        confirmText={(language === 'ar' ? 'حذف' : 'Delete')}
        cancelText={(language === 'ar' ? 'إلغاء' : 'Cancel')}
        confirmVariant="danger"
        loading={deleteModal.loading}
        onConfirm={confirmDelete}
        previewTitle={deleteModal?.worker?.nameI18n?.[langKey] || deleteModal?.worker?.name || ''}
        previewSubtitle={deleteModal?.worker?.phone || ''}
      />

      <DemoBlockedModal
        isOpen={demoBlockedOpen}
        onClose={() => setDemoBlockedOpen(false)}
        title="Live Demo"
        phone="+966596775485"
      />
    </div>
  );
};

export default Workers;




