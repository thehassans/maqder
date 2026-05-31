import React, { useState, useEffect } from 'react';

import { useSelector } from 'react-redux';
import api from '../../lib/api';
const t = (key, opts) => opts?.defaultValue || key;

import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Modal } from './components/ui/Modal';
import { Input } from './components/ui/Input';
import { Table, Thead, Tbody, Tr, Th, Td } from './components/ui/Table';
import { Send } from 'lucide-react';
import SARIcon from './components/ui/SARIcon';
import toast from 'react-hot-toast';

const WorkerAmounts = () => {
  
  const { user } = useSelector(state => state.auth);
  const { language } = useSelector(state => state.ui);
  const langKey = (language || 'en').split('-')[0];
  const [workers, setWorkers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, paymentsRes] = await Promise.all([
        api.get('/khayyat/payments/summary'),
        api.get('/khayyat/payments')
      ]);
      const summaryData = summaryRes.data;
      const paymentsData = paymentsRes.data;
      setWorkers(Array.isArray(summaryData) ? summaryData : summaryData.workers || []);
      setPayments(Array.isArray(paymentsData) ? paymentsData : paymentsData.payments || []);
    } catch (error) {
      console.error('Error:', error);
      setWorkers([]);
      setPayments([]);
    }
    setLoading(false);
  };

  const handleSendPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Enter valid amount');
      return;
    }
    setSending(true);
    try {
      await api.post('/khayyat/payments', {
        workerId: selectedWorker._id,
        amount: parseFloat(amount),
        description
      });
      toast.success('Payment sent');
      setModalOpen(false);
      setAmount('');
      setDescription('');
      fetchData();
    } catch (error) {
      toast.error('Failed to send payment');
    }
    setSending(false);
  };

  return (
    <div data-tutorial="page-worker-amounts" className="space-y-6 animate-fadeIn">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{(language === 'ar' ? 'حسابات العمال' : 'Worker Amounts')}</h1>

      {/* Worker Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workers.map((worker) => (
          <Card key={worker._id} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                    <span className="text-emerald-700 dark:text-emerald-200 font-medium">{(worker.nameI18n?.[langKey] || worker.name || '')?.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-slate-100">{worker.nameI18n?.[langKey] || worker.name}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{worker.phone}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-slate-400">{(language === 'ar' ? 'إجمالي الأرباح' : 'Total Earnings')}:</span>
                    <span className="font-medium flex items-center gap-1">{worker.totalEarnings || 0} <SARIcon className="w-3 h-3" /></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-slate-400">{(language === 'ar' ? 'إجمالي المدفوع' : 'Total Paid')}:</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">{worker.totalPaid || 0} <SARIcon className="w-3 h-3" /></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-slate-400">{(language === 'ar' ? 'المبلغ المعلق' : 'Pending Amount')}:</span>
                    <span className="font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">{worker.pendingAmount || 0} <SARIcon className="w-3 h-3" /></span>
                  </div>
                </div>
              </div>
            </div>
            <Button
              onClick={() => { setSelectedWorker(worker); setModalOpen(true); }}
              variant="outline"
              className="w-full mt-4"
              icon={Send}
            >
              {(language === 'ar' ? 'إرسال دفعة' : 'Send Payment')}
            </Button>
          </Card>
        ))}
      </div>

      {/* Payment History */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className="font-semibold text-gray-900 dark:text-slate-100">{(language === 'ar' ? 'سجل المدفوعات' : 'Payment History')}</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        ) : payments.length > 0 ? (
          <Table>
            <Thead>
              <Tr>
                <Th>{(language === 'ar' ? 'الاسم' : 'Name')}</Th>
                <Th>{(language === 'ar' ? 'المبلغ' : 'Amount')}</Th>
                <Th>Description</Th>
                <Th>{(language === 'ar' ? 'التاريخ' : 'Date')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {payments.map((payment) => (
                <Tr key={payment._id}>
                  <Td>{payment.workerId?.nameI18n?.[langKey] || payment.workerId?.name}</Td>
                  <Td className="font-medium text-emerald-600 flex items-center gap-1">{payment.amount} <SARIcon className="w-3 h-3" /></Td>
                  <Td className="text-gray-500 dark:text-slate-400">{payment.description || '-'}</Td>
                  <Td>{new Date(payment.createdAt).toLocaleDateString()}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <div className="p-12 text-center text-gray-500 dark:text-slate-400">{(language === 'ar' ? 'لا توجد بيانات' : 'No data available')}</div>
        )}
      </Card>

      {/* Payment Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={(language === 'ar' ? 'إرسال دفعة' : 'Send Payment')}>
        <div className="space-y-4">
          {selectedWorker && (
            <div className="bg-gray-50 dark:bg-slate-800/40 rounded-lg p-4">
              <p className="font-medium text-gray-900 dark:text-slate-100">{selectedWorker.nameI18n?.[langKey] || selectedWorker.name}</p>
              <p className="text-sm text-amber-600 dark:text-amber-300">
                {(language === 'ar' ? 'المبلغ المعلق' : 'Pending Amount')}: {selectedWorker.pendingAmount || 0}
              </p>
            </div>
          )}
          <Input
            label={(language === 'ar' ? 'المبلغ' : 'Amount')}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
          />
          <Input
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSendPayment} loading={sending} className="flex-1">
              {(language === 'ar' ? 'إرسال دفعة' : 'Send Payment')}
            </Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              {(language === 'ar' ? 'إلغاء' : 'Cancel')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkerAmounts;




