import React, { useState, useEffect } from 'react';
import { Search, FileText, Send, ShieldAlert, ShieldCheck, AlertCircle, Scale, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../lib/api';

export default function BakalaDashboard() {
  const { tenant } = useSelector((state) => state.auth);
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [khataAccounts, setKhataAccounts] = useState([]);
  const [selectedKhata, setSelectedKhata] = useState(null);
  const [khataTransactions, setKhataTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [khataRes, alertsRes] = await Promise.all([
          api.get('/khata').catch(() => ({ data: [] })),
          api.get('/employees/compliance/alerts').catch(() => ({ data: [] }))
        ]);
        setKhataAccounts(khataRes.data || []);
        setAlerts(alertsRes.data || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (khataAccounts.length > 0) {
      const matched = phoneNumber 
        ? khataAccounts.find(acc => acc.customerId?.phone?.includes(phoneNumber) || acc.customerId?.mobile?.includes(phoneNumber))
        : khataAccounts[0];
      
      setSelectedKhata(matched || null);
    } else {
      setSelectedKhata(null);
    }
  }, [phoneNumber, khataAccounts]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (selectedKhata) {
        try {
          const res = await api.get(`/khata/${selectedKhata._id}/transactions`);
          setKhataTransactions(res.data || []);
        } catch (error) {
          console.error(error);
        }
      } else {
        setKhataTransactions([]);
      }
    };
    fetchTransactions();
  }, [selectedKhata]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'VALID': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
      case 'EXPIRING_SOON': return 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
      case 'EXPIRED': return 'text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20';
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-500/10';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'VALID': return <ShieldCheck className="w-5 h-5" />;
      case 'EXPIRING_SOON': return <AlertCircle className="w-5 h-5" />;
      case 'EXPIRED': return <ShieldAlert className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bakala Administration</h1>
        {tenant?.subscription?.hasWeightScaleAddon && (
          <Link 
            to="/app/dashboard/bakala/weight-scale" 
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all hover:-translate-y-0.5"
          >
            <Scale className="w-5 h-5" />
            Weight Scale Station
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT: Daftar Ledger */}
        <div className="card p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Daftar Ledger</h2>
          </div>

          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Search customer by phone number (e.g. 05...)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
          ) : !selectedKhata ? (
            <div className="text-center py-10 text-gray-500">No Khata account found</div>
          ) : (
            <div className="border border-gray-200 dark:border-dark-600 rounded-xl p-5 bg-gray-50 dark:bg-dark-800">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{selectedKhata.customerId?.name}</h3>
                  <p className="text-sm text-gray-500">{selectedKhata.customerId?.phone || selectedKhata.customerId?.mobile || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Current Balance</p>
                  <p className={`text-2xl font-bold ${selectedKhata.balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    SAR {Math.abs(selectedKhata.balance || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Limit: SAR {(selectedKhata.creditLimit || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="flex gap-3 mb-6">
                <button className="flex-1 btn btn-secondary flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" /> PDF Statement
                </button>
                <button className="flex-1 btn btn-primary flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 border-none text-white"
                  onClick={() => {
                    const phone = selectedKhata.customerId?.phone || selectedKhata.customerId?.mobile;
                    if (phone) window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
                  }}>
                  <Send className="w-4 h-4" /> WhatsApp Link
                </button>
              </div>

              <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Recent Transactions</h4>
              <div className="space-y-2">
                {khataTransactions.length === 0 ? (
                  <p className="text-sm text-gray-500">No recent transactions</p>
                ) : (
                  khataTransactions.slice(0, 5).map((tx, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm p-2 bg-white dark:bg-dark-900 rounded-lg border border-gray-100 dark:border-dark-700">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-white text-xs uppercase">{tx.type}</span>
                        <span className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()}</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-semibold ${tx.type === 'payment' ? 'text-emerald-500' : 'text-gray-900 dark:text-white'}`}>
                          {tx.type === 'payment' ? '+' : '-'} SAR {tx.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Balady Regulatory Health */}
        <div className="card p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Balady Compliance</h2>
            <div className="badge badge-success text-xs">Live Monitoring</div>
          </div>

          <div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-gray-400" />
              Compliance Alerts (Expiring Soon)
            </h3>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
            ) : alerts.length === 0 ? (
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6" />
                <div>
                  <p className="font-bold">All Good!</p>
                  <p className="text-sm">No documents are expiring within 60 days.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 5).map((alert, idx) => (
                  <div key={idx} className={`flex justify-between items-center p-3 rounded-lg border ${alert.isExpired ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div>
                      <p className={`font-bold text-sm ${alert.isExpired ? 'text-rose-700' : 'text-amber-700'}`}>{alert.documentType}</p>
                      <p className="text-xs text-gray-600">{alert.name} {alert.documentNumber ? `(${alert.documentNumber})` : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold ${alert.isExpired ? 'text-rose-600' : 'text-amber-600'}`}>
                        {alert.isExpired ? 'EXPIRED' : `${alert.daysRemaining} days left`}
                      </p>
                      <p className="text-[10px] text-gray-500">{new Date(alert.expiryDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
