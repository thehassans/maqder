import React, { useState, useEffect, useMemo } from 'react';
import { Search, FileText, Send, ShieldAlert, ShieldCheck, AlertCircle, Scale, ArrowRight, Loader2, TrendingUp, ShoppingCart, Wallet, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../lib/api';

export default function BakalaDashboard() {
  const { tenant } = useSelector((state) => state.auth);
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [khataAccounts, setKhataAccounts] = useState([]);
  const [selectedKhata, setSelectedKhata] = useState(null);
  const [khataTransactions, setKhataTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [khataRes, alertsRes, invoicesRes] = await Promise.all([
          api.get('/khata').catch(() => ({ data: [] })),
          api.get('/employees/compliance/alerts').catch(() => ({ data: [] })),
          api.get('/invoices', { params: { businessContext: 'bakala', limit: 200 } }).catch(() => ({ data: { invoices: [] } }))
        ]);
        setKhataAccounts(khataRes.data || []);
        setAlerts(alertsRes.data || []);
        setInvoices(invoicesRes.data?.invoices || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (khataAccounts.length > 0) {
      const matched = phoneNumber 
        ? khataAccounts.find(acc => acc.customerId?.phone?.includes(phoneNumber) || acc.customerId?.mobile?.includes(phoneNumber))
        : khataAccounts[0];
      
      setSelectedKhata(matched || null);
    } else {
      setSelectedKhata(null);
    }
  }, [phoneNumber, khataAccounts]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (selectedKhata) {
        try {
          const res = await api.get(`/khata/${selectedKhata._id}/transactions`);
          setKhataTransactions(res.data || []);
        } catch (error) {
          console.error(error);
        }
      } else {
        setKhataTransactions([]);
      }
    };
    fetchTransactions();
  }, [selectedKhata]);

  // Derived Analytics Data
  const { todayRevenue, todayCount, avgOrder, chartData, topProducts } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    let todayRev = 0;
    let todayCnt = 0;
    
    const dailyTotals = {};
    for(let i=6; i>=0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dailyTotals[d.toISOString().split('T')[0]] = 0;
    }

    const productCounts = {};

    invoices.forEach(inv => {
      const dateStr = new Date(inv.issueDate || inv.createdAt).toISOString().split('T')[0];
      const total = inv.grandTotal || 0;
      
      if (dateStr === todayStr) {
        todayRev += total;
        todayCnt++;
      }
      
      if (dailyTotals[dateStr] !== undefined) {
        dailyTotals[dateStr] += total;
      }

      // Aggregate products
      if (inv.lineItems && Array.isArray(inv.lineItems)) {
        inv.lineItems.forEach(item => {
          if (item.productName) {
            if (!productCounts[item.productName]) productCounts[item.productName] = { qty: 0, revenue: 0 };
            productCounts[item.productName].qty += item.quantity || 1;
            productCounts[item.productName].revenue += item.lineTotalWithTax || item.lineTotal || 0;
          }
        });
      }
    });

    const cData = Object.keys(dailyTotals).map(date => ({
      date: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
      revenue: dailyTotals[date]
    }));

    const tProducts = Object.keys(productCounts)
      .map(name => ({ name, ...productCounts[name] }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 4);

    return {
      todayRevenue: todayRev,
      todayCount: todayCnt,
      avgOrder: todayCnt > 0 ? todayRev / todayCnt : 0,
      chartData: cData,
      topProducts: tProducts
    };
  }, [invoices]);

  if (loading) {
    return <div className="flex justify-center items-center h-[calc(100vh-8rem)]"><Loader2 className="w-10 h-10 animate-spin text-gray-300" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Bakala Administration</h1>
          <p className="text-sm font-medium text-gray-400 mt-1 uppercase tracking-widest">Store Overview & Intelligence</p>
        </div>
        {tenant?.subscription?.hasWeightScaleAddon && (
          <Link 
            to="/app/dashboard/bakala/weight-scale" 
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20 transition-all hover:-translate-y-0.5"
          >
            <Scale className="w-4 h-4" />
            Weight Scale Terminal
            <ArrowRight className="w-4 h-4 ml-1 opacity-50" />
          </Link>
        )}
      </div>

      {/* TOP METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-dark-700 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Today's Revenue</p>
            <h3 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">SAR {todayRevenue.toFixed(2)}</h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-dark-700 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Transactions Today</p>
            <h3 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">{todayCount} <span className="text-xl text-gray-300 font-medium tracking-normal">bills</span></h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-dark-700 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Average Order Value</p>
            <h3 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">SAR {avgOrder.toFixed(2)}</h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* MIDDLE: CHARTS & TOP PRODUCTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-dark-800 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-dark-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">7-Day Revenue Trend</h2>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#111827' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-dark-700">
          <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white mb-6">Top Products</h2>
          <div className="space-y-5">
            {topProducts.length === 0 ? (
              <div className="text-center text-gray-400 py-10">No sales data yet</div>
            ) : topProducts.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-bold text-gray-400">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{p.name}</p>
                    <p className="text-xs font-medium text-gray-400">{p.qty} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-500 text-sm">SAR {p.revenue.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM: DAFTAR & COMPLIANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT: Daftar Ledger */}
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-dark-700 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Daftar Ledger</h2>
          </div>

          <div className="relative mb-6">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Search customer by phone..."
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium"
            />
          </div>

          {!selectedKhata ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-3xl">
              <CreditCard className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">No Khata account found</p>
            </div>
          ) : (
            <div className="flex-1 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[100px] pointer-events-none" />
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <h3 className="font-black text-xl text-gray-900">{selectedKhata.customerId?.name}</h3>
                  <p className="text-sm font-medium text-gray-500">{selectedKhata.customerId?.phone || selectedKhata.customerId?.mobile || 'No phone'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-0.5">Current Balance</p>
                  <p className={`text-3xl font-black tracking-tighter ${selectedKhata.balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    SAR {Math.abs(selectedKhata.balance || 0).toFixed(2)}
                  </p>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mt-1">Limit: SAR {(selectedKhata.creditLimit || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="flex gap-3 mb-8 relative z-10">
                <button className="flex-1 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm">
                  <FileText className="w-4 h-4" /> Statement
                </button>
                <button 
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  onClick={() => {
                    const phone = selectedKhata.customerId?.phone || selectedKhata.customerId?.mobile;
                    if (phone) window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
                  }}>
                  <Send className="w-4 h-4" /> WhatsApp
                </button>
              </div>

              <div className="relative z-10">
                <h4 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-4">Recent Transactions</h4>
                <div className="space-y-3">
                  {khataTransactions.length === 0 ? (
                    <p className="text-sm font-medium text-gray-400 text-center py-4">No recent transactions</p>
                  ) : (
                    khataTransactions.slice(0, 4).map((tx, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3.5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'payment' ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-50 text-gray-500'}`}>
                            {tx.type === 'payment' ? <Wallet className="w-4 h-4"/> : <ShoppingCart className="w-4 h-4"/>}
                          </div>
                          <div>
                            <span className="block font-bold text-gray-900 text-sm tracking-tight">{tx.type === 'payment' ? 'Payment' : 'Purchase'}</span>
                            <span className="block text-[10px] font-medium uppercase tracking-wider text-gray-400">{new Date(tx.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`font-black tracking-tight ${tx.type === 'payment' ? 'text-emerald-500' : 'text-gray-900'}`}>
                            {tx.type === 'payment' ? '+' : '-'} SAR {tx.amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Balady Regulatory Health */}
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-dark-700 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Compliance Center</h2>
            <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Monitoring
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Active Alerts
            </h3>
            
            {alerts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-emerald-500 bg-emerald-50/50 rounded-3xl border border-emerald-100/50 p-8 text-center">
                <ShieldCheck className="w-16 h-16 mb-4 opacity-50" />
                <p className="font-bold text-lg text-emerald-700 mb-1">100% Compliant</p>
                <p className="text-sm font-medium text-emerald-600/70">No documents are expiring within the next 60 days.</p>
              </div>
            ) : (
              <div className="space-y-3 custom-scrollbar overflow-y-auto max-h-[400px] pr-2">
                {alerts.slice(0, 6).map((alert, idx) => (
                  <div key={idx} className={`relative overflow-hidden flex items-center p-4 rounded-2xl border ${alert.isExpired ? 'bg-rose-50/50 border-rose-100' : 'bg-amber-50/50 border-amber-100'}`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${alert.isExpired ? 'bg-rose-500' : 'bg-amber-500'}`} />
                    <div className="flex-1 pl-2">
                      <p className={`font-black text-sm tracking-tight ${alert.isExpired ? 'text-rose-700' : 'text-amber-700'}`}>{alert.documentType}</p>
                      <p className="text-xs font-medium text-gray-600 mt-0.5">{alert.name} {alert.documentNumber ? `(${alert.documentNumber})` : ''}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div className={`px-2 py-1 rounded-md text-[10px] uppercase tracking-widest font-black mb-1 ${alert.isExpired ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {alert.isExpired ? 'EXPIRED' : `${alert.daysRemaining} days left`}
                      </div>
                      <p className="text-[10px] font-bold text-gray-400">{new Date(alert.expiryDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
