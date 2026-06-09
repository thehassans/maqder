import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale, Printer, Search, RefreshCw, X, Hash } from 'lucide-react';
import Barcode from 'react-barcode';
import { getAllProducts } from '../../lib/bakalaDb';

export default function WeightScale() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [weightKg, setWeightKg] = useState('1.000');
  const [barcodeValue, setBarcodeValue] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    const loadProducts = async () => {
      const allProducts = await getAllProducts();
      setProducts(allProducts);
    };
    loadProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.primaryBarcode?.includes(searchTerm)
  ).slice(0, 50);

  const calculateChecksum = (str12) => {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(str12[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    return (10 - (sum % 10)) % 10;
  };

  const handleWeightChange = (e) => {
    let val = e.target.value;
    // Allow numbers and decimal point
    if (/^\d*\.?\d*$/.test(val)) {
      setWeightKg(val);
    }
  };

  const generateBarcode = () => {
    if (!selectedProduct) return;
    const weight = parseFloat(weightKg) || 0;
    const totalPrice = (selectedProduct.retailPrice * weight);
    const priceHalalas = Math.round(totalPrice * 100);
    
    // Ensure item code is 5 digits
    let itemCode = selectedProduct.primaryBarcode || '00000';
    itemCode = itemCode.slice(0, 5).padStart(5, '0');
    
    // Ensure price is 5 digits
    let priceStr = priceHalalas.toString().padStart(5, '0');
    if (priceStr.length > 5) {
      priceStr = priceStr.slice(-5); // max 999.99 SAR
    }

    const str12 = `21${itemCode}${priceStr}`;
    const checksum = calculateChecksum(str12);
    setBarcodeValue(`${str12}${checksum}`);
  };

  useEffect(() => {
    if (selectedProduct && weightKg) {
      generateBarcode();
    } else {
      setBarcodeValue(null);
    }
  }, [selectedProduct, weightKg]);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label</title>
          <style>
            @page { size: 58mm 40mm; margin: 0; }
            body { font-family: sans-serif; margin: 0; padding: 10px; width: 58mm; text-align: center; }
            .name { font-weight: bold; font-size: 14px; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .details { font-size: 12px; margin-bottom: 5px; display: flex; justify-content: space-between; }
            .price { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
            .barcode { display: flex; justify-content: center; }
            .barcode svg { width: 100%; height: auto; max-height: 40px; }
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

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white px-8 py-6 border-b border-gray-100 shadow-sm flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/app/dashboard/bakala/dashboard')}
            className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-2">
              <Scale className="w-7 h-7 text-emerald-500" />
              Weight Scale Station
            </h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">Add-on service for Bakala Supermarket</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Product Selection */}
        <div className="w-1/2 flex flex-col border-r border-gray-100 bg-white shadow-sm">
          <div className="p-6 border-b border-gray-50">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search products to weigh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[#F8F9FA] border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-base font-medium transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.map(product => (
                <button
                  key={product._id}
                  onClick={() => setSelectedProduct(product)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between min-h-[120px] transition-all duration-200 ${
                    selectedProduct?._id === product._id 
                      ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500' 
                      : 'border-gray-100 bg-white hover:border-emerald-300 hover:shadow-sm'
                  }`}
                >
                  <span className="font-bold text-gray-800 line-clamp-2 leading-snug">{product.name}</span>
                  <div className="mt-3 flex justify-between items-end w-full">
                    <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      {product.primaryBarcode?.slice(0, 5) || '00000'}
                    </span>
                    <span className="text-sm font-black text-emerald-600 bg-emerald-100/50 px-2 py-1 rounded-lg">
                      SAR {product.retailPrice?.toFixed(2)}/kg
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Digital Scale & Print */}
        <div className="w-1/2 bg-[#F8F9FA] flex flex-col items-center justify-center p-12">
          {selectedProduct ? (
            <div className="w-full max-w-md">
              {/* Digital Scale Display */}
              <div className="bg-gray-900 rounded-[2rem] p-8 shadow-2xl mb-8 relative overflow-hidden border-4 border-gray-800">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                <div className="flex justify-between items-center mb-6">
                  <span className="text-emerald-400 font-mono font-bold tracking-widest text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    SCALE ACTIVE
                  </span>
                  <button onClick={() => setSelectedProduct(null)} className="text-gray-500 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <h3 className="text-white text-xl font-bold mb-8 line-clamp-1 opacity-90">{selectedProduct.name}</h3>
                
                <div className="bg-[#1A222C] rounded-2xl p-6 border border-gray-700 shadow-inner mb-6">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-gray-400 font-medium text-sm">WEIGHT (KG)</span>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="text" 
                      value={weightKg}
                      onChange={handleWeightChange}
                      className="bg-transparent text-5xl font-black text-emerald-400 w-full outline-none font-mono tracking-tighter"
                      placeholder="0.000"
                    />
                    <span className="text-emerald-400/50 text-2xl font-bold font-mono">kg</span>
                  </div>
                </div>

                <div className="flex justify-between items-center px-2">
                  <div>
                    <p className="text-gray-500 text-xs font-bold mb-1">UNIT PRICE</p>
                    <p className="text-white font-mono text-lg">SAR {selectedProduct.retailPrice?.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-xs font-bold mb-1">TOTAL PRICE</p>
                    <p className="text-white font-mono text-3xl font-bold text-amber-400">
                      SAR {((parseFloat(weightKg) || 0) * selectedProduct.retailPrice).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Barcode Preview & Print Action */}
              <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-6">
                  <h4 className="font-bold text-gray-800 text-lg">Label Preview</h4>
                  {barcodeValue && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg uppercase tracking-wider">
                      Ready to Print
                    </span>
                  )}
                </div>

                {barcodeValue ? (
                  <>
                    {/* Hidden printable area */}
                    <div className="hidden">
                      <div ref={printRef} className="label-content">
                        <div className="name">{selectedProduct.name}</div>
                        <div className="details">
                          <span>${parseFloat(weightKg).toFixed(3)}kg</span>
                          <span>@ ${selectedProduct.retailPrice.toFixed(2)}/kg</span>
                        </div>
                        <div className="price">SAR ${((parseFloat(weightKg) || 0) * selectedProduct.retailPrice).toFixed(2)}</div>
                        <div className="barcode">
                          <Barcode value={barcodeValue} format="EAN13" width={1.5} height={40} fontSize={12} margin={0} displayValue={true} />
                        </div>
                      </div>
                    </div>

                    {/* Visible Preview */}
                    <div className="bg-gray-50 p-6 rounded-2xl w-full flex flex-col items-center mb-8 border border-gray-200">
                      <Barcode value={barcodeValue} format="EAN13" width={1.8} height={60} fontSize={14} margin={10} background="#F9FAFB" />
                    </div>

                    <button 
                      onClick={handlePrint}
                      className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                      <Printer className="w-6 h-6" />
                      Print Barcode Label
                    </button>
                  </>
                ) : (
                  <div className="text-gray-400 py-10 flex flex-col items-center">
                    <RefreshCw className="w-8 h-8 mb-3 opacity-20 animate-spin-slow" />
                    <p>Enter weight to generate barcode</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center opacity-40">
              <Scale className="w-32 h-32 mx-auto mb-6 text-gray-300" />
              <h2 className="text-2xl font-bold text-gray-400">Select a product to weigh</h2>
              <p className="text-gray-400 mt-2">Search and click on a product from the left panel</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
