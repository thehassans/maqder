import React, { useEffect, useRef, useState } from 'react';
import { useCartEngine } from '../../hooks/useCartEngine';
import { useBakalaSync } from '../../hooks/useBakalaSync';
import { getProductByBarcode, saveOfflineInvoice } from '../../lib/bakalaDb';
import { ShoppingCart, CreditCard, Wallet, Send, RefreshCw, Server, WifiOff } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function BakalaPOS() {
  const { cartItems, addItem, updateQuantity, removeItem, clearCart, totals } = useCartEngine();
  const { isOnline, pendingCount } = useBakalaSync();
  const barcodeInputRef = useRef(null);
  const [scannerValue, setScannerValue] = useState('');

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

  // Fast Menu dummy items
  const fastItems = [
    { _id: 'f1', name: 'Samoon Bread', retailPrice: 1.5, taxRate: 0, primaryBarcode: 'samoon' },
    { _id: 'f2', name: 'Local Water Refill', retailPrice: 2.0, taxRate: 15, primaryBarcode: 'water_refill' },
    { _id: 'f3', name: 'Loose Mint', retailPrice: 1.0, taxRate: 15, primaryBarcode: 'mint' },
    { _id: 'f4', name: 'Fresh Milk 1L', retailPrice: 5.5, taxRate: 15, primaryBarcode: 'milk_1l' },
  ];

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      
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

      {/* LEFT PANEL: Cart View (60%) */}
      <div className="w-[60%] flex flex-col border-r border-zinc-900 bg-zinc-950">
        {/* Header */}
        <div className="p-4 border-b border-zinc-900 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-zinc-400" />
            <h1 className="text-xl font-bold tracking-tight">Checkout</h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
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
            <div className="flex flex-col items-center justify-center h-full text-zinc-600">
              <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg">Scan item to begin</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-zinc-500 border-b border-zinc-800">
                <tr>
                  <th className="pb-3 font-medium">Item</th>
                  <th className="pb-3 font-medium text-center">Qty</th>
                  <th className="pb-3 font-medium text-right">Price</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item, index) => (
                  <tr key={index} className="border-b border-zinc-900/50 group">
                    <td className="py-4">
                      <p className="font-semibold text-zinc-200">{item.productName}</p>
                      <p className="text-xs text-zinc-600">{item.primaryBarcode}</p>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => updateQuantity(index, item.quantity - 1)} className="px-2 py-1 bg-zinc-800 rounded">-</button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(index, item.quantity + 1)} className="px-2 py-1 bg-zinc-800 rounded">+</button>
                      </div>
                      <div className="text-center group-hover:hidden">{item.quantity}</div>
                    </td>
                    <td className="py-4 text-right text-zinc-400">SAR {item.unitPrice.toFixed(2)}</td>
                    <td className="py-4 text-right font-medium text-zinc-100">SAR {item.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Actions & Fast Menu (40%) */}
      <div className="w-[40%] flex flex-col bg-zinc-900/30">
        
        {/* Fast Grid Menu */}
        <div className="flex-1 p-6">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Fast Menu</h2>
          <div className="grid grid-cols-2 gap-3">
            {fastItems.map(item => (
              <button 
                key={item._id}
                onClick={() => addItem(item)}
                className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700 transition-all text-left active:scale-95 flex flex-col gap-2"
              >
                <span className="font-medium text-zinc-200">{item.name}</span>
                <span className="text-zinc-500 text-sm">SAR {item.retailPrice.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Summary Card */}
        <div className="p-6 bg-zinc-900 border-t border-zinc-800">
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span>SAR {totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>VAT (15%)</span>
              <span>SAR {totals.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-end mt-4 pt-4 border-t border-zinc-800">
              <span className="text-zinc-500 font-medium">Total</span>
              <span className="text-5xl font-bold tracking-tighter text-emerald-400">SAR {totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Drawer */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleCheckout('cash')} className="flex items-center justify-center gap-2 p-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold transition-colors active:scale-95">
              <Wallet className="w-5 h-5" /> Cash [F1]
            </button>
            <button onClick={() => handleCheckout('mada')} className="flex items-center justify-center gap-2 p-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-colors active:scale-95">
              <CreditCard className="w-5 h-5" /> Mada [F2]
            </button>
            <button onClick={() => handleCheckout('apple_pay')} className="flex items-center justify-center gap-2 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold transition-colors active:scale-95">
              Apple Pay [F3]
            </button>
            <button className="flex items-center justify-center gap-2 p-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-colors active:scale-95">
              <Send className="w-5 h-5" /> Daftar [F4]
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
