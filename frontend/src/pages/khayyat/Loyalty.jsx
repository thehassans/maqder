import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../lib/api';
const t = (key, opts) => opts?.defaultValue || key;

import { Card } from './components/ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td } from './components/ui/Table';
import { Search, Heart, TrendingUp } from 'lucide-react';
import SARIcon from './components/ui/SARIcon';

const Loyalty = () => {
  
  const { user } = useSelector(state => state.auth);
  const { language } = useSelector(state => state.ui);
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({ totalCustomers: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLoyalty();
  }, [search]);

  const fetchLoyalty = async () => {
    try {
      const params = search ? `?search=${search}` : '';
      const response = await api.get(`/khayyat/customers/loyalty${params}`);
      const data = response.data;
      setCustomers(Array.isArray(data) ? data : data.customers || []);
      setStats(data.stats || { totalCustomers: 0, totalSpent: 0 });
    } catch (error) {
      console.error('Error:', error);
      setCustomers([]);
      setStats({ totalCustomers: 0, totalSpent: 0 });
    }
    setLoading(false);
  };

  return (
    <div data-tutorial="page-loyalty" className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <Heart className="w-8 h-8 text-rose-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{(language === 'ar' ? 'ولاء العملاء' : 'Customer Loyalty')}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">{(language === 'ar' ? 'إجمالي المستخدمين' : 'Total Users')}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-slate-100 mt-1">{stats.totalCustomers}</p>
            </div>
            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <Heart className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">{(language === 'ar' ? 'إجمالي الإنفاق' : 'All Time Spending')}</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1 flex items-center gap-1">{stats.totalSpent?.toLocaleString() || 0} <SARIcon className="w-6 h-6" /></p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={(language === 'ar' ? 'البحث برقم الهاتف أو الاسم' : 'Search by phone or name')}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </Card>

      {/* Top Customers */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className="font-semibold text-gray-900 dark:text-slate-100">{(language === 'ar' ? 'أفضل العملاء' : 'Top Customers')}</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        ) : customers.length > 0 ? (
          <Table>
            <Thead>
              <Tr>
                <Th>#</Th>
                <Th>{(language === 'ar' ? 'الاسم' : 'Name')}</Th>
                <Th>{(language === 'ar' ? 'رقم الجوال' : 'Phone Number')}</Th>
                <Th>{(language === 'ar' ? 'عدد الطلبات' : 'Order Count')}</Th>
                <Th>{(language === 'ar' ? 'إجمالي المصروف' : 'Total Spent')}</Th>
                <Th>{(language === 'ar' ? 'نقاط الولاء' : 'Loyalty Points')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {customers.map((customer, index) => (
                <Tr
                  key={customer._id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/user/customers/${customer._id}`)}
                >
                  <Td>
                    <span className={`
                      inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                      ${index === 0 ? 'bg-amber-100 text-amber-700' : 
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500'}
                    `}>
                      {index + 1}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center">
                        <span className="text-rose-700 dark:text-rose-200 font-medium">{customer.name?.charAt(0)}</span>
                      </div>
                      <span className="font-medium underline underline-offset-4">{customer.name}</span>
                    </div>
                  </Td>
                  <Td>{customer.phone}</Td>
                  <Td>{customer.totalOrders || 0}</Td>
                  <Td className="font-medium text-emerald-600 flex items-center gap-1">{customer.totalSpent || 0} <SARIcon className="w-3 h-3" /></Td>
                  <Td>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-200 rounded-full text-sm">
                      <Heart className="w-3 h-3" />
                      {customer.loyaltyPoints || 0}
                    </span>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <div className="p-12 text-center text-gray-500 dark:text-slate-400">{(language === 'ar' ? 'لا توجد بيانات' : 'No data available')}</div>
        )}
      </Card>
    </div>
  );
};

export default Loyalty;




