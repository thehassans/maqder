import React, { useState } from 'react';
import { Search, FileText, Send, ShieldAlert, ShieldCheck, AlertCircle, Scale, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BakalaDashboard() {
  const [phoneNumber, setPhoneNumber] = useState('');

  // Dummy state to mock the API response for Daftar
  const daftarAccount = {
    customerName: 'Ahmad Al-Ghamdi',
    phoneNumber: '0551234567',
    creditLimit: 500,
    currentBalance: 320,
    transactions: [
      { date: '2026-06-01', type: 'CHARGE', amount: 45.5, balanceAfter: 320 },
      { date: '2026-05-28', type: 'PAYMENT', amount: 100, balanceAfter: 274.5 },
      { date: '2026-05-25', type: 'CHARGE', amount: 120, balanceAfter: 374.5 },
    ]
  };

  // Dummy state for Balady Compliance
  const complianceData = {
    cr: { status: 'VALID', expiry: '2027-01-15' },
    baladyLicense: { status: 'EXPIRING_SOON', expiry: '2026-06-25' }, // < 30 days
    civilDefense: { status: 'VALID', expiry: '2026-11-10' },
    workers: [
      { name: 'Mohammed Ali', certNo: 'WHC-1029', status: 'VALID', expiry: '2026-10-01' },
      { name: 'Saeed Khan', certNo: 'WHC-1030', status: 'EXPIRED', expiry: '2026-05-15' },
    ]
  };

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
        <Link 
          to="/app/dashboard/bakala/weight-scale" 
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all hover:-translate-y-0.5"
        >
          <Scale className="w-5 h-5" />
          Weight Scale Station
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
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

          <div className="border border-gray-200 dark:border-dark-600 rounded-xl p-5 bg-gray-50 dark:bg-dark-800">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{daftarAccount.customerName}</h3>
                <p className="text-sm text-gray-500">{daftarAccount.phoneNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Current Balance</p>
                <p className="text-2xl font-bold text-rose-500">SAR {daftarAccount.currentBalance.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">Limit: SAR {daftarAccount.creditLimit.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex gap-3 mb-6">
              <button className="flex-1 btn btn-secondary flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" /> PDF Statement
              </button>
              <button className="flex-1 btn btn-primary flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 border-none text-white">
                <Send className="w-4 h-4" /> WhatsApp Link
              </button>
            </div>

            <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Recent Transactions</h4>
            <div className="space-y-2">
              {daftarAccount.transactions.map((tx, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm p-2 bg-white dark:bg-dark-900 rounded-lg border border-gray-100 dark:border-dark-700">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-white">{tx.type}</span>
                    <span className="text-xs text-gray-500">{tx.date}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-semibold ${tx.type === 'PAYMENT' ? 'text-emerald-500' : 'text-gray-900 dark:text-white'}`}>
                      {tx.type === 'PAYMENT' ? '+' : '-'} SAR {tx.amount.toFixed(2)}
                    </span>
                    <p className="text-xs text-gray-500">Bal: {tx.balanceAfter}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Balady Regulatory Health */}
        <div className="card p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Balady Compliance</h2>
            <div className="badge badge-success text-xs">Live Monitoring</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border flex flex-col gap-2 ${getStatusColor(complianceData.cr.status)}`}>
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold">Commercial Reg (CR)</span>
                {getStatusIcon(complianceData.cr.status)}
              </div>
              <span className="text-xs font-medium">Exp: {complianceData.cr.expiry}</span>
            </div>
            
            <div className={`p-4 rounded-xl border flex flex-col gap-2 ${getStatusColor(complianceData.baladyLicense.status)}`}>
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold">Balady License</span>
                {getStatusIcon(complianceData.baladyLicense.status)}
              </div>
              <span className="text-xs font-medium">Exp: {complianceData.baladyLicense.expiry}</span>
            </div>

            <div className={`p-4 rounded-xl border flex flex-col gap-2 col-span-2 ${getStatusColor(complianceData.civilDefense.status)}`}>
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold">Civil Defense Permit</span>
                {getStatusIcon(complianceData.civilDefense.status)}
              </div>
              <span className="text-xs font-medium">Exp: {complianceData.civilDefense.expiry}</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-gray-400" />
              Worker Health Certificates (Balady)
            </h3>
            <div className="space-y-2">
              {complianceData.workers.map((worker, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-600">
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{worker.name}</p>
                    <p className="text-xs text-gray-500">{worker.certNo}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(worker.status)}`}>
                    {worker.status === 'VALID' ? worker.expiry : worker.status.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
