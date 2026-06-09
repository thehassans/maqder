import React, { useState, useEffect, useRef } from 'react';
import { Search, Printer, Download, Scan } from 'lucide-react';
import Barcode from 'react-barcode';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function PrintBarcode() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const printRef = useRef(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const res = await api.get('/bakala-products');
        setProducts(res.data);
      } catch (err) {
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handleSelect = (product) => {
    const existing = selectedItems.find(i => i._id === product._id);
    if (existing) {
      setSelectedItems(selectedItems.map(i => i._id === product._id ? { ...i, printQty: i.printQty + 1 } : i));
    } else {
      setSelectedItems([...selectedItems, { ...product, printQty: 1 }]);
    }
  };

  const handleUpdateQty = (id, qty) => {
    if (qty <= 0) {
      setSelectedItems(selectedItems.filter(i => i._id !== id));
    } else {
      setSelectedItems(selectedItems.map(i => i._id === id ? { ...i, printQty: qty } : i));
    }
  };

  const handlePrint = () => {
    if (selectedItems.length === 0) return toast.error('Please select items to print');
    
    const printContent = printRef.current;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Labels</title>
          <style>
            @page { size: 38mm 25mm; margin: 0; }
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 2px; width: 38mm; text-align: center; color: #000; }
            .label-page { page-break-after: always; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 25mm; overflow: hidden; }
            .name { font-weight: 900; font-size: 10px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-transform: uppercase; max-width: 100%; }
            .price { font-size: 9px; font-weight: bold; margin-bottom: 1px; }
            .barcode { display: flex; justify-content: center; }
            .barcode svg { width: 100%; height: auto; max-height: 15px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = () => { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.primaryBarcode?.includes(searchQuery)
  );

  return (
    <div className="flex gap-6">
      <div className="w-1/2 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase">Search Products</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search by name or barcode to add..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
          />
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg overflow-y-auto max-h-[400px]">
          {loading ? (
            <p className="p-4 text-center text-gray-500">Loading...</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredProducts.slice(0, 50).map(product => (
                <div key={product._id} className="p-3 hover:bg-gray-50 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.primaryBarcode}</p>
                  </div>
                  <button onClick={() => handleSelect(product)} className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200">
                    Add to Print List
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-1/2 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Print Queue</h3>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
            <Printer className="w-4 h-4" /> Print Labels
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg flex-1 p-4">
          {selectedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 min-h-[300px]">
              <Scan className="w-12 h-12 mb-4 opacity-20" />
              <p>No items in print queue.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedItems.map(item => (
                <div key={item._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.primaryBarcode} - SAR {item.retailPrice}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Labels:</label>
                    <input 
                      type="number" 
                      min="0"
                      value={item.printQty}
                      onChange={(e) => handleUpdateQty(item._id, parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm outline-none text-center"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hidden printable area */}
      <div className="hidden">
        <div ref={printRef}>
          {selectedItems.map(item => {
            const labels = [];
            for (let i = 0; i < item.printQty; i++) {
              labels.push(
                <div key={`${item._id}-${i}`} className="label-page">
                  <div className="name">{item.name}</div>
                  <div className="price">SAR {item.retailPrice?.toFixed(2)}</div>
                  <div className="barcode">
                    <Barcode 
                      value={item.primaryBarcode || '00000'} 
                      format={item.primaryBarcode?.length === 13 ? "EAN13" : "CODE128"}
                      width={1.2} 
                      height={20} 
                      fontSize={8} 
                      margin={0} 
                      displayValue={true} 
                      valid={() => {}}
                    />
                  </div>
                </div>
              );
            }
            return labels;
          })}
        </div>
      </div>
    </div>
  );
}
