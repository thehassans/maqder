import React, { useState, useEffect } from 'react';
import { Wallet, LogOut, Download, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function BakalaShiftManagement() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dropAmount, setDropAmount] = useState('');
  const [dropReason, setDropReason] = useState('');
  
  // Z-Report Closure
  const [showZReport, setShowZReport] = useState(false);
  const [actualCash, setActualCash] = useState('');

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await api.get('/bakala/shift/current');
      setSession(res.data.session);
    } catch (err) {
      toast.error('Failed to load shift data');
    } finally {
      setLoading(false);
    }
  };

  const handleCashDrop = async (e) => {
    e.preventDefault();
    if (!dropAmount || !dropReason) return;
    try {
      await api.post('/bakala/shift/drop', {
        amount: Number(dropAmount),
        reason: dropReason
      });
      toast.success('Cash drop recorded successfully');
      setDropAmount('');
      setDropReason('');
      fetchSession();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record drop');
    }
  };

  const handleCloseShift = async (e) => {
    e.preventDefault();
    if (!actualCash) return;
    
    try {
      // In a real app we'd fetch actual sales totals from backend
      // Here we pass 0 for sales since backend should calculate it ideally, 
      // but for this demo the Z-Report closure is what matters.
      await api.post('/bakala/shift/close', {
        actualClosingBalance: Number(actualCash),
        totalSales: 0, // Mock for now
        totalCash: 0,
        totalCard: 0
      });
      toast.success('Z-Report generated and Shift closed.');
      setShowZReport(false);
      setSession(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to close shift');
    }
  };

  if (loading) return <div className="p-8">Loading shift data...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shift Management</h1>
          <p className="text-gray-500 mt-1">Manage cash drawer, drops, and Z-Reports.</p>
        </div>
      </div>

      {!session ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center text-amber-700">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
          <h2 className="text-xl font-bold mb-2">No Active Shift</h2>
          <p>You must open a shift from the POS screen before managing it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Active Shift Details */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl">
                <Wallet className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Current Shift Status</h2>
                <p className="text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Open
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-500 font-medium">Opening Time</span>
                <span className="font-bold text-gray-800">{new Date(session.openedAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-500 font-medium">Opening Float (Cash)</span>
                <span className="font-bold text-gray-800">SAR {session.openingBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-500 font-medium">Cash Drops count</span>
                <span className="font-bold text-rose-600">{session.cashDrops?.length || 0}</span>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100">
              <button 
                onClick={() => setShowZReport(true)}
                className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-6 h-6" />
                Close Till (Generate Z-Report)
              </button>
            </div>
          </div>

          {/* Cash Drops */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Download className="w-6 h-6 text-indigo-500" />
              Record Cash Drop (Petty Cash)
            </h2>
            
            <form onSubmit={handleCashDrop} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Amount Taken Out (SAR)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required
                  value={dropAmount}
                  onChange={e => setDropAmount(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" 
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Reason (e.g. Paid Supplier)</label>
                <input 
                  type="text" 
                  required
                  value={dropReason}
                  onChange={e => setDropReason(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="Supplier XYZ Payment"
                />
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors">
                Record Drop
              </button>
            </form>

            {/* List of drops */}
            {session.cashDrops?.length > 0 && (
              <div className="mt-8">
                <h3 className="font-bold text-gray-700 mb-3">Today's Drops</h3>
                <div className="space-y-2">
                  {session.cashDrops.map((drop, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-rose-50 rounded-lg border border-rose-100">
                      <div>
                        <p className="font-bold text-gray-800">{drop.reason}</p>
                        <p className="text-xs text-gray-500">{new Date(drop.time).toLocaleTimeString()}</p>
                      </div>
                      <span className="font-bold text-rose-600">- SAR {drop.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Z-Report Modal */}
      {showZReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8">
            <h2 className="text-2xl font-bold mb-2">Z-Report Closure</h2>
            <p className="text-gray-500 mb-6">Enter the exact physical cash counted in your till right now. Blind count ensures accuracy.</p>
            
            <form onSubmit={handleCloseShift}>
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Physical Cash Count (SAR)</label>
                <input 
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={actualCash}
                  onChange={e => setActualCash(e.target.value)}
                  className="w-full text-2xl p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-bold text-center"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowZReport(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-4 bg-rose-600 text-white hover:bg-rose-700 rounded-xl font-bold transition-colors"
                >
                  Print Z-Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
