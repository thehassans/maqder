import React, { useState, useEffect } from 'react';
import { Wallet, LogIn, LogOut, CheckCircle } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function PosSessions({ onSessionVerified }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openingBalance, setOpeningBalance] = useState('');
  
  useEffect(() => {
    checkCurrentSession();
  }, []);

  const checkCurrentSession = async () => {
    try {
      const res = await api.get('/pos-sessions/current');
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
      const res = await api.post('/pos-sessions/open', {
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
    <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-emerald-600 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-1">Open Till</h2>
          <p className="text-emerald-100 text-sm">You must open a session before ringing up sales.</p>
        </div>
        
        <form onSubmit={handleOpenSession} className="p-8">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Opening Cash Balance (SAR)</label>
            <input 
              type="number"
              required
              min="0"
              step="0.01"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="w-full text-2xl p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-medium"
              placeholder="0.00"
              autoFocus
            />
          </div>
          
          <button 
            type="submit"
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Start Shift
          </button>
        </form>
      </div>
    </div>
  );
}
