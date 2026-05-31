import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../lib/api';
const t = (key, opts) => opts?.defaultValue || key;

import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Modal } from './components/ui/Modal';
import { ConfirmModal } from './components/ui/ConfirmModal';
import DemoBlockedModal from './components/ui/DemoBlockedModal';
import { Input } from './components/ui/Input';
import { Table, Thead, Tbody, Tr, Th, Td } from './components/ui/Table';
import SARIcon from './components/ui/SARIcon';
import { Droplets, Edit, Plus, Trash2, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

const Laundry = () => {
  
  const { user } = useSelector(state => state.auth);
  const { language } = useSelector(state => state.ui);
  const [searchParams] = useSearchParams();

  const isDemo = !!user?.isDemoSession;
  const [demoBlockedOpen, setDemoBlockedOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [laundries, setLaundries] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const tutorialCreateOpenedRef = useRef(false);

  const [createForm, setCreateForm] = useState({ name: '', pricePerPiece: '' });
  const [editForm, setEditForm] = useState({ id: null, name: '', pricePerPiece: '' });
  const [assignForm, setAssignForm] = useState({ id: null, pieces: '' });

  const [paymentsModal, setPaymentsModal] = useState({
    open: false,
    laundry: null,
    loading: false,
    paying: false,
    payments: [],
    summary: null,
    amount: '',
    description: ''
  });

  const [deleteModal, setDeleteModal] = useState({ open: false, laundry: null, loading: false });

  const computed = useMemo(() => {
    const list = Array.isArray(laundries) ? laundries : [];
    const totalAssigned = list.reduce((sum, x) => sum + (Number(x.totalAssigned) || 0), 0);
    const totalAmount = list.reduce((sum, x) => sum + ((Number(x.totalAssigned) || 0) * (Number(x.pricePerPiece) || 0)), 0);
    const totalPaid = list.reduce((sum, x) => sum + (Number(x.totalPaid) || 0), 0);
    const pendingAmount = Math.max(0, totalAmount - totalPaid);
    return { totalAssigned, totalAmount, totalPaid, pendingAmount };
  }, [laundries]);

  const fetchLaundries = async () => {
    try {
      setLoading(true);
      const res = await api.get('/khayyat/laundry');
      setLaundries(Array.isArray(res.data?.laundries) ? res.data.laundries : []);
    } catch (e) {
      setLaundries([]);
      toast.error((language === 'ar' ? 'حدث خطأ' : 'Error'));
    }
    setLoading(false);
  };

  const openPayments = async (l) => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    const id = l?._id;
    if (!id) return;
    setPaymentsModal({
      open: true,
      laundry: l,
      loading: true,
      paying: false,
      payments: [],
      summary: null,
      amount: '',
      description: ''
    });
    try {
      const res = await api.get(`/khayyat/laundry/${id}/payments`);
      setPaymentsModal((p) => ({
        ...p,
        loading: false,
        payments: Array.isArray(res.data?.payments) ? res.data.payments : [],
        summary: res.data?.summary || null,
        laundry: res.data?.laundry || l
      }));
    } catch (e) {
      toast.error(e?.response?.data?.error || (language === 'ar' ? 'حدث خطأ' : 'Error'));
      setPaymentsModal((p) => ({ ...p, loading: false }));
    }
  };

  const closePayments = () => {
    setPaymentsModal({
      open: false,
      laundry: null,
      loading: false,
      paying: false,
      payments: [],
      summary: null,
      amount: '',
      description: ''
    });
  };

  const submitPayment = async () => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    const id = paymentsModal?.laundry?._id;
    if (!id) return;

    const amount = Number(paymentsModal.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error((language === 'ar' ? 'المبلغ غير صحيح' : 'Invalid amount'));
      return;
    }

    setPaymentsModal((p) => ({ ...p, paying: true }));
    try {
      await api.post(`/khayyat/laundry/${id}/payments`, {
        amount,
        description: paymentsModal.description || ''
      });
      toast.success((language === 'ar' ? 'تمّت العملية بنجاح' : 'Success'));
      await fetchLaundries();
      await openPayments({ _id: id });
    } catch (e) {
      toast.error(e?.response?.data?.error || (language === 'ar' ? 'حدث خطأ' : 'Error'));
      setPaymentsModal((p) => ({ ...p, paying: false }));
    }
  };

  useEffect(() => {
    fetchLaundries();
  }, []);

  const openCreate = () => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    setCreateForm({ name: '', pricePerPiece: '' });
    setCreateOpen(true);
  };

  useEffect(() => {
    const shouldOpen = (searchParams.get('create') || '') === '1';
    if (!shouldOpen) return;
    if (tutorialCreateOpenedRef.current) return;
    if (createOpen) return;
    tutorialCreateOpenedRef.current = true;
    openCreate();
  }, [createOpen, openCreate, searchParams]);

  const closeCreate = () => {
    setCreateOpen(false);
    setCreateForm({ name: '', pricePerPiece: '' });
  };

  const submitCreate = async () => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    const name = String(createForm.name || '').trim();
    const pricePerPiece = Number(createForm.pricePerPiece);
    if (!name) {
      toast.error((language === 'ar' ? 'اسم المغسلة مطلوب' : 'Laundry name is required'));
      return;
    }

    try {
      await api.post('/khayyat/laundry', {
        name,
        pricePerPiece: Number.isFinite(pricePerPiece) && pricePerPiece >= 0 ? pricePerPiece : 0
      });
      toast.success((language === 'ar' ? 'تمّت العملية بنجاح' : 'Success'));
      closeCreate();
      fetchLaundries();
    } catch (e) {
      toast.error(e?.response?.data?.error || (language === 'ar' ? 'حدث خطأ' : 'Error'));
    }
  };

  const openEdit = (l) => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    setEditForm({
      id: l?._id,
      name: l?.name || '',
      pricePerPiece: String(l?.pricePerPiece ?? '')
    });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditForm({ id: null, name: '', pricePerPiece: '' });
  };

  const submitEdit = async () => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    const id = editForm.id;
    if (!id) return;

    const name = String(editForm.name || '').trim();
    const pricePerPiece = Number(editForm.pricePerPiece);

    if (!name) {
      toast.error((language === 'ar' ? 'اسم المغسلة مطلوب' : 'Laundry name is required'));
      return;
    }

    try {
      await api.put(`/khayyat/laundry/${id}`, {
        name,
        pricePerPiece: Number.isFinite(pricePerPiece) && pricePerPiece >= 0 ? pricePerPiece : 0
      });
      toast.success((language === 'ar' ? 'تمّت العملية بنجاح' : 'Success'));
      closeEdit();
      fetchLaundries();
    } catch (e) {
      toast.error(e?.response?.data?.error || (language === 'ar' ? 'حدث خطأ' : 'Error'));
    }
  };

  const openAssign = (l) => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    setAssignForm({ id: l?._id, pieces: '' });
    setAssignOpen(true);
  };

  const closeAssign = () => {
    setAssignOpen(false);
    setAssignForm({ id: null, pieces: '' });
  };

  const submitAssign = async () => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    const id = assignForm.id;
    const pieces = Number(assignForm.pieces);
    if (!id) return;

    if (!Number.isFinite(pieces) || pieces <= 0) {
      toast.error((language === 'ar' ? 'أدخل عدد قطع صحيح' : 'Enter valid pieces'));
      return;
    }

    try {
      await api.post(`/khayyat/laundry/${id}/assign`, { pieces });
      toast.success((language === 'ar' ? 'تمّت العملية بنجاح' : 'Success'));
      closeAssign();
      fetchLaundries();
    } catch (e) {
      toast.error(e?.response?.data?.error || (language === 'ar' ? 'حدث خطأ' : 'Error'));
    }
  };

  const requestDelete = (l) => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    setDeleteModal({ open: true, laundry: l, loading: false });
  };

  const closeDelete = () => {
    setDeleteModal({ open: false, laundry: null, loading: false });
  };

  const confirmDelete = async () => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      closeDelete();
      return;
    }
    const id = deleteModal?.laundry?._id;
    if (!id) {
      closeDelete();
      return;
    }
    setDeleteModal((p) => ({ ...p, loading: true }));
    try {
      await api.delete(`/khayyat/laundry/${id}`);
      toast.success((language === 'ar' ? 'تمّت العملية بنجاح' : 'Success'));
      closeDelete();
      fetchLaundries();
    } catch (e) {
      toast.error((language === 'ar' ? 'حدث خطأ' : 'Error'));
      setDeleteModal((p) => ({ ...p, loading: false }));
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{(language === 'ar' ? 'الغسيل' : 'Laundry')}</h1>
            <div className="text-sm text-gray-500 dark:text-slate-400">{(language === 'ar' ? 'إدارة تسعير الغسيل والقطع المرسلة.' : 'Manage laundry pricing and assigned pieces.')}</div>
          </div>
        </div>
        <Button data-tutorial="laundry-create-button" onClick={openCreate} icon={Plus} className="rounded-2xl px-5 py-3">
          {(language === 'ar' ? 'إضافة مغسلة' : 'Add Laundry')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="text-sm text-gray-500 dark:text-slate-400">{(language === 'ar' ? 'إجمالي المرسَل' : 'Total Assigned')}</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100">{computed.totalAssigned}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-500 dark:text-slate-400">{(language === 'ar' ? 'إجمالي المبلغ' : 'Total Amount')}</div>
          <div className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            {computed.totalAmount.toFixed(2)} <SARIcon className="w-5 h-5" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-500 dark:text-slate-400">{(language === 'ar' ? 'laundry.totalPaid' : 'laundry.totalPaid')}</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            {computed.totalPaid.toFixed(2)} <SARIcon className="w-5 h-5" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-500 dark:text-slate-400">{(language === 'ar' ? 'laundry.pendingAmount' : 'laundry.pendingAmount')}</div>
          <div className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
            {computed.pendingAmount.toFixed(2)} <SARIcon className="w-5 h-5" />
          </div>
        </Card>
      </div>

      <Card>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div className="font-semibold text-gray-900 dark:text-slate-100">{(language === 'ar' ? 'المغاسل' : 'Laundries')}</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          </div>
        ) : laundries.length > 0 ? (
          <Table>
            <Thead>
              <Tr>
                <Th>{(language === 'ar' ? 'الاسم' : 'Name')}</Th>
                <Th>{(language === 'ar' ? 'السعر لكل قطعة' : 'Price / Piece')}</Th>
                <Th>{(language === 'ar' ? 'المرسَل' : 'Assigned')}</Th>
                <Th>{(language === 'ar' ? 'المبلغ' : 'Amount')}</Th>
                <Th>{(language === 'ar' ? 'إجراءات' : 'Actions')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {laundries.map((l) => {
                const price = Number(l.pricePerPiece) || 0;
                const assigned = Number(l.totalAssigned) || 0;
                const amount = price * assigned;
                return (
                  <Tr key={l._id}>
                    <Td className="font-medium">{l.name}</Td>
                    <Td className="text-gray-700 dark:text-slate-200">
                      <span className="inline-flex items-center gap-1">{price.toFixed(2)} <SARIcon className="w-3 h-3" /></span>
                    </Td>
                    <Td className="text-gray-700 dark:text-slate-200">{assigned}</Td>
                    <Td className="font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="inline-flex items-center gap-1">{amount.toFixed(2)} <SARIcon className="w-3 h-3" /></span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => openPayments(l)}
                          className="rounded-xl px-4 py-2"
                          disabled={isDemo}
                          icon={CreditCard}
                        >
                          {(language === 'ar' ? 'laundry.payments' : 'laundry.payments')}
                        </Button>
                        <Button variant="outline" onClick={() => openAssign(l)} className="rounded-xl px-4 py-2">
                          {(language === 'ar' ? 'إضافة' : 'Assign')}
                        </Button>
                        <button
                          type="button"
                          onClick={() => openEdit(l)}
                          disabled={isDemo}
                          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800/50 text-gray-600 dark:text-slate-300"
                          title={(language === 'ar' ? 'تعديل' : 'Edit')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDelete(l)}
                          disabled={isDemo}
                          className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                          title={(language === 'ar' ? 'حذف' : 'Delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        ) : (
          <div className="p-12 text-center text-gray-500 dark:text-slate-400">{(language === 'ar' ? 'لا توجد بيانات' : 'No data available')}</div>
        )}
      </Card>

      <Modal
        isOpen={createOpen}
        onClose={closeCreate}
        title={(language === 'ar' ? 'إضافة مغسلة' : 'Add Laundry')}
        size="lg"
      >
        <div data-tutorial="laundry-create-modal" className="space-y-4">
          <Input
            label={(language === 'ar' ? 'الاسم' : 'Name')}
            value={createForm.name}
            onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
            placeholder={(language === 'ar' ? 'مثال: مغسلة النور' : 'e.g. Al Noor Laundry')}
          />
          <Input
            label={(language === 'ar' ? 'السعر لكل قطعة' : 'Price / Piece')}
            type="number"
            min="0"
            step="0.01"
            value={createForm.pricePerPiece}
            onChange={(e) => setCreateForm((p) => ({ ...p, pricePerPiece: e.target.value }))}
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={submitCreate} className="flex-1 rounded-2xl" disabled={isDemo}>
              {(language === 'ar' ? 'حفظ' : 'Save')}
            </Button>
            <Button variant="secondary" onClick={closeCreate} className="flex-1 rounded-2xl">
              {(language === 'ar' ? 'إلغاء' : 'Cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={editOpen}
        onClose={closeEdit}
        title={(language === 'ar' ? 'تعديل' : 'Edit')}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label={(language === 'ar' ? 'الاسم' : 'Name')}
            value={editForm.name}
            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            label={(language === 'ar' ? 'السعر لكل قطعة' : 'Price / Piece')}
            type="number"
            min="0"
            step="0.01"
            value={editForm.pricePerPiece}
            onChange={(e) => setEditForm((p) => ({ ...p, pricePerPiece: e.target.value }))}
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={submitEdit} className="flex-1 rounded-2xl" disabled={isDemo}>
              {(language === 'ar' ? 'حفظ' : 'Save')}
            </Button>
            <Button variant="secondary" onClick={closeEdit} className="flex-1 rounded-2xl">
              {(language === 'ar' ? 'إلغاء' : 'Cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={assignOpen}
        onClose={closeAssign}
        title={(language === 'ar' ? 'إضافة قطع' : 'Assign Pieces')}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label={(language === 'ar' ? 'عدد القطع' : 'Pieces')}
            type="number"
            min="1"
            step="1"
            value={assignForm.pieces}
            onChange={(e) => setAssignForm((p) => ({ ...p, pieces: e.target.value }))}
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={submitAssign} className="flex-1 rounded-2xl" disabled={isDemo}>
              {(language === 'ar' ? 'حفظ' : 'Save')}
            </Button>
            <Button variant="secondary" onClick={closeAssign} className="flex-1 rounded-2xl">
              {(language === 'ar' ? 'إلغاء' : 'Cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={paymentsModal.open}
        onClose={closePayments}
        title={(language === 'ar' ? 'laundry.payments' : 'laundry.payments')}
        size="lg"
      >
        <div className="space-y-4">
          {paymentsModal.loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 p-4">
                <div className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                  {paymentsModal.laundry?.name || ''}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-3 text-xs text-gray-600 dark:text-slate-300">
                  <div className="rounded-xl bg-white/70 dark:bg-slate-900/30 border border-gray-200 dark:border-slate-700 p-3">
                    <div className="text-gray-500 dark:text-slate-400">{(language === 'ar' ? 'إجمالي المبلغ' : 'Total Amount')}</div>
                    <div className="mt-1 font-semibold inline-flex items-center gap-1">
                      {(Number(paymentsModal.summary?.totalAmount) || 0).toFixed(2)} <SARIcon className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/70 dark:bg-slate-900/30 border border-gray-200 dark:border-slate-700 p-3">
                    <div className="text-gray-500 dark:text-slate-400">{(language === 'ar' ? 'laundry.totalPaid' : 'laundry.totalPaid')}</div>
                    <div className="mt-1 font-semibold inline-flex items-center gap-1">
                      {(Number(paymentsModal.summary?.totalPaid) || 0).toFixed(2)} <SARIcon className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/70 dark:bg-slate-900/30 border border-gray-200 dark:border-slate-700 p-3">
                    <div className="text-gray-500 dark:text-slate-400">{(language === 'ar' ? 'laundry.pendingAmount' : 'laundry.pendingAmount')}</div>
                    <div className="mt-1 font-semibold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                      {(Number(paymentsModal.summary?.pendingAmount) || 0).toFixed(2)} <SARIcon className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 dark:border-slate-700 p-4">
                <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{(language === 'ar' ? 'laundry.addPayment' : 'laundry.addPayment')}</div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    label={(language === 'ar' ? 'المبلغ' : 'Amount')}
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentsModal.amount}
                    onChange={(e) => setPaymentsModal((p) => ({ ...p, amount: e.target.value }))}
                  />
                  <Input
                    label={(language === 'ar' ? 'common.description' : 'common.description')}
                    value={paymentsModal.description}
                    onChange={(e) => setPaymentsModal((p) => ({ ...p, description: e.target.value }))}
                    placeholder={(language === 'ar' ? 'laundry.paymentNote' : 'laundry.paymentNote')}
                  />
                </div>
                <div className="mt-3 flex gap-3">
                  <Button onClick={submitPayment} loading={paymentsModal.paying} className="flex-1 rounded-2xl" disabled={isDemo}>
                    {(language === 'ar' ? 'حفظ' : 'Save')}
                  </Button>
                  <Button variant="secondary" onClick={closePayments} className="flex-1 rounded-2xl" disabled={paymentsModal.paying}>
                    {(language === 'ar' ? 'إغلاق' : 'Close')}
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-slate-900/40 border-b border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-900 dark:text-slate-100">
                  {(language === 'ar' ? 'laundry.paymentHistory' : 'laundry.paymentHistory')}
                </div>
                {paymentsModal.payments?.length ? (
                  <Table>
                    <Thead>
                      <Tr>
                        <Th>{(language === 'ar' ? 'التاريخ' : 'Date')}</Th>
                        <Th>{(language === 'ar' ? 'المبلغ' : 'Amount')}</Th>
                        <Th>{(language === 'ar' ? 'common.description' : 'common.description')}</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {paymentsModal.payments.map((p) => (
                        <Tr key={p._id}>
                          <Td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</Td>
                          <Td className="font-medium text-emerald-600 dark:text-emerald-400">
                            <span className="inline-flex items-center gap-1">{Number(p.amount || 0).toFixed(2)} <SARIcon className="w-3 h-3" /></span>
                          </Td>
                          <Td className="text-gray-600 dark:text-slate-300">{p.description || '-'}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                ) : (
                  <div className="p-8 text-center text-sm text-gray-500 dark:text-slate-400">{(language === 'ar' ? 'لا توجد بيانات' : 'No data available')}</div>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={closeDelete}
        title={(language === 'ar' ? 'حذف' : 'Delete')}
        message={(language === 'ar' ? 'حذف هذه المغسلة؟' : 'Delete this laundry?')}
        subtitle={(language === 'ar' ? 'لا يمكن التراجع عن هذا الإجراء.' : 'This action cannot be undone.')}
        confirmText={(language === 'ar' ? 'حذف' : 'Delete')}
        cancelText={(language === 'ar' ? 'إلغاء' : 'Cancel')}
        confirmVariant="danger"
        loading={deleteModal.loading}
        onConfirm={confirmDelete}
        previewTitle={deleteModal?.laundry?.name || ''}
        previewSubtitle={deleteModal?.laundry ? (
          <span className="inline-flex items-center gap-1">
            {Number(deleteModal.laundry.pricePerPiece || 0).toFixed(2)} <SARIcon className="w-3 h-3" /> / piece
          </span>
        ) : ''}
      />

      <DemoBlockedModal
        isOpen={demoBlockedOpen}
        onClose={() => setDemoBlockedOpen(false)}
        title={(language === 'ar' ? 'وضع العرض' : 'Demo Mode')}
        phone="+966596775485"
      />
    </div>
  );
};

export default Laundry;




