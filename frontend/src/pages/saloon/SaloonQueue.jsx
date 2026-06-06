import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Monitor, Bell } from 'lucide-react';

export default function SaloonQueue() {
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/saloon/orders/kanban');
      // The kanban endpoint returns an array of waiting and in_progress orders directly
      setActiveOrders(res.data);
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Poll every 10 seconds
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const nowServing = activeOrders.filter(o => o.status === 'in-progress').slice(0, 4);
  const waiting = activeOrders.filter(o => o.status === 'waiting').slice(0, 10);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-gray-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white dark:bg-dark-800 shadow-sm px-8 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Monitor className="w-10 h-10 text-amber-500" />
          <h1 className="text-4xl font-bold tracking-tight">Queue Status</h1>
        </div>
        <div className="flex items-center space-x-3 text-amber-500">
          <Bell className="w-8 h-8 animate-pulse" />
          <span className="text-2xl font-semibold">{new Date().toLocaleTimeString()}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex p-8 gap-8">
        
        {/* Now Serving Column */}
        <section className="flex-[2] bg-white dark:bg-dark-800 rounded-3xl shadow-xl overflow-hidden border border-amber-100 dark:border-amber-900/30 flex flex-col">
          <div className="bg-amber-500 p-6 text-center">
            <h2 className="text-5xl font-black text-white uppercase tracking-widest">Now Serving</h2>
          </div>
          <div className="flex-1 p-8 flex flex-col gap-6 bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-900/10">
            {nowServing.length > 0 ? (
              nowServing.map((order, idx) => (
                <div 
                  key={order._id} 
                  className={`flex items-center justify-between bg-white dark:bg-dark-700 rounded-2xl p-8 shadow-lg border-2 border-amber-500/20 ${idx === 0 ? 'scale-105 border-amber-500 shadow-amber-500/20' : ''} transition-all`}
                >
                  <div className="text-8xl font-black text-gray-900 dark:text-white tabular-nums tracking-tighter">
                    {order.queueNumber || '---'}
                  </div>
                  {order.customerName && (
                    <div className="text-3xl text-gray-500 dark:text-gray-400 font-medium">
                      {order.customerName}
                    </div>
                  )}
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-6 py-3 rounded-xl">
                    Station 1
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center text-4xl text-gray-400 dark:text-gray-600 font-medium italic">
                Waiting for customers...
              </div>
            )}
          </div>
        </section>

        {/* Please Wait Column */}
        <section className="flex-1 bg-white dark:bg-dark-800 rounded-3xl shadow-lg overflow-hidden border border-gray-100 dark:border-dark-700 flex flex-col">
          <div className="bg-gray-100 dark:bg-dark-700 p-6 text-center border-b border-gray-200 dark:border-dark-600">
            <h2 className="text-4xl font-bold text-gray-600 dark:text-gray-300">Please Wait</h2>
          </div>
          <div className="flex-1 p-8">
            {waiting.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {waiting.map(order => (
                  <div 
                    key={order._id} 
                    className="bg-gray-50 dark:bg-dark-900 rounded-xl p-6 text-center shadow-sm border border-gray-100 dark:border-dark-700"
                  >
                    <span className="text-5xl font-bold text-gray-700 dark:text-gray-200 tabular-nums">
                      {order.queueNumber || '---'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-2xl text-gray-400">
                No one in queue
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
