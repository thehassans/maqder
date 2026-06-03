import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, ShieldAlert, FileDown, RefreshCw } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export default function ExpiryTracker() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpiryData();
  }, []);

  const fetchExpiryData = async () => {
    try {
      const res = await api.get('/bakala-products/expiry-report');
      setProducts(res.data);
    } catch (err) {
      toast.error('Failed to load expiry data');
    } finally {
      setLoading(false);
    }
  };

  const getExpiryStatus = (expiryDate) => {
    const today = new Date();
    const expDate = new Date(expiryDate);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return { label: 'Expired', color: 'text-rose-600 bg-rose-50', icon: ShieldAlert, days: diffDays };
    if (diffDays <= 30) return { label: 'Expiring Soon', color: 'text-amber-600 bg-amber-50', icon: AlertTriangle, days: diffDays };
    return { label: 'Good', color: 'text-emerald-600 bg-emerald-50', icon: Clock, days: diffDays };
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Municipality Expiry Report", 14, 15);
    
    const tableData = products.map(p => {
      const status = getExpiryStatus(p.expiryDate);
      return [
        p.primaryBarcode,
        p.name,
        new Date(p.expiryDate).toLocaleDateString(),
        status.days <= 0 ? 'Expired' : `${status.days} Days`
      ];
    });

    doc.autoTable({
      head: [['Barcode', 'Product Name', 'Expiry Date', 'Status']],
      body: tableData,
      startY: 20,
    });

    doc.save("expiry_report.pdf");
  };

  if (loading) return <div className="flex justify-center p-10"><RefreshCw className="w-8 h-8 animate-spin text-gray-400" /></div>;

  const expiredCount = products.filter(p => getExpiryStatus(p.expiryDate).days <= 0).length;
  const expiringSoonCount = products.filter(p => {
    const days = getExpiryStatus(p.expiryDate).days;
    return days > 0 && days <= 30;
  }).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Expiry Tracker</h2>
          <p className="text-sm text-gray-500">Monitor perishable goods for municipality compliance.</p>
        </div>
        <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 transition-colors">
          <FileDown className="w-4 h-4" /> Export Report (PDF)
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-white rounded-lg"><ShieldAlert className="w-6 h-6 text-rose-500" /></div>
          <div>
            <p className="text-sm text-rose-600 font-medium">Expired Items (Pull Immediately)</p>
            <p className="text-2xl font-bold text-rose-700">{expiredCount}</p>
          </div>
        </div>
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-white rounded-lg"><AlertTriangle className="w-6 h-6 text-amber-500" /></div>
          <div>
            <p className="text-sm text-amber-600 font-medium">Expiring in &lt; 30 Days (Discount)</p>
            <p className="text-2xl font-bold text-amber-700">{expiringSoonCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Barcode</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiry Date</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map(p => {
              const status = getExpiryStatus(p.expiryDate);
              const Icon = status.icon;
              return (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 text-gray-500">{p.primaryBarcode}</td>
                  <td className="px-6 py-4 font-medium">{new Date(p.expiryDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${status.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {status.label} {status.days > 0 ? `(${status.days}d left)` : ''}
                    </span>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-gray-400">
                  No products with expiry dates tracked yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
