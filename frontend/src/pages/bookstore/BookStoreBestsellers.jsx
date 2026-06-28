import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, BookOpen, Users, Tag, Loader2, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../lib/api';

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#3b82f6', '#a855f7', '#14b8a6'];

export default function BookStoreBestsellers() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get('/bookstore/reports/bestsellers', { params });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load bestseller report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const genreChartData = (data?.byGenre || []).slice(0, 10).map(g => ({ name: g._id, sold: g.totalSold, revenue: g.revenue }));
  const authorChartData = (data?.byAuthor || []).slice(0, 10).map(a => ({ name: a._id, sold: a.totalSold }));
  const productData = data?.byProduct || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/app/dashboard/bookstore/dashboard" className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Bestseller Report</h1>
          <p className="text-sm text-gray-400">Sales breakdown by genre, author, and product</p>
        </div>
      </div>

      {/* Date filter */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="label">Start Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input pl-10" />
            </div>
          </div>
          <div className="flex-1">
            <label className="label">End Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input pl-10" />
            </div>
          </div>
          <button
            onClick={fetchReport}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors"
          >
            Apply Filter
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="w-10 h-10 animate-spin text-gray-300" /></div>
      ) : !data ? (
        <div className="text-center text-gray-400 py-16">No data available</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Top Genre</p>
                <h3 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">{data.byGenre[0]?._id || '—'}</h3>
                <p className="text-sm text-gray-400">{data.byGenre[0]?.totalSold || 0} copies sold</p>
              </div>
              <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center"><Tag className="w-6 h-6" /></div>
            </div>
            <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Top Author</p>
                <h3 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">{data.byAuthor[0]?._id || '—'}</h3>
                <p className="text-sm text-gray-400">{data.byAuthor[0]?.totalSold || 0} copies sold</p>
              </div>
              <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center"><Users className="w-6 h-6" /></div>
            </div>
            <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Best Seller</p>
                <h3 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white line-clamp-1">{data.byProduct[0]?._id || '—'}</h3>
                <p className="text-sm text-gray-400">{data.byProduct[0]?.totalSold || 0} copies sold</p>
              </div>
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center"><TrendingUp className="w-6 h-6" /></div>
            </div>
          </div>

          {/* Genre chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-dark-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Sales by Genre</h2>
              {genreChartData.length === 0 ? (
                <p className="text-center text-gray-400 py-10">No data</p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={genreChartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} width={80} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="sold" fill="#6366f1" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-dark-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Genre Distribution</h2>
              {genreChartData.length === 0 ? (
                <p className="text-center text-gray-400 py-10">No data</p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={genreChartData} dataKey="sold" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => e.name}>
                        {genreChartData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Top authors table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-dark-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Top Authors</h2>
              <div className="space-y-3">
                {(data.byAuthor || []).slice(0, 10).map((a, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center font-bold text-sm">#{idx + 1}</div>
                      <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white">{a._id}</p>
                        <p className="text-xs text-gray-400">{a.count} transactions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-purple-600">{a.totalSold} copies</p>
                      <p className="text-xs text-gray-400">SAR {Number(a.revenue || 0).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-dark-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Top Products</h2>
              <div className="space-y-3">
                {productData.slice(0, 10).map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center font-bold text-sm">#{idx + 1}</div>
                      <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{p._id}</p>
                        <p className="text-xs text-gray-400">{p.count} transactions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-emerald-600">{p.totalSold} copies</p>
                      <p className="text-xs text-gray-400">SAR {Number(p.revenue || 0).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
