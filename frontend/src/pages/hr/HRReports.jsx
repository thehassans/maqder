import { Users, TrendingDown, Clock, CalendarDays, PieChart, BarChart3, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const SUMMARY_CARDS = [
  { title: 'Total Headcount', value: '124', change: '+12%', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { title: 'Turnover Rate', value: '2.4%', change: '-0.5%', icon: TrendingDown, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  { title: 'Avg Time to Hire', value: '18 Days', change: '-2 Days', icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { title: 'Absenteeism Rate', value: '1.2%', change: '+0.1%', icon: CalendarDays, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
];

export default function HRReports() {
  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HR Analytics & Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Key metrics and insights across your organization.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-sm transition-colors font-medium">
          Download PDF Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {SUMMARY_CARDS.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bg} ${card.color}`}>
                <card.icon className="w-6 h-6" />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                card.change.startsWith('+') && card.title !== 'Turnover Rate' && card.title !== 'Absenteeism Rate' 
                  ? 'text-green-700 bg-green-100' 
                  : card.change.startsWith('-') && (card.title === 'Turnover Rate' || card.title === 'Avg Time to Hire')
                  ? 'text-green-700 bg-green-100'
                  : 'text-red-700 bg-red-100'
              }`}>
                {card.change}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Charts Section (Mocked UI) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Headcount Chart Mock */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-500" /> Headcount Growth
            </h3>
            <select className="bg-gray-50 dark:bg-dark-900 border-none rounded-xl text-sm py-1.5 px-3">
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="flex-1 min-h-[250px] bg-gray-50 dark:bg-dark-900/50 rounded-xl flex items-center justify-center border border-dashed border-gray-200 dark:border-dark-700 relative overflow-hidden p-6">
             <div className="absolute inset-0 flex items-end justify-between px-10 pb-10 opacity-40">
               <div className="w-8 bg-blue-400 rounded-t-md h-[40%]" />
               <div className="w-8 bg-blue-400 rounded-t-md h-[50%]" />
               <div className="w-8 bg-blue-400 rounded-t-md h-[45%]" />
               <div className="w-8 bg-blue-400 rounded-t-md h-[65%]" />
               <div className="w-8 bg-blue-400 rounded-t-md h-[80%]" />
               <div className="w-8 bg-blue-500 rounded-t-md h-[95%]" />
             </div>
             <p className="text-gray-400 font-medium z-10 flex items-center gap-2 bg-white/80 dark:bg-dark-800/80 px-4 py-2 rounded-xl shadow-sm backdrop-blur-sm">
               <BarChart3 className="w-5 h-5" /> Chart Data Placeholder
             </p>
          </div>
        </div>

        {/* Department Breakdown Mock */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary-500" /> Employees by Department
            </h3>
          </div>
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="w-48 h-48 rounded-full border-[16px] border-primary-500 relative flex items-center justify-center">
               <div className="absolute inset-[-16px] rounded-full border-[16px] border-blue-400 border-r-transparent border-b-transparent transform rotate-45" />
               <div className="absolute inset-[-16px] rounded-full border-[16px] border-purple-400 border-l-transparent border-b-transparent transform -rotate-45" />
               <div className="text-center">
                 <span className="text-3xl font-bold text-gray-900 dark:text-white">124</span>
                 <p className="text-xs text-gray-500">Total</p>
               </div>
            </div>
            
            <div className="space-y-4 w-full md:w-auto">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Engineering</span>
                </div>
                <span className="text-sm font-bold">45%</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sales</span>
                </div>
                <span className="text-sm font-bold">30%</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">HR & Admin</span>
                </div>
                <span className="text-sm font-bold">25%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
