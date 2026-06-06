import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../lib/translations';
import { Scissors, CalendarCheck, Users, Banknote, TrendingUp, Sparkles, Clock, CalendarDays } from 'lucide-react';
import api from '../../lib/api';

export default function SaloonDashboard() {
  const { language } = useSelector((state) => state.ui);
  const { tenant } = useSelector((state) => state.auth);
  const { t } = useTranslation(language);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    activeTickets: 0,
    totalServices: 0,
    recentOrders: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetching all orders and services to calculate metrics
      const [ordersRes, servicesRes] = await Promise.all([
        api.get('/saloon/orders'),
        api.get('/saloon/services')
      ]);

      const orders = ordersRes.data?.orders || [];
      const services = Array.isArray(servicesRes.data) ? servicesRes.data : (servicesRes.data?.services || []);

      // Calculate today's metrics
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
      const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
      const activeTickets = orders.filter(o => o.status === 'in_progress' || o.status === 'pending');

      setMetrics({
        todayRevenue,
        todayOrders: todayOrders.length,
        activeTickets: activeTickets.length,
        totalServices: services.length,
        recentOrders: orders.slice(0, 5)
      });
    } catch (error) {
      console.error('Failed to load saloon dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, gradientClass }) => (
    <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 p-6 shadow-sm group">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${gradientClass} opacity-10 blur-2xl group-hover:scale-150 transition-transform duration-700`} />
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">{value}</h3>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-medium ${colorClass}`}>{subtitle}</span>
          </div>
        </div>
        <div className={`p-3 rounded-2xl ${gradientClass} text-white shadow-lg`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'ar' ? 'لوحة تحكم الصالون' : 'Saloon Dashboard'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {language === 'ar' ? 'نظرة عامة على أداء الصالون الخاص بك' : 'Overview of your saloon performance'}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={language === 'ar' ? 'إيرادات اليوم' : "Today's Revenue"}
          value={`${metrics.todayRevenue.toFixed(2)} ﷼`}
          subtitle={language === 'ar' ? 'إجمالي المبيعات اليوم' : 'Total sales today'}
          icon={Banknote}
          colorClass="text-emerald-500"
          gradientClass="bg-gradient-to-br from-emerald-400 to-emerald-600"
        />
        <StatCard
          title={language === 'ar' ? 'طلبات اليوم' : "Today's Orders"}
          value={metrics.todayOrders}
          subtitle={language === 'ar' ? 'العملاء الذين تمت خدمتهم' : 'Customers served today'}
          icon={Users}
          colorClass="text-blue-500"
          gradientClass="bg-gradient-to-br from-blue-400 to-blue-600"
        />
        <StatCard
          title={language === 'ar' ? 'التذاكر النشطة' : 'Active Tickets'}
          value={metrics.activeTickets}
          subtitle={language === 'ar' ? 'في الانتظار أو قيد التنفيذ' : 'Waiting or in progress'}
          icon={Clock}
          colorClass="text-orange-500"
          gradientClass="bg-gradient-to-br from-orange-400 to-orange-600"
        />
        <StatCard
          title={language === 'ar' ? 'إجمالي الخدمات' : 'Total Services'}
          value={metrics.totalServices}
          subtitle={language === 'ar' ? 'في قائمة الخدمات' : 'In service catalog'}
          icon={Scissors}
          colorClass="text-purple-500"
          gradientClass="bg-gradient-to-br from-purple-400 to-purple-600"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {language === 'ar' ? 'أحدث الطلبات' : 'Recent Orders'}
            </h3>
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 dark:bg-dark-700 rounded-2xl" />
                ))}
              </div>
            ) : metrics.recentOrders.length > 0 ? (
              <div className="space-y-4">
                {metrics.recentOrders.map((order) => (
                  <div key={order._id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-dark-900/50 border border-gray-100 dark:border-dark-700">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <span className="font-bold">#{order.orderNumber?.slice(-4) || '---'}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {order.customerName || (language === 'ar' ? 'عميل عام' : 'Walk-in Customer')}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <CalendarDays className="w-3 h-3" />
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">{order.grandTotal?.toFixed(2)} ﷼</p>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                        order.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        order.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      }`}>
                        {order.status || 'PENDING'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Scissors className="w-12 h-12 mx-auto text-gray-300 dark:text-dark-600 mb-3" />
                <p>{language === 'ar' ? 'لا توجد طلبات حديثة' : 'No recent orders'}</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white relative overflow-hidden h-full shadow-lg">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="relative z-10 flex flex-col h-full">
              <Sparkles className="w-8 h-8 text-white/80 mb-6" />
              <h3 className="text-2xl font-bold mb-2">
                {language === 'ar' ? 'هل أنت مستعد ليوم مزدحم؟' : 'Ready for a busy day?'}
              </h3>
              <p className="text-white/80 mb-8 leading-relaxed">
                {language === 'ar' 
                  ? 'أدر خدمات صالونك وحجوزاتك ونقاط البيع الخاصة بك بكفاءة من خلال هذا النظام المتكامل.' 
                  : 'Manage your saloon services, bookings, and POS efficiently with this all-in-one system.'}
              </p>
              
              <div className="mt-auto bg-black/20 backdrop-blur-md rounded-2xl p-5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80">{language === 'ar' ? 'أداء اليوم' : "Today's Performance"}</span>
                  <TrendingUp className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black">{metrics.todayOrders}</span>
                  <span className="text-sm text-white/60 mb-1">{language === 'ar' ? 'العملاء' : 'Customers'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
