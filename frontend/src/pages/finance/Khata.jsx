import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Users, Plus, CreditCard, Clock, FileText, ChevronRight, RefreshCw, X, Receipt } from 'lucide-react';

export default function Khata() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  
  // Selection
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  
  // Form States
  const [customers, setCustomers] = useState([]);
  const [newAccountId, setNewAccountId] = useState('');
  const [transactionType, setTransactionType] = useState('credit');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionNotes, setTransactionNotes] = useState('');

  // Quick Add Customer States
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accRes, custRes] = await Promise.all([
        api.get('/khata'),
        api.get('/contacts?types=customer')
      ]);
      setAccounts(accRes.data);
      setCustomers(custRes.data?.contacts || []);
    } catch (error) {
      toast.error('Failed to load Khata accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (accountId) => {
    try {
      const res = await api.get(`/khata/${accountId}/transactions`);
      setTransactions(res.data);
    } catch (error) {
      toast.error('Failed to load transactions');
    }
  };

  const handleSelectAccount = (account) => {
    setSelectedAccount(account);
    fetchTransactions(account._id);
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      let customerId = newAccountId;
      
      if (showNewCustomerForm) {
        const custRes = await api.post('/customers', {
          name: newCustomerName,
          phone: newCustomerPhone,
          type: 'individual'
        });
        customerId = custRes.data._id;
      }

      await api.post('/khata', { customerId });
      toast.success('Account created');
      setShowAddModal(false);
      setShowNewCustomerForm(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create account');
    }
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/khata/${selectedAccount._id}/transactions`, {
        type: transactionType,
        amount: Number(transactionAmount),
        notes: transactionNotes
      });
      toast.success('Transaction recorded');
      setShowTransactionModal(false);
      setTransactionAmount('');
      setTransactionNotes('');
      fetchData(); // Refresh balances
      fetchTransactions(selectedAccount._id);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to record transaction');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><RefreshCw className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      
      {/* LEFT PANEL: Accounts List */}
      <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/30">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Khata Ledgers</h2>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {accounts.map(acc => (
            <button
              key={acc._id}
              onClick={() => handleSelectAccount(acc)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${selectedAccount?._id === acc._id ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-300'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-gray-900">{acc.customerId?.name || 'Unknown'}</span>
                <ChevronRight className={`w-4 h-4 ${selectedAccount?._id === acc._id ? 'text-emerald-500' : 'text-gray-400'}`} />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(acc.updatedAt).toLocaleDateString()}</span>
                <span className={`font-bold ${acc.balance > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                  SAR {acc.balance.toFixed(2)}
                </span>
              </div>
            </button>
          ))}
          {accounts.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">
              No active Khata accounts.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Account Details & Ledger */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedAccount ? (
          <>
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedAccount.customerId?.name}</h2>
                <p className="text-gray-500">{selectedAccount.customerId?.phone || 'No phone number'}</p>
              </div>
              
              <div className="flex gap-4 items-center">
                <div className="text-right">
                  <p className="text-sm text-gray-500 font-medium">Outstanding Balance</p>
                  <p className={`text-3xl font-bold ${selectedAccount.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    SAR {selectedAccount.balance.toFixed(2)}
                  </p>
                </div>
                <button 
                  onClick={() => setShowTransactionModal(true)}
                  className="ml-6 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  <Receipt className="w-5 h-5" /> Add Transaction
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" /> Ledger History
              </h3>
              
              <div className="space-y-4">
                {transactions.map(tx => (
                  <div key={tx._id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${tx.type === 'credit' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                        {tx.type === 'credit' ? <Plus className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{tx.type === 'credit' ? 'Purchased on Credit' : 'Payment Received'}</p>
                        <p className="text-sm text-gray-500">{new Date(tx.date).toLocaleString()} {tx.notes && `- ${tx.notes}`}</p>
                      </div>
                    </div>
                    <div className={`font-bold text-lg ${tx.type === 'credit' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {tx.type === 'credit' ? '+' : '-'} SAR {tx.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div className="text-center py-10 text-gray-400">No transactions recorded yet.</div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-300">
            <Users className="w-24 h-24 mb-6 opacity-20" />
            <h2 className="text-2xl font-light tracking-tight text-gray-400">Select an account to view ledger</h2>
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">New Khata Account</h2>
              <button onClick={() => {
                setShowAddModal(false);
                setShowNewCustomerForm(false);
              }} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6"/></button>
            </div>
            <form onSubmit={handleCreateAccount} className="p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Select Customer</label>
                  {!showNewCustomerForm && (
                    <button type="button" onClick={() => setShowNewCustomerForm(true)} className="text-emerald-600 text-sm font-bold flex items-center gap-1 hover:text-emerald-700">
                      <Plus className="w-4 h-4"/> New Customer
                    </button>
                  )}
                </div>
                {!showNewCustomerForm ? (
                  <select 
                    required
                    value={newAccountId}
                    onChange={(e) => setNewAccountId(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map(c => <option key={c.entityId || c._id} value={c.entityId || c._id}>{c.displayName || c.name}</option>)}
                  </select>
                ) : (
                  <div className="space-y-3">
                    <input type="text" required value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} placeholder="Customer Name *" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"/>
                    <input type="text" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} placeholder="Phone Number (Optional)" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"/>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setShowNewCustomerForm(false)} className="flex-1 p-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
              <button type="submit" className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors">Create Ledger</button>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">Add Transaction</h2>
              <button onClick={() => setShowTransactionModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6"/></button>
            </div>
            <form onSubmit={handleCreateTransaction} className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button type="button" onClick={() => setTransactionType('credit')} className={`p-4 rounded-xl font-bold border-2 transition-all ${transactionType === 'credit' ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                  Give Credit
                </button>
                <button type="button" onClick={() => setTransactionType('payment')} className={`p-4 rounded-xl font-bold border-2 transition-all ${transactionType === 'payment' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                  Receive Payment
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (SAR)</label>
                <input type="number" required min="0.01" step="0.01" value={transactionAmount} onChange={(e) => setTransactionAmount(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl text-lg font-bold focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="0.00"/>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
                <input type="text" value={transactionNotes} onChange={(e) => setTransactionNotes(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. Weekly groceries"/>
              </div>
              <button type="submit" className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors">Record Transaction</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
