import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, CalendarDays, CheckCircle2, XCircle, Clock, MoreVertical, PlaneTakeoff, ShieldAlert } from 'lucide-react';

const LEAVE_BALANCES = [
  { type: 'Annual Leave', total: 21, used: 14, icon: PlaneTakeoff, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { type: 'Sick Leave', total: 10, used: 2, icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  { type: 'Personal Leave', total: 5, used: 0, icon: CalendarDays, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
];

const LEAVE_REQUESTS = [
  { id: 1, employee: 'Ali Hassan', avatar: 'https://i.pravatar.cc/150?u=11', type: 'Annual Leave', startDate: '2024-07-01', endDate: '2024-07-10', days: 10, status: 'Approved', reason: 'Family vacation' },
  { id: 2, employee: 'Sarah Ahmed', avatar: 'https://i.pravatar.cc/150?u=22', type: 'Sick Leave', startDate: '2024-06-15', endDate: '2024-06-16', days: 2, status: 'Pending', reason: 'Fever and cold' },
  { id: 3, employee: 'Mohammed Sami', avatar: 'https://i.pravatar.cc/150?u=33', type: 'Personal Leave', startDate: '2024-06-20', endDate: '2024-06-20', days: 1, status: 'Rejected', reason: 'Personal errands' },
  { id: 4, employee: 'Noura Youssef', avatar: 'https://i.pravatar.cc/150?u=44', type: 'Annual Leave', startDate: '2024-08-01', endDate: '2024-08-05', days: 5, status: 'Pending', reason: 'Traveling' },
];

export default function Leaves() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredRequests = LEAVE_REQUESTS.filter(req => 
    (filterStatus === 'All' || req.status === filterStatus) &&
    req.employee.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leaves & Time Off</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage employee leave requests and balances.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-sm transition-colors font-medium">
          <Plus className="w-4 h-4" />
          Request Leave
        </button>
      </div>

      {/* Leave Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {LEAVE_BALANCES.map((balance, idx) => (
          <div key={idx} className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full ${balance.bg} ${balance.color} flex items-center justify-center`}>
              <balance.icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{balance.type}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{balance.total - balance.used}</span>
                <span className="text-sm text-gray-500">days left</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-dark-700 h-1.5 rounded-full mt-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${balance.color.replace('text-', 'bg-')}`} 
                  style={{ width: `${(balance.used / balance.total) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>{balance.used} Used</span>
                <span>{balance.total} Total</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Requests Section */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-dark-700 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Requests</h2>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-dark-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-50 dark:bg-dark-900 border-none rounded-xl text-sm py-2 px-4 focus:ring-2 focus:ring-primary-500/20 text-gray-700 dark:text-gray-300 outline-none"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-dark-900/50">
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Leave Type</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors">
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img src={req.avatar} alt={req.employee} className="w-8 h-8 rounded-full bg-gray-100 object-cover" />
                      <span className="font-medium text-gray-900 dark:text-white">{req.employee}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{req.type}</span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{req.startDate} to {req.endDate}</div>
                    <div className="text-xs text-gray-500">{req.days} days</div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs block">{req.reason}</span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      req.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      req.status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {req.status === 'Approved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                       req.status === 'Rejected' ? <XCircle className="w-3.5 h-3.5" /> : 
                       <Clock className="w-3.5 h-3.5" />}
                      {req.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-right">
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredRequests.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              No leave requests found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
