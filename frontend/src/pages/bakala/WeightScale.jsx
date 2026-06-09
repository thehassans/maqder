import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale, Printer, Plug, Info, Unplug } from 'lucide-react';
import Barcode from 'react-barcode';
import Select from 'react-select';
import { useSelector } from 'react-redux';
import { getAllProducts } from '../../lib/bakalaDb';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function WeightScale() {
  const navigate = useNavigate();
  const { tenant } = useSelector(state => state.auth);
  const scalePrefix = (tenant?.settings?.hardwareSettings?.scaleBarcodePrefix || '21').substring(0, 2).padEnd(2, '0');

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [weightValue, setWeightValue] = useState('0.000');
  const [weightUnit, setWeightUnit] = useState('KG'); // 'KG' or 'G'
  const [quantity, setQuantity] = useState(1);
  
  const [barcodeValue, setBarcodeValue] = useState(null);
  const printRef = useRef(null);

  // Serial Port state
  const [port, setPort] = useState(null);
  const [isReading, setIsReading] = useState(false);
  const readerRef = useRef(null);

  const loadProducts = async () => {
    const allProducts = await getAllProducts();
    setProducts(allProducts);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Calculate Net Price
  const isWeightBased = selectedProduct?.unit === 'KG' || !selectedProduct?.unit;
  
  let parsedWeight = parseFloat(weightValue) || 0;
  if (weightUnit === 'G') {
    parsedWeight = parsedWeight / 1000; // Convert grams to KG for pricing if the product price is per KG
  }

  const totalPrice = selectedProduct 
    ? (isWeightBased ? parsedWeight * selectedProduct.retailPrice : quantity * selectedProduct.retailPrice)
    : 0;

  // Generate Barcode
  useEffect(() => {
    if (!selectedProduct) {
      setBarcodeValue(null);
      return;
    }

    const itemCode = selectedProduct.primaryBarcode?.padStart(5, '0').slice(0, 5) || '00000';
    const priceInHalalas = Math.round(totalPrice * 100).toString().padStart(5, '0');
    
    // Barcode Format: Prefix(2) + ItemCode(5) + PriceInHalalas(5) + Checksum(1)
    const baseBarcode = `${scalePrefix}${itemCode}${priceInHalalas}`;
    
    // Calculate EAN-13 Checksum
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(baseBarcode[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    
    setBarcodeValue(`${baseBarcode}${checkDigit}`);
  }, [selectedProduct, weightValue, weightUnit, quantity, totalPrice]);

  const handlePrint = () => {
    if (!selectedProduct || !barcodeValue) return;
    
    const printContent = printRef.current;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label</title>
          <style>
            @page { size: 38mm 25mm; margin: 0; }
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 2px; width: 38mm; text-align: center; color: #000; }
            .name { font-weight: 900; font-size: 10px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-transform: uppercase; max-width: 100%; }
            .details { font-size: 8px; margin-bottom: 2px; display: flex; justify-content: space-between; border-bottom: 1px dashed #000; padding-bottom: 2px; }
            .price-row { display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 900; margin-bottom: 2px; }
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

  const productOptions = products
    .filter(p => p.category === 'Fruits & Vegetables')
    .map(p => ({
      value: p._id,
      label: `${p.name} - SAR ${p.retailPrice?.toFixed(2)}/${p.unit || 'KG'}`,
      product: p
    }));

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      background: 'white',
      borderColor: state.isFocused ? '#10b981' : '#e5e7eb',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(16, 185, 129, 0.1)' : 'none',
      borderRadius: '1rem',
      padding: '0.75rem',
      borderWidth: '2px',
      '&:hover': { borderColor: '#10b981' }
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#10b981' : state.isFocused ? '#ecfdf5' : 'white',
      color: state.isSelected ? 'white' : '#111827',
      padding: '1rem',
      cursor: 'pointer',
      fontWeight: '600',
      borderRadius: '0.5rem',
      margin: '0.25rem'
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '1rem',
      padding: '0.5rem',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
    })
  };

  // Hardware Connection Logic
  const connectScale = async () => {
    if (!('serial' in navigator)) {
      toast.error("Web Serial API is not supported in this browser. Use Chrome or Edge.");
      return;
    }

    try {
      const selectedPort = await navigator.serial.requestPort();
      await selectedPort.open({ baudRate: 9600 }); // Standard baud rate for CAS scales
      setPort(selectedPort);
      toast.success("Hardware Scale Connected!");
      readLoop(selectedPort);
    } catch (error) {
      console.error(error);
      toast.error("Failed to connect to scale. Please try again.");
    }
  };

  const disconnectScale = async () => {
    if (port) {
      try {
        if (readerRef.current) {
          await readerRef.current.cancel();
        }
        await port.close();
        setPort(null);
        setIsReading(false);
        toast.success("Disconnected from scale.");
      } catch (error) {
        console.error(error);
      }
    }
  };

  const readLoop = async (activePort) => {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = activePort.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    readerRef.current = reader;
    setIsReading(true);

    let buffer = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += value;
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop(); // keep incomplete line
        
        for (const line of lines) {
          // Typically scales send something like: ST,NT,+   1.234kg
          // We extract the first sequence of numbers/decimals.
          const match = line.match(/([0-9]+\.[0-9]+)/);
          if (match) {
            setWeightValue(match[1]);
          }
        }
      }
    } catch (error) {
      console.error("Serial Read Error", error);
    } finally {
      reader.releaseLock();
      setIsReading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
      {/* Ultra-Minimal Header */}
      <div className="bg-white px-8 py-6 flex items-center justify-between sticky top-0 z-10 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/app/dashboard/bakala/pos')} className="p-3 text-gray-400 hover:text-gray-900 transition-colors rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-200">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900">Smart Scale</h1>
            <p className="text-sm text-gray-400 font-bold tracking-wide uppercase mt-1">Ultra-Precision Weighing</p>
          </div>
        </div>

        {/* Hardware Status Toggle */}
        <div className="flex items-center gap-3">
          {port ? (
            <button onClick={disconnectScale} className="flex items-center gap-3 px-5 py-3 bg-emerald-50 text-emerald-700 rounded-2xl font-bold text-sm hover:bg-emerald-100 transition-all border border-emerald-100 shadow-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Scale Connected
              <Unplug className="w-4 h-4 ml-2 opacity-50" />
            </button>
          ) : (
            <button onClick={connectScale} className="flex items-center gap-3 px-5 py-3 bg-white text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all border border-gray-200 shadow-sm shadow-gray-200/50">
              <Plug className="w-5 h-5 text-gray-400" />
              Connect Hardware
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex justify-center items-start pt-12 px-8 pb-20">
        <div className="w-full max-w-6xl grid grid-cols-12 gap-10">
          
          {/* Main Scale Section */}
          <div className="col-span-12 lg:col-span-7 space-y-8">
            
            {/* Product Selector */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">1. Select Item</label>
              <Select
                options={productOptions}
                onChange={(option) => setSelectedProduct(option?.product || null)}
                styles={customSelectStyles}
                placeholder="Search product to weigh..."
                isClearable
                noOptionsMessage={() => "No products found"}
              />
            </div>

            {/* Scale Display */}
            <div className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-8 left-8 text-gray-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                <Scale className="w-5 h-5" />
                Live Weight
              </div>
              
              {/* KG / Gram Toggle */}
              {isWeightBased && (
                <div className="absolute top-8 right-8 bg-gray-50 p-1.5 rounded-2xl flex border border-gray-100 shadow-inner">
                  <button 
                    onClick={() => setWeightUnit('KG')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${weightUnit === 'KG' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    KG
                  </button>
                  <button 
                    onClick={() => setWeightUnit('G')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${weightUnit === 'G' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Gram
                  </button>
                </div>
              )}

              <div className="mt-16 mb-8 w-full flex justify-center">
                {isWeightBased ? (
                  <div className="flex items-baseline justify-center gap-4 border-b-4 border-gray-100 pb-6 w-3/4">
                    <input 
                      type="text" 
                      value={weightValue}
                      onChange={(e) => {
                        // Allow only numbers and a single decimal point
                        if (/^\d*\.?\d*$/.test(e.target.value)) {
                          setWeightValue(e.target.value);
                        }
                      }}
                      className="text-[7rem] font-black text-gray-900 w-full text-center outline-none bg-transparent tracking-tighter"
                      placeholder="0.000"
                      readOnly={!!port} // Prevent typing if hardware is connected
                    />
                    <span className="text-3xl font-black text-gray-300 uppercase">{weightUnit}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-8 border-b-4 border-gray-100 pb-6 w-3/4">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-20 h-20 rounded-[1.5rem] bg-gray-50 flex items-center justify-center text-4xl font-bold text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors border border-gray-200">-</button>
                    <input 
                      type="number" 
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="text-[6rem] font-black text-gray-900 w-48 text-center outline-none bg-transparent tracking-tighter"
                    />
                    <button onClick={() => setQuantity(quantity + 1)} className="w-20 h-20 rounded-[1.5rem] bg-gray-50 flex items-center justify-center text-4xl font-bold text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors border border-gray-200">+</button>
                  </div>
                )}
              </div>

              {selectedProduct ? (
                <div className="w-full flex justify-between items-end px-4">
                  <div>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Unit Price</p>
                    <p className="text-2xl font-black text-gray-900">SAR {selectedProduct.retailPrice?.toFixed(2)} <span className="text-base text-gray-400 font-bold">/{selectedProduct.unit || 'KG'}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Net Price</p>
                    <p className="text-5xl font-black text-emerald-500 tracking-tight">SAR {totalPrice.toFixed(2)}</p>
                  </div>
                </div>
              ) : (
                <div className="w-full text-center text-gray-300 font-bold tracking-widest uppercase text-sm mt-4">
                  Waiting for product selection
                </div>
              )}
            </div>
            
            {port && (
              <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm shadow-blue-100/50">
                <Info className="w-6 h-6 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-base text-blue-900 font-medium leading-relaxed">
                  <span className="font-bold">Scale Connected & Active.</span> Place items directly on the scale to automatically stream the live weight. Manual keyboard input is temporarily disabled.
                </p>
              </div>
            )}
          </div>

          {/* Label Preview Section */}
          <div className="col-span-12 lg:col-span-5">
            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100 sticky top-32">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                <Printer className="w-5 h-5 text-gray-400" />
                2. Print Label
              </h3>

              {!selectedProduct ? (
                <div className="bg-gray-50 rounded-3xl border-2 border-gray-100 border-dashed p-16 text-center">
                  <Scale className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                  <p className="text-gray-400 font-bold tracking-wide">Select a product to preview its label</p>
                </div>
              ) : (
                <>
                  {/* Label Canvas */}
                  <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 flex flex-col items-center justify-center mx-auto mb-10 w-full max-w-[320px]">
                    <div className="text-center w-full">
                      <h4 className="font-black text-gray-900 text-xl mb-3 uppercase tracking-wider truncate">{selectedProduct.name}</h4>
                      
                      <div className="flex justify-between items-center text-sm text-gray-500 font-bold border-b-2 border-gray-100 pb-3 mb-4">
                        <span>{isWeightBased ? `${weightValue} ${weightUnit}` : `${quantity} ${selectedProduct.unit}`}</span>
                        <span>SAR {selectedProduct.retailPrice.toFixed(2)}/{selectedProduct.unit || 'KG'}</span>
                      </div>
                      
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Total</span>
                        <span className="text-3xl font-black text-gray-900">SAR {totalPrice.toFixed(2)}</span>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-xl flex justify-center border border-gray-100">
                        {barcodeValue ? (
                          <Barcode value={barcodeValue} format="EAN13" width={2.5} height={60} fontSize={16} margin={0} background="transparent" fontOptions="bold" />
                        ) : (
                          <div className="h-[60px] w-full flex items-center justify-center text-sm font-bold text-gray-400">Barcode loading...</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handlePrint}
                    className="w-full py-5 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-gray-900/20 active:scale-95 flex items-center justify-center gap-3"
                  >
                    <Printer className="w-6 h-6" />
                    Print Label Now
                  </button>
                </>
              )}

              {/* Hidden Print Content */}
              <div className="hidden">
                <div ref={printRef}>
                  {selectedProduct && (
                    <div className="label-page">
                      <div className="name">{selectedProduct.name}</div>
                      <div className="details">
                        <span>{isWeightBased ? `${weightValue} ${weightUnit}` : `${quantity} ${selectedProduct.unit}`}</span>
                        <span>SAR {selectedProduct.retailPrice.toFixed(2)}/{selectedProduct.unit || 'KG'}</span>
                      </div>
                      <div className="price-row">
                        <span>NET</span>
                        <span>SAR {totalPrice.toFixed(2)}</span>
                      </div>
                      <div className="barcode">
                        <Barcode value={barcodeValue} format="EAN13" width={1.2} height={20} fontSize={8} margin={0} displayValue={true} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
