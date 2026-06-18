import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Wrench, Car, ClipboardList, Package, TrendingUp,
  Clock, CheckCircle, AlertTriangle, Plus
} from 'lucide-react'
import api from '../../lib/api'

const STAT_CARDS = [
  { key: 'activeJobs', label: 'Active Job Cards', icon: ClipboardList, color: 'bg-blue-500' },
  { key: 'pendingApproval', label: 'Pending Approval', icon: Clock, color: 'bg-amber-500' },
  { key: 'readyPickup', label: 'Ready for Pickup', icon: CheckCircle, color: 'bg-green-500' },
  { key: 'lowStock', label: 'Low Stock Items', icon: AlertTriangle, color: 'bg-red-500' },
]

export default function WorkshopDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['workshop-stats'],
    queryFn: async () => {
      const [jobs, inventory] = await Promise.all([
        api.get('/workshop/job-cards').then(r => r.data),
        api.get('/workshop/inventory').then(r => r.data),
      ])
      return {
        activeJobs: jobs.filter(j => ['checkin','legal_verification','estimation','in_progress','waiting_parts','quality_control'].includes(j.status)).length,
        pendingApproval: jobs.filter(j => j.status === 'waiting_approval').length,
        readyPickup: jobs.filter(j => j.status === 'ready_pickup').length,
        lowStock: inventory.filter(i => i.quantityOnHand <= i.reorderLevel).length,
        recentJobs: jobs.slice(0, 5),
      }
    },
  })

  const values = {
    activeJobs: stats?.activeJobs ?? 0,
    pendingApproval: stats?.pendingApproval ?? 0,
    readyPickup: stats?.readyPickup ?? 0,
    lowStock: stats?.lowStock ?? 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workshop Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of your service center operations</p>
        </div>
        <a href="#/app/workshop/job-cards/new" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Job Card
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-dark-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-dark-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{values[card.key]}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg text-white`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700">
          <div className="p-5 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Job Cards</h3>
            <a href="#/app/workshop/job-cards" className="text-sm text-primary-600 hover:underline">View All</a>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-dark-700">
            {(stats?.recentJobs ?? []).map(job => (
              <div key={job._id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    job.status === 'in_progress' ? 'bg-blue-500' :
                    job.status === 'ready_pickup' ? 'bg-green-500' :
                    job.status === 'waiting_approval' ? 'bg-amber-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{job.jobCardNumber}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{job.status.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{job.grandTotal?.toFixed?.(2) ?? '0.00'} SAR</span>
              </div>
            ))}
            {(!stats?.recentJobs || stats.recentJobs.length === 0) && (
              <div className="p-8 text-center text-gray-400 text-sm">No job cards yet</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700">
          <div className="p-5 border-b border-gray-100 dark:border-dark-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
          </div>
          <div className="p-4 space-y-2">
            <QuickAction href="#/app/workshop/job-cards/new" icon={Wrench} label="Create Job Card" color="bg-blue-50 text-blue-600 dark:bg-blue-900/20" />
            <QuickAction href="#/app/workshop/vehicles/new" icon={Car} label="Register Vehicle" color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" />
            <QuickAction href="#/app/workshop/inventory" icon={Package} label="Check Inventory" color="bg-purple-50 text-purple-600 dark:bg-purple-900/20" />
            <QuickAction href="#/app/invoices/create/sell" icon={TrendingUp} label="Create Invoice" color="bg-orange-50 text-orange-600 dark:bg-orange-900/20" />
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickAction({ href, icon: Icon, label, color }) {
  return (
    <a href={href} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
    </a>
  )
}
