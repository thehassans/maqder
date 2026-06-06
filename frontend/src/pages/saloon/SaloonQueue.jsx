import React, { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function SaloonQueue() {
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchOrders = async () => {
    try {
      const res = await api.get('/saloon/orders/kanban');
      setActiveOrders(res.data);
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const nowServing = activeOrders.filter(o => o.status === 'in-progress').slice(0, 4);
  const waiting = activeOrders.filter(o => o.status === 'waiting').slice(0, 12);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl font-light tracking-widest">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Ultra Minimal Header */}
      <header className="px-12 py-8 flex items-center justify-between border-b border-white/10">
        <h1 className="text-4xl font-light tracking-[0.2em] uppercase">Queue</h1>
        <div className="text-2xl font-light tracking-wider opacity-60">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex">
        
        {/* Now Serving Column */}
        <section className="flex-[2] flex flex-col border-r border-white/10">
          <div className="px-12 py-8 border-b border-white/10">
            <h2 className="text-xl font-medium tracking-[0.3em] uppercase text-gray-400">Now Serving</h2>
          </div>
          <div className="flex-1 p-12 flex flex-col gap-8">
            {nowServing.length > 0 ? (
              nowServing.map((order, idx) => (
                <div 
                  key={order._id} 
                  className={`flex items-center justify-between border-b border-white/5 pb-8 ${idx === 0 ? 'opacity-100' : 'opacity-60'} transition-opacity`}
                >
                  <div className="flex items-baseline gap-8">
                    <div className="text-8xl md:text-[120px] font-medium leading-none tabular-nums tracking-tighter">
                      {order.queueNumber || '---'}
                    </div>
                    {order.customerName && (
                      <div className="text-3xl font-light text-gray-400">
                        {order.customerName}
                      </div>
                    )}
                  </div>
                  <div className="text-2xl font-light tracking-widest uppercase border border-white/20 px-6 py-3 rounded-full">
                    Station 1
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center text-4xl text-white/20 font-light tracking-widest">
                WAITING FOR CUSTOMERS
              </div>
            )}
          </div>
        </section>

        {/* Please Wait Column */}
        <section className="flex-1 flex flex-col bg-white/5">
          <div className="px-12 py-8 border-b border-white/10">
            <h2 className="text-xl font-medium tracking-[0.3em] uppercase text-gray-400">Please Wait</h2>
          </div>
          <div className="flex-1 p-12">
            {waiting.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                {waiting.map(order => (
                  <div 
                    key={order._id} 
                    className="flex items-center gap-4 border-b border-white/10 pb-4"
                  >
                    <span className="text-5xl font-light tabular-nums tracking-tight">
                      {order.queueNumber || '---'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xl text-white/20 font-light tracking-widest">
                NO ONE IN QUEUE
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
