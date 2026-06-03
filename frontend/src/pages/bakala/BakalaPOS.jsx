import React, { useEffect, useRef, useState } from 'react';
import { useCartEngine } from '../../hooks/useCartEngine';
import { useBakalaSync } from '../../hooks/useBakalaSync';
import { getProductByBarcode, saveOfflineInvoice } from '../../lib/bakalaDb';
import { ShoppingCart, CreditCard, Wallet, Send, RefreshCw, Server, WifiOff, ArrowLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

export default function BakalaPOS() {
  const navigate = useNavigate();
  const { cartItems, addItem, updateQuantity, removeItem, clearCart, totals } = useCartEngine();
  const { isOnline, pendingCount, syncOfflineData } = useBakalaSync();
  const barcodeInputRef = useRef(null);
  const [scannerValue, setScannerValue] = useState('');
  const [fastItems, setFastItems] = useState([]);

  // Keep focus on scanner input globally
  useEffect(() => {
    const focusScanner = () => {
      if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        barcodeInputRef.current?.focus();
      }
    };
    
    document.addEventListener('click', focusScanner);
    focusScanner();
    return () => document.removeEventListener('click', focusScanner);
  }, []);

  // Load products from IndexedDB
  useEffect(() => {
    const loadProducts = async () => {
      // Run sync to fetch newest products, then load
      await syncOfflineData();
      const { getAllProducts } = await import('../../lib/bakalaDb');
      const products = await getAllProducts();
      setFastItems(products.slice(0, 16)); // Load first 16 as fast menu for now
    };
    loadProducts();
  }, [syncOfflineData]);

  // Handle Barcode Scans
  const handleScannerSubmit = async (e) => {
    e.preventDefault();
    if (!scannerValue.trim()) return;
    
    const product = await getProductByBarcode(scannerValue.trim());
    if (product) {
      addItem(product);
    } else {
      // For demo or manual testing if DB doesn't have it
      addItem({
        _id: uuidv4(),
        name: `Item ${scannerValue}`,
        primaryBarcode: scannerValue,
        retailPrice: 15.0,
        taxRate: 15
      });
    }
    setScannerValue('');
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
        case 'F2': e.preventDefault(); handleCheckout('mada'); break;
        case 'F3': e.preventDefault(); handleCheckout('apple_pay'); break;
        case 'F4': e.preventDefault(); /* Open Daftar Modal */ break;
        case 'Escape': e.preventDefault(); clearCart(); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, totals]);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white text-gray-900 overflow-hidden">
      
      {/* Hidden Scanner Input */}
      <form onSubmit={handleScannerSubmit} className="opacity-0 absolute -top-10">
        <input 
          ref={barcodeInputRef}
          type="text" 
          value={scannerValue}
          onChange={(e) => setScannerValue(e.target.value)}
          autoFocus
        />
      </form>

      {/* LEFT PANEL: Cart View (65%) */}
      <div className="w-[65%] flex flex-col border-r border-gray-200 bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/app/dashboard/bakala/dashboard')}
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-gray-400" />
              <h1 className="text-xl font-bold tracking-tight">Checkout</h1>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-500"><Server className="w-4 h-4"/> Online</span>
            ) : (
              <span className="flex items-center gap-1 text-rose-500"><WifiOff className="w-4 h-4"/> Offline Sync Mode</span>
            )}
            {pendingCount > 0 && <span className="text-amber-500">{pendingCount} Pending</span>}
          </div>
        </div>

        {/* Cart Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg">Scan item to begin</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="pb-3 font-medium">Item</th>
                  <th className="pb-3 font-medium text-center">Qty</th>
                  <th className="pb-3 font-medium text-right">Price</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item, index) => (
                  <tr key={index} className="border-b border-gray-50 group">
                    <td className="py-4">
                      <p className="font-semibold text-gray-900">{item.productName}</p>
                      <p className="text-xs text-gray-500">{item.primaryBarcode}</p>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => updateQuantity(index, item.quantity - 1)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700">-</button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(index, item.quantity + 1)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700">+</button>
                      </div>
                      <div className="text-center group-hover:hidden font-medium">{item.quantity}</div>
                    </td>
                    <td className="py-4 text-right text-gray-500">SAR {item.unitPrice.toFixed(2)}</td>
                    <td className="py-4 text-right font-medium text-gray-900">SAR {item.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Actions & Fast Menu (35%) */}
      <div className="w-[35%] flex flex-col bg-gray-50/50">
        
        {/* Fast Grid Menu */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Fast Menu</h2>
          {fastItems.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-10 border border-dashed border-gray-200 rounded-xl bg-white">
              No products found. Add products to Bakala or click Online to sync.
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {fastItems.map(item => (
                <button 
                  key={item._id}
                  onClick={() => addItem(item)}
                  className="p-4 rounded-xl border border-gray-200 bg-white hover:border-emerald-500 hover:shadow-sm transition-all text-left active:scale-95 flex flex-col gap-2"
                >
                  <span className="font-medium text-gray-800 line-clamp-2 leading-tight">{item.name}</span>
                  <span className="text-gray-500 text-sm font-semibold text-emerald-600">SAR {item.retailPrice.toFixed(2)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Summary Card */}
        <div className="p-6 bg-white border-t border-gray-200 shadow-sm z-10">
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>SAR {totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>VAT (15%)</span>
              <span>SAR {totals.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-100">
              <span className="text-gray-600 font-medium">Total</span>
              <span className="text-5xl font-bold tracking-tighter text-emerald-600">SAR {totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Drawer */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleCheckout('cash')} className="flex items-center justify-center gap-2 p-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-bold transition-colors active:scale-95 border border-emerald-200">
              <Wallet className="w-5 h-5" /> Cash [F1]
            </button>
            <button onClick={() => handleCheckout('mada')} className="flex items-center justify-center gap-2 p-4 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold transition-colors active:scale-95 border border-blue-200">
              <CreditCard className="w-5 h-5" /> Mada [F2]
            </button>
            <button onClick={() => handleCheckout('apple_pay')} className="flex items-center justify-center gap-2 p-4 bg-gray-50 text-gray-900 hover:bg-gray-100 rounded-xl font-bold transition-colors active:scale-95 border border-gray-200">
              Apple Pay [F3]
            </button>
            <button className="flex items-center justify-center gap-2 p-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold transition-colors active:scale-95 border border-indigo-200">
              <Send className="w-5 h-5" /> Daftar [F4]
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
