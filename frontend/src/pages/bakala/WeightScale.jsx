import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale, Printer, Search, RefreshCw, X, Hash, Minus, Plus } from 'lucide-react';
import Barcode from 'react-barcode';
import Select from 'react-select';
import { getAllProducts } from '../../lib/bakalaDb';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function WeightScale() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Inputs
  const [weightKg, setWeightKg] = useState('1.000');
  const [quantity, setQuantity] = useState(1);
  
  const [barcodeValue, setBarcodeValue] = useState(null);
  const printRef = useRef(null);

  const loadProducts = async () => {
    const allProducts = await getAllProducts();
    setProducts(allProducts);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const calculateChecksum = (str12) => {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(str12[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    return (10 - (sum % 10)) % 10;
  };

  const isWeightBased = selectedProduct?.unit === 'KG' || !selectedProduct?.unit; // default to KG if missing

  const handleWeightChange = (e) => {
    let val = e.target.value;
    if (/^\d*\.?\d*$/.test(val)) {
      setWeightKg(val);
    }
  };

  const handleQuantityChange = (delta) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const generateBarcode = () => {
    if (!selectedProduct) return;
    
    let totalPrice = 0;
    if (isWeightBased) {
      const weight = parseFloat(weightKg) || 0;
      totalPrice = (selectedProduct.retailPrice * weight);
    } else {
      totalPrice = (selectedProduct.retailPrice * quantity);
    }

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
    if (selectedProduct) {
      generateBarcode();
    } else {
      setBarcodeValue(null);
    }
  }, [selectedProduct, weightKg, quantity]);

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
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 8px; width: 58mm; text-align: center; color: #000; }
            .name { font-weight: 900; font-size: 13px; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-transform: uppercase; }
            .details { font-size: 10px; margin-bottom: 4px; display: flex; justify-content: space-between; font-weight: 600; border-bottom: 1px dashed #ccc; padding-bottom: 2px; }
            .price-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
            .price-label { font-size: 9px; font-weight: bold; color: #555; }
            .price { font-weight: 900; font-size: 16px; }
            .barcode { display: flex; justify-content: center; margin-top: 2px; }
            .barcode svg { width: 100%; height: auto; max-height: 35px; }
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

  // Prepare options for react-select, showing all products so user can weigh anything if needed
  const productOptions = products.map(p => ({
    value: p._id,
    label: `${p.name} - SAR ${p.retailPrice?.toFixed(2)}/${p.unit || 'KG'}`,
    product: p
  }));

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      background: '#fff',
      borderColor: state.isFocused ? '#10B981' : '#E5E7EB',
      borderRadius: '1rem',
      padding: '0.5rem',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none',
      '&:hover': {
        borderColor: '#10B981'
      }
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#10B981' : state.isFocused ? '#D1FAE5' : 'white',
      color: state.isSelected ? 'white' : '#1F2937',
      fontWeight: '500',
      padding: '1rem',
      cursor: 'pointer'
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '1rem',
      overflow: 'hidden',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
    })
  };

  let totalPrice = 0;
  if (selectedProduct) {
    if (isWeightBased) {
      totalPrice = (parseFloat(weightKg) || 0) * selectedProduct.retailPrice;
    } else {
      totalPrice = quantity * selectedProduct.retailPrice;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white px-8 py-6 border-b border-gray-100 shadow-sm flex items-center justify-between z-20 sticky top-0">
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
              Smart Scale & Labelling
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 flex justify-center items-start pt-12 px-4 overflow-y-auto pb-20">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-[1fr_400px] gap-8 items-start">
          
          {/* Left Column: Product Selection & Input */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100 relative z-10">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-gray-400" />
                Select Product
              </h2>
              
              <Select
                options={productOptions}
                styles={customSelectStyles}
                placeholder="Search for fruits, vegetables, or nuts..."
                isClearable
                onChange={(selected) => {
                  if (selected) {
                    setSelectedProduct(selected.product);
                    setWeightKg('1.000');
                    setQuantity(1);
                  } else {
                    setSelectedProduct(null);
                  }
                }}
              />
            </div>

            {selectedProduct && (
              <div className="bg-gray-900 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden border-4 border-gray-800">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                <div className="flex justify-between items-center mb-8 bg-gray-800/80 p-3 rounded-2xl border border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                      <span className="absolute inline-flex w-3 h-3 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                      <span className="relative inline-flex w-3 h-3 rounded-full bg-emerald-500"></span>
                    </div>
                    <div>
                      <span className="text-emerald-400 font-bold text-sm tracking-wide block">CAS PR-100 CONNECTED</span>
                      <span className="text-gray-400 text-xs font-mono">PORT: COM3 | BAUD: 9600</span>
                    </div>
                  </div>
                  <div className="bg-gray-900 text-gray-300 px-3 py-1 rounded-xl text-xs font-bold tracking-wider uppercase border border-gray-700">
                    UNIT: {selectedProduct.unit || 'KG'}
                  </div>
                </div>
                
                <h3 className="text-white text-2xl font-bold mb-8 opacity-90">{selectedProduct.name}</h3>
                
                {isWeightBased ? (
                  <div className="bg-[#1A222C] rounded-[2rem] p-8 border border-gray-700 shadow-inner mb-8">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-gray-400 font-medium text-sm">LIVE WEIGHT (KG)</span>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="text" 
                        value={weightKg}
                        onChange={handleWeightChange}
                        className="bg-transparent text-6xl md:text-7xl font-black text-emerald-400 w-full outline-none font-mono tracking-tighter"
                        placeholder="0.000"
                      />
                      <span className="text-emerald-400/50 text-3xl font-bold font-mono">kg</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#1A222C] rounded-[2rem] p-8 border border-gray-700 shadow-inner mb-8 flex flex-col items-center justify-center">
                    <span className="text-gray-400 font-medium text-sm mb-6 uppercase tracking-wider">Quantity ({selectedProduct.unit})</span>
                    <div className="flex items-center gap-8">
                      <button 
                        onClick={() => handleQuantityChange(-1)}
                        className="w-16 h-16 rounded-2xl bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 transition-colors active:scale-95 shadow-lg"
                      >
                        <Minus className="w-8 h-8" />
                      </button>
                      <span className="text-6xl font-black text-emerald-400 font-mono w-24 text-center">
                        {quantity}
                      </span>
                      <button 
                        onClick={() => handleQuantityChange(1)}
                        className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-400 transition-colors active:scale-95 shadow-lg shadow-emerald-500/20"
                      >
                        <Plus className="w-8 h-8" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-end px-2">
                  <div>
                    <p className="text-gray-500 text-xs font-bold mb-1 tracking-wider">UNIT PRICE</p>
                    <p className="text-white font-mono text-xl">SAR {selectedProduct.retailPrice?.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-xs font-bold mb-1 tracking-wider">NET PRICE</p>
                    <p className="text-white font-mono text-4xl font-bold text-amber-400">
                      SAR {totalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Label Preview & Action */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 flex flex-col items-center sticky top-28">
            <div className="w-full flex justify-between items-center mb-8">
              <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <Printer className="w-5 h-5 text-gray-400" />
                Label Preview
              </h4>
              {barcodeValue && (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg uppercase tracking-wider">
                  Ready
                </span>
              )}
            </div>

            {selectedProduct && barcodeValue ? (
              <div className="w-full flex flex-col items-center">
                {/* Hidden printable area */}
                <div className="hidden">
                  <div ref={printRef} className="label-content">
                    <div className="name">{selectedProduct.name}</div>
                    <div className="details">
                      <span>{isWeightBased ? `${parseFloat(weightKg).toFixed(3)} kg` : `${quantity} ${selectedProduct.unit}`}</span>
                      <span>@ SAR {selectedProduct.retailPrice.toFixed(2)}/{selectedProduct.unit}</span>
                    </div>
                    <div className="price-row">
                      <span className="price-label">NET PRICE</span>
                      <span className="price">SAR {totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="barcode">
                      <Barcode value={barcodeValue} format="EAN13" width={1.6} height={40} fontSize={10} margin={0} displayValue={true} />
                    </div>
                  </div>
                </div>

                {/* Visible Preview */}
                <div className="bg-[#F8F9FA] p-8 rounded-3xl w-full flex flex-col items-center mb-8 border border-gray-200 shadow-inner">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 w-full mb-6">
                    <div className="font-black text-gray-800 text-lg mb-2 text-center uppercase tracking-wide border-b border-gray-100 pb-2">{selectedProduct.name}</div>
                    <div className="flex justify-between text-sm text-gray-500 font-medium mb-3">
                      <span>{isWeightBased ? `${parseFloat(weightKg).toFixed(3)} kg` : `${quantity} ${selectedProduct.unit}`}</span>
                      <span>SAR {selectedProduct.retailPrice.toFixed(2)} / {selectedProduct.unit}</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Net Price</span>
                      <span className="font-black text-xl text-gray-900">SAR {totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  <Barcode value={barcodeValue} format="EAN13" width={1.8} height={60} fontSize={14} margin={0} background="#F8F9FA" />
                </div>

                <button 
                  onClick={handlePrint}
                  className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/30 transition-all hover:-translate-y-1 flex items-center justify-center gap-3"
                >
                  <Printer className="w-6 h-6" />
                  Print Label Now
                </button>
              </div>
            ) : (
              <div className="text-gray-400 py-16 flex flex-col items-center text-center">
                <Scale className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-medium text-gray-500">No product selected</p>
                <p className="text-sm mt-2 opacity-70">Search for a product to generate a printable barcode label.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
