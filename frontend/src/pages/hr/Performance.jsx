import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Target, Award, TrendingUp, AlertCircle, ChevronRight, CheckCircle2 } from 'lucide-react';

const MOCK_GOALS = [
  { id: 1, employee: 'Ahmed Ali', title: 'Increase Sales by 15%', progress: 75, deadline: '2024-12-31', status: 'On Track' },
  { id: 2, employee: 'Sara Khalid', title: 'Complete Leadership Training', progress: 100, deadline: '2024-06-01', status: 'Completed' },
  { id: 3, employee: 'Mohammed Sami', title: 'Launch New ERP Module', progress: 30, deadline: '2024-08-15', status: 'At Risk' },
];

const MOCK_REVIEWS = [
  { id: 1, employee: 'Ahmed Ali', period: 'Q2 2024', rating: 4.5, manager: 'Khalid Abdullah', date: '2024-06-10' },
  { id: 2, employee: 'Sara Khalid', period: 'Q2 2024', rating: 5.0, manager: 'Khalid Abdullah', date: '2024-06-12' },
  { id: 3, employee: 'Mohammed Sami', period: 'Q1 2024', rating: 3.5, manager: 'Khalid Abdullah', date: '2024-03-15' },
];

export default function Performance() {
  const [activeTab, setActiveTab] = useState('goals');

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Performance Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track employee goals, appraisals, and overall performance.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-sm transition-colors font-medium">
          <Plus className="w-4 h-4" />
          {activeTab === 'goals' ? 'Set New Goal' : 'Start Review'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-dark-800 p-1 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 w-fit">
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeTab === 'goals' 
              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm' 
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Target className="w-4 h-4" />
          Goals & OKRs
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeTab === 'reviews' 
              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm' 
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          Performance Reviews
        </button>
      </div>

      {activeTab === 'goals' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {MOCK_GOALS.map((goal) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 group cursor-pointer hover:border-primary-300 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{goal.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Assigned to <span className="font-medium text-gray-700 dark:text-gray-300">{goal.employee}</span></p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  goal.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                  goal.status === 'At Risk' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' :
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
                }`}>
                  {goal.status === 'Completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                   goal.status === 'At Risk' ? <AlertCircle className="w-3.5 h-3.5" /> : 
                   <TrendingUp className="w-3.5 h-3.5" />}
                  {goal.status}
                </span>
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Progress</span>
                  <span className="font-bold text-primary-600 dark:text-primary-400">{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-dark-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      goal.progress === 100 ? 'bg-green-500' : 'bg-primary-500'
                    }`} 
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 dark:border-dark-700">
                <span className="text-xs text-gray-400">Deadline: {goal.deadline}</span>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-dark-900/50 border-b border-gray-100 dark:border-dark-700">
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Review Period</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Manager</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
              {MOCK_REVIEWS.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors">
                  <td className="py-4 px-6 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    {review.employee}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {review.period}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{review.rating}</span>
                      <span className="text-sm text-gray-400">/ 5.0</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {review.manager}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500">
                    {review.date}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-right">
                    <button className="text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline">
                      View Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
