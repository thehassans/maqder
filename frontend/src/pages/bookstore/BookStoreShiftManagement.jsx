import React, { useState, useEffect } from 'react';
import { Wallet, LogOut, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function BookStoreShiftManagement() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dropAmount, setDropAmount] = useState('');
  const [dropReason, setDropReason] = useState('');
  const [showZReport, setShowZReport] = useState(false);
  const [actualCash, setActualCash] = useState('');

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await api.get('/bookstore/shift/current');
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
      await api.post('/bookstore/shift/drop', { amount: Number(dropAmount), reason: dropReason });
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
      await api.post('/bookstore/shift/close', { actualClosingBalance: Number(actualCash) });
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
        <div className="flex items-center gap-3">
          <Link to="/app/dashboard/bookstore/dashboard" className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shift Management</h1>
            <p className="text-gray-500 mt-1">Manage cash drawer, drops, and Z-Reports.</p>
          </div>
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
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500">Opening Balance</span>
                <span className="font-bold">SAR {Number(session.openingBalance || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500">Opened At</span>
                <span className="font-bold">{new Date(session.openedAt).toLocaleString()}</span>
              </div>
              {session.cashDrops && session.cashDrops.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-gray-500 mb-2">Cash Drops</p>
                  {session.cashDrops.map((drop, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-1">
                      <span>{drop.reason}</span>
                      <span className="font-bold text-red-500">-SAR {Number(drop.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cash Drop & Close */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Cash Drop</h3>
              <form onSubmit={handleCashDrop} className="space-y-4">
                <div>
                  <label className="label">Amount (SAR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={dropAmount}
                    onChange={(e) => setDropAmount(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Reason</label>
                  <input
                    type="text"
                    value={dropReason}
                    onChange={(e) => setDropReason(e.target.value)}
                    className="input"
                    placeholder="Cash safe deposit, etc."
                    required
                  />
                </div>
                <button type="submit" className="w-full py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-colors">
                  Record Cash Drop
                </button>
              </form>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">End of Day / Z-Report</h3>
              {!showZReport ? (
                <button
                  onClick={() => setShowZReport(true)}
                  className="w-full py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  Close Shift & Generate Z-Report
                </button>
              ) : (
                <form onSubmit={handleCloseShift} className="space-y-4">
                  <div>
                    <label className="label">Actual Cash in Till (SAR)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={actualCash}
                      onChange={(e) => setActualCash(e.target.value)}
                      className="input"
                      required
                      autoFocus
                    />
                  </div>
                  <button type="submit" className="w-full py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-colors">
                    Confirm Close Shift
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
