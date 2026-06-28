import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, FileSpreadsheet, Loader2, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function BookStoreImport() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/bookstore/import-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      toast.success(`Imported ${res.data.imported} products`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import failed');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = 'name,name_ar,isbn,barcode,author,author_ar,publisher,publisher_ar,genre,category,language,edition,publication_year,cover_type,series_name,series_number,series_total,is_stationery,cost_price,retail_price,discount_price,stock_quantity,min_stock_alert,tax_rate,cover_image_url';
    const example = '\nHarry Potter,هاري بوتر,9780747532743,9780747532743,J.K. Rowling,ج. ك. رولينج,Bloomsbury,بلومزبري,Fantasy,Fiction,English,1st,1997,paperback,Harry Potter,1,7,false,15.00,25.00,0,50,5,15,https://example.com/cover.jpg';
    const blob = new Blob([headers + example], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookstore_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/app/dashboard/bookstore/products" className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Bulk Import</h1>
          <p className="text-sm text-gray-400">Upload a CSV file to import books and stationery items</p>
        </div>
      </div>

      {/* Template download */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">CSV Template</h3>
              <p className="text-xs text-gray-400">Download the template with correct column headers</p>
            </div>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Template
          </button>
        </div>
      </div>

      {/* Upload area */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-dark-700">
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
            uploading ? 'border-indigo-300 bg-indigo-50/50' : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
              <p className="font-bold text-gray-900">Importing products...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-indigo-500" />
              </div>
              <p className="font-bold text-gray-900 text-lg">Click to upload CSV file</p>
              <p className="text-sm text-gray-400 mt-1">Supports .csv files up to 10MB</p>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleUpload} className="hidden" />
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Import Results</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-black text-emerald-600">{result.imported}</p>
                <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Imported</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-2xl font-black text-amber-600">{result.errors}</p>
                <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Skipped</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
              <FileSpreadsheet className="w-8 h-8 text-gray-500" />
              <div>
                <p className="text-2xl font-black text-gray-700">{result.total}</p>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Rows</p>
              </div>
            </div>
          </div>
          <Link
            to="/app/dashboard/bookstore/products"
            className="mt-4 inline-flex items-center gap-2 text-indigo-600 font-bold text-sm hover:underline"
          >
            View imported products →
          </Link>
        </div>
      )}
    </div>
  );
}
