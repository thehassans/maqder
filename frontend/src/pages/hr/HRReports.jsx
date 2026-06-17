import { useQuery } from '@tanstack/react-query';
import { Users, TrendingDown, Clock, CalendarDays, PieChart, BarChart3, Activity, Briefcase, Star, PlaneTakeoff } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../lib/api';

export default function HRReports() {
  const { data: report, isLoading } = useQuery({
    queryKey: ['hr-reports'],
    queryFn: () => api.get('/hr/reports').then(r => r.data),
  });

  const stats = report || {};
  const headcount = stats.employees?.total || 0;
  const byDept = stats.employees?.byDepartment || [];
  const openJobs = stats.hiring?.openRequisitions || 0;
  const newCandidates = stats.hiring?.newCandidates || 0;
  const hiredCandidates = stats.hiring?.hiredCandidates || 0;
  const avgRating = stats.performance?.avgRating ? Number(stats.performance.avgRating).toFixed(1) : '0.0';
  const pendingLeaves = (stats.leaves?.byStatus || []).find(s => s._id === 'pending')?.count || 0;
  const approvedLeaves = (stats.leaves?.byStatus || []).find(s => s._id === 'approved')?.count || 0;

  const SUMMARY_CARDS = [
    { title: 'Total Headcount', value: headcount, change: '', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { title: 'Open Jobs', value: openJobs, change: '', icon: Briefcase, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20' },
    { title: 'New Candidates', value: newCandidates, change: '', icon: TrendingDown, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { title: 'Hired', value: hiredCandidates, change: '', icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { title: 'Pending Leaves', value: pendingLeaves, change: '', icon: PlaneTakeoff, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { title: 'Approved Leaves', value: approvedLeaves, change: '', icon: CalendarDays, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { title: 'Avg Rating', value: avgRating, change: '', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ];

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
      {isLoading ? (
        <div className="py-20 text-center text-gray-400"><div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"/></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SUMMARY_CARDS.map((card, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-700">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bg} ${card.color}`}>
                  <card.icon className="w-6 h-6" />
                </div>
                {card.change && <span className={`text-xs font-bold px-2 py-1 rounded-md ${card.change.startsWith('+') ? 'text-green-700 bg-green-100' : card.change.startsWith('-') ? 'text-green-700 bg-green-100' : 'text-gray-700 bg-gray-100'}`}>{card.change}</span>}
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</h3>
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Activity className="w-5 h-5 text-primary-500" /> Headcount & Hiring</h3>
          </div>
          <div className="flex-1 min-h-[250px] bg-gray-50 dark:bg-dark-900/50 rounded-xl flex items-center justify-center border border-dashed border-gray-200 dark:border-dark-700 p-6">
            {isLoading ? <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"/> : (
              <div className="w-full">
                <div className="flex items-end justify-between gap-4 h-[200px]">
                  {(stats.employees?.byStatus || []).map((pt, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-blue-400 rounded-t-md transition-all" style={{ height: `${Math.max(10, (pt.count / Math.max(...(stats.employees?.byStatus || []).map(p => p.count), 1)) * 180)}px` }} />
                      <span className="text-xs text-gray-500">{pt._id || 'Unknown'}</span>
                    </div>
                  ))}
                  {!(stats.employees?.byStatus || []).length && <p className="text-gray-400 font-medium flex items-center gap-2"><BarChart3 className="w-5 h-5" /> No trend data yet</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><PieChart className="w-5 h-5 text-primary-500" /> Employees by Department</h3>
          </div>
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8">
            {isLoading ? <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"/> : (
              <>
                <div className="w-48 h-48 rounded-full border-[16px] border-primary-500 relative flex items-center justify-center">
                  {byDept.slice(1).map((d, i) => (
                    <div key={i} className={`absolute inset-[-16px] rounded-full border-[16px] ${i === 0 ? 'border-blue-400 border-r-transparent border-b-transparent transform rotate-45' : 'border-purple-400 border-l-transparent border-b-transparent transform -rotate-45'}`} />
                  ))}
                  <div className="text-center">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{headcount}</span>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                </div>
                <div className="space-y-4 w-full md:w-auto">
                  {byDept.map((d, i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-primary-500' : i === 1 ? 'bg-blue-400' : 'bg-purple-400'}`} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{d._id || 'Other'}</span>
                      </div>
                      <span className="text-sm font-bold">{d.count}</span>
                    </div>
                  ))}
                  {byDept.length === 0 && <p className="text-sm text-gray-400">No department data yet.</p>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
