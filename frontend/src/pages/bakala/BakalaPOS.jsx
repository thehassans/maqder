import React, { useEffect, useRef, useState } from 'react';
import { useCartEngine } from '../../hooks/useCartEngine';
import { useBakalaSync } from '../../hooks/useBakalaSync';
import { getProductByBarcode, saveOfflineInvoice } from '../../lib/bakalaDb';
import { ShoppingCart, CreditCard, Wallet, Send, RefreshCw, Server, WifiOff, ArrowLeft, Search, Plus, Minus, Trash2, LogOut } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PosSessions from './PosSessions';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function BakalaPOS() {
  const navigate = useNavigate();
  const { tenant } = useSelector(state => state.auth);
  const scalePrefix = (tenant?.settings?.hardwareSettings?.scaleBarcodePrefix || '21').substring(0, 2).padEnd(2, '0');
  
  const { cartItems, addItem, updateQuantity, removeItem, clearCart, totals } = useCartEngine();
  const { isOnline, pendingCount, syncOfflineData } = useBakalaSync();
  const barcodeInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [fastItems, setFastItems] = useState([]);
  const [activeSession, setActiveSession] = useState(null);

  // Focus search input automatically if typing letters/numbers outside of an input
  useEffect(() => {
    const handleGlobalKeydown = (e) => {
      // If pressing a printable character and not currently focused on an input
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          barcodeInputRef.current?.focus();
        }
      }
    };
    
    document.addEventListener('keydown', handleGlobalKeydown);
    return () => document.removeEventListener('keydown', handleGlobalKeydown);
  }, []);

  // Load products from IndexedDB
  useEffect(() => {
    const loadProducts = async () => {
      await syncOfflineData();
      const { getAllProducts } = await import('../../lib/bakalaDb');
      const products = await getAllProducts();
      setAllProducts(products);
      setFastItems(products.slice(0, 24)); // Load first 24 as default
    };
    loadProducts();
  }, [syncOfflineData]);

  // Handle Search Filtering
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFastItems(allProducts.slice(0, 24));
      return;
    }
    const lower = searchTerm.toLowerCase();
    const filtered = allProducts.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      p.primaryBarcode?.includes(lower) ||
      p.barcodes?.some(b => b.includes(lower))
    );
    setFastItems(filtered.slice(0, 24));
  }, [searchTerm, allProducts]);

  // Handle Barcode Scans via Enter key in search
  const handleScannerSubmit = async (e) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;

    // 1. Check for Scale Barcode (EAN-13 starting with scalePrefix)
    if (term.length === 13 && term.startsWith(scalePrefix)) {
      const itemCode = term.substring(2, 7);
      const priceHalalas = parseInt(term.substring(7, 12), 10);
      const priceSAR = priceHalalas / 100;

      // Find product by itemCode (assuming itemCode is the first 5 digits of primaryBarcode)
      const scaleMatch = allProducts.find(p => 
        (p.primaryBarcode && p.primaryBarcode.startsWith(itemCode)) || 
        (p.primaryBarcode && p.primaryBarcode.endsWith(itemCode)) ||
        p.primaryBarcode === itemCode
      );

      if (scaleMatch) {
        const isWeightBased = scaleMatch.unit === 'KG' || !scaleMatch.unit;
        const scaledItem = {
          ...scaleMatch,
          retailPrice: priceSAR,
          name: `${scaleMatch.name} (${isWeightBased ? 'Weighed' : 'Counted'})`
        };
        addItem(scaledItem);
        setSearchTerm('');
        return;
      }
    }
    
    // 2. Check for Exact Match
    const exactMatch = allProducts.find(p => p.primaryBarcode === term || p.barcodes?.includes(term));
    
    if (exactMatch) {
      addItem(exactMatch);
      setSearchTerm('');
    } else {
      // If no exact match but there's only 1 item in the filtered list, add that one
      if (fastItems.length === 1) {
        addItem(fastItems[0]);
        setSearchTerm('');
      } else {
        // Fallback for manual test item
        addItem({
          _id: uuidv4(),
          name: `Item ${term}`,
          primaryBarcode: term,
          retailPrice: 15.0,
          taxRate: 15
        });
        setSearchTerm('');
      }
    }
  };

  // Checkout handling
  const handleCheckout = async (paymentMethod) => {
    if (cartItems.length === 0) return;
    
    const invoice = {
      offlineId: uuidv4(),
      lineItems: cartItems.map((item, index) => ({
        lineNumber: index + 1,
        productId: item.productId,
        productName: item.productName,
        productNameAr: item.productNameAr,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        taxAmount: (item.lineTotal * item.taxRate) / (100 + item.taxRate),
        lineTotal: item.lineTotal - ((item.lineTotal * item.taxRate) / (100 + item.taxRate)),
        lineTotalWithTax: item.lineTotal,
        taxCategory: 'S'
      })),
      subtotal: totals.subtotal,
      totalTax: totals.taxAmount,
      grandTotal: totals.grandTotal,
      paymentMethod,
      issueDate: new Date().toISOString()
    };

    await saveOfflineInvoice(invoice);
    clearCart();
    
    // Simulate printing receipt here
  };

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch(e.key) {
        case 'F1': e.preventDefault(); handleCheckout('cash'); break;
        case 'F2': e.preventDefault(); handleCheckout('card'); break;
        case 'F3': e.preventDefault(); handleCheckout('card'); break;
        case 'F4': e.preventDefault(); /* Open Daftar Modal */ break;
        case 'Escape': e.preventDefault(); clearCart(); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, totals]);

  const handleCloseSession = async () => {
    if (!activeSession) return;
    const actualClosing = window.prompt("Enter actual cash in till for End of Day:");
    if (actualClosing === null) return;

    try {
      await api.post(`/pos-sessions/${activeSession._id}/close`, {
        actualClosingBalance: Number(actualClosing)
      });
      toast.success("Till closed successfully");
      setActiveSession(null);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to close till");
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#F8F9FA] text-gray-900 overflow-hidden font-sans">
      
      {!activeSession && <PosSessions onSessionVerified={setActiveSession} />}

      {/* LEFT PANEL: Cart View (60%) */}
      <div className="w-[60%] flex flex-col border-r border-gray-100 bg-white shadow-[2px_0_10px_rgba(0,0,0,0.02)] z-10 relative">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/app/dashboard/bakala/dashboard')}
              className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-gray-800">Current Order</h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-500"><Server className="w-4 h-4"/> Online</span>
            ) : (
              <span className="flex items-center gap-1 text-rose-500"><WifiOff className="w-4 h-4"/> Offline Sync Mode</span>
            )}
            {pendingCount > 0 && <span className="text-amber-500">{pendingCount} Pending</span>}
            
            {activeSession && (
              <button 
                onClick={handleCloseSession}
                className="ml-4 flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg font-bold transition-colors"
              >
                <LogOut className="w-4 h-4" /> End of Day
              </button>
            )}
          </div>
        </div>

        {/* Cart Table */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300">
              <ShoppingCart className="w-20 h-20 mb-6 opacity-20" strokeWidth={1} />
              <p className="text-xl tracking-tight text-gray-400 font-light">Scan a product to begin</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item, index) => (
                <div key={index} className="flex items-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-semibold text-gray-800 truncate text-lg">{item.productName}</p>
                    <p className="text-sm text-gray-400 font-medium">{item.primaryBarcode}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 mr-6 bg-gray-50 rounded-xl p-1">
                    <button onClick={() => updateQuantity(index, item.quantity - 1)} className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-100 rounded-lg text-gray-600 shadow-sm transition-colors">
                      {item.quantity === 1 ? <Trash2 className="w-4 h-4 text-rose-400" /> : <Minus className="w-4 h-4" />}
                    </button>
                    <span className="w-8 text-center font-bold text-lg">{item.quantity}</span>
                    <button onClick={() => updateQuantity(index, item.quantity + 1)} className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-100 rounded-lg text-gray-600 shadow-sm transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-right w-24">
                    <p className="font-bold text-gray-900 text-lg">{(item.lineTotal || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">SAR</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Actions & Fast Menu (40%) */}
      <div className="w-[40%] flex flex-col bg-[#F8F9FA]">
        
        {/* Search Bar */}
        <div className="px-6 pt-6 pb-2">
          <form onSubmit={handleScannerSubmit} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              ref={barcodeInputRef}
              type="text" 
              placeholder="Search by name or scan barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-base font-medium transition-all"
              autoFocus
            />
          </form>
        </div>
        
        {/* Fast Grid Menu */}
        <div className="flex-1 px-6 pb-6 pt-2 overflow-y-auto">
          {fastItems.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-10 rounded-2xl bg-white border border-gray-100">
              No products found. Add products to Bakala or click Online to sync.
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {fastItems.map(item => (
                <button 
                  key={item._id}
                  onClick={() => {
                    addItem(item);
                    setSearchTerm('');
                    barcodeInputRef.current?.focus();
                  }}
                  className="p-4 rounded-2xl border border-gray-100 bg-white hover:border-emerald-400 hover:shadow-md transition-all text-left active:scale-95 flex flex-col justify-between min-h-[110px]"
                >
                  <span className="font-semibold text-gray-700 line-clamp-2 leading-snug">{item.name}</span>
                  <span className="text-sm font-bold text-emerald-600 mt-2">SAR {(item.retailPrice || 0).toFixed(2)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Summary Card */}
        <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-10 rounded-tl-3xl">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-gray-500 font-medium">
              <span>Subtotal</span>
              <span className="text-gray-700">SAR {(totals.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 font-medium">
              <span>VAT (15%)</span>
              <span className="text-gray-700">SAR {(totals.taxAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-100">
              <span className="text-gray-400 font-bold uppercase tracking-widest text-sm">Total</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-emerald-600">SAR</span>
                <span className="text-5xl font-black tracking-tighter text-emerald-600">{(totals.grandTotal || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Drawer */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleCheckout('cash')} className="flex flex-col items-center justify-center gap-1 p-4 bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl font-bold transition-colors active:scale-95 shadow-sm shadow-emerald-200">
              <Wallet className="w-6 h-6 mb-1" /> 
              <span>Pay Cash</span>
              <span className="text-[10px] font-normal opacity-75">[F1]</span>
            </button>
            <button 
              onClick={() => handleCheckout('card')}
              disabled={cartItems.length === 0}
              className="flex flex-col items-center justify-center gap-1 p-4 bg-[#0a192f] text-white hover:bg-[#112240] rounded-2xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >  
              <CreditCard className="w-6 h-6 mb-1" /> 
              <span>Mada / Visa</span>
              <span className="text-[10px] font-normal opacity-75">[F2]</span>
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
