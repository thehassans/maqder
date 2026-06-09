import React, { useState, useEffect } from 'react';
import { Search, RefreshCcw, ArrowLeft, Receipt, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export default function BakalaReturns() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchRecentInvoices = async () => {
      try {
        const res = await api.get('/invoices', { params: { businessContext: 'bakala', limit: 10 } });
        setRecentInvoices(res.data.invoices || []);
      } catch (err) {
        console.error('Failed to fetch recent invoices', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecentInvoices();
  }, []);
  
  const handleSearch = (e) => {
    e.preventDefault();
    // Dummy logic for now
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#F8F9FA] text-gray-900 overflow-hidden font-sans">
      <div className="w-[60%] flex flex-col border-r border-gray-100 bg-white z-10 relative">
        <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/app/dashboard/bakala/pos')}
              className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-rose-600 flex items-center gap-2">
              <RefreshCcw className="w-6 h-6" />
              Returns & Refunds
            </h1>
          </div>
        </div>

        <div className="flex-1 px-6 py-4 flex flex-col items-center justify-center text-gray-400">
          <Receipt className="w-20 h-20 mb-4 opacity-20" />
          <p className="text-xl mb-2">Scan Receipt Barcode to Refund</p>
          <p className="text-sm">Or enter the invoice number on the right.</p>
        </div>
      </div>

      <div className="w-[40%] flex flex-col bg-[#F8F9FA]">
        <div className="px-6 pt-6 pb-2">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search Invoice Number (e.g. BAKALA-123)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none text-base font-medium transition-all"
              autoFocus
            />
          </form>
        </div>

        <div className="flex-1 px-6 pb-6 pt-2 overflow-y-auto">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            Recent Invoices
          </h3>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl w-full"></div>)}
            </div>
          ) : recentInvoices.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-sm">No recent invoices found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentInvoices.map(invoice => (
                <div key={invoice._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow hover:border-rose-200 transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-gray-800">{invoice.invoiceNumber}</span>
                    <span className="font-bold text-rose-600">SAR {invoice.grandTotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{new Date(invoice.issueDate).toLocaleString()}</span>
                    <span>{invoice.paymentMethod?.toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
