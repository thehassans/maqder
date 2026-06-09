import React, { useState, useEffect } from 'react';
import { Wallet, LogIn, LogOut, CheckCircle, ArrowRight } from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function PosSessions({ onSessionVerified }) {
  const { tenant } = useSelector(state => state.auth);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openingBalance, setOpeningBalance] = useState('');
  
  useEffect(() => {
    checkCurrentSession();
  }, []);

  const checkCurrentSession = async () => {
    try {
      const res = await api.get('/bakala/shift/current');
      if (res.data.session) {
        setSession(res.data.session);
        if (onSessionVerified) onSessionVerified(res.data.session);
      }
    } catch (err) {
      console.error('Failed to check session', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSession = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/bakala/shift/open', {
        openingBalance: Number(openingBalance)
      });
      setSession(res.data);
      toast.success('Till opened successfully');
      if (onSessionVerified) onSessionVerified(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to open session');
    }
  };

  if (loading) return null;

  if (session) {
    return null; // Don't render anything if session is active and we are inside POS
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-gray-100">
        <div className="p-8 pb-6 flex flex-col items-center border-b border-gray-50">
          {tenant?.branding?.logoUrl ? (
            <img src={tenant.branding.logoUrl} alt={tenant.business.name} className="h-16 mb-6 object-contain" />
          ) : (
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
              <Wallet className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Open Till</h2>
          <p className="text-gray-500 text-sm text-center">Start a new shift to begin processing sales.</p>
        </div>
        
        <form onSubmit={handleOpenSession} className="p-8 pt-6 bg-gray-50/50">
          <div className="mb-8">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">Opening Cash Balance</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">SAR</span>
              <input 
                type="number"
                required
                min="0"
                step="0.01"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="w-full text-3xl pl-14 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none font-bold text-gray-900 shadow-sm transition-all"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>
          
          <button 
            type="submit"
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-gray-900/20"
          >
            Start Shift
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
