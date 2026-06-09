import React, { useState } from 'react';
import { Search, RefreshCcw, ArrowLeft, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BakalaReturns() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Note: Full refund API integration is planned for the next iteration.
  // This UI serves as the front-end for scanning and validating a return.
  
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

        <div className="flex-1 px-6 pb-6 pt-2 overflow-y-auto flex flex-col items-center justify-center">
          <p className="text-gray-400 text-sm">Enter invoice to see lines</p>
        </div>
      </div>
    </div>
  );
}
