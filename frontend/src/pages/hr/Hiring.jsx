import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, MoreVertical, Briefcase, Users, Calendar, Mail, Phone, ExternalLink } from 'lucide-react';

const MOCK_JOBS = [
  { id: 1, title: 'Senior React Developer', department: 'Engineering', location: 'Riyadh', type: 'Full-time', status: 'Active', applicants: 24, postedDate: '2024-05-10' },
  { id: 2, title: 'HR Manager', department: 'Human Resources', location: 'Jeddah', type: 'Full-time', status: 'Active', applicants: 12, postedDate: '2024-05-15' },
  { id: 3, title: 'Sales Executive', department: 'Sales', location: 'Dammam', type: 'Full-time', status: 'Closed', applicants: 45, postedDate: '2024-04-20' },
];

const MOCK_CANDIDATES = {
  applied: [
    { id: 101, name: 'Ahmad Al-Ghamdi', role: 'Senior React Developer', experience: '5 years', date: '2024-06-01', avatar: 'https://i.pravatar.cc/150?u=101' },
    { id: 102, name: 'Sara Khalid', role: 'HR Manager', experience: '8 years', date: '2024-06-03', avatar: 'https://i.pravatar.cc/150?u=102' },
  ],
  interviewing: [
    { id: 103, name: 'Mohammed Ali', role: 'Senior React Developer', experience: '4 years', date: '2024-05-28', avatar: 'https://i.pravatar.cc/150?u=103' },
  ],
  offered: [
    { id: 104, name: 'Fahad Al-Saud', role: 'Sales Executive', experience: '6 years', date: '2024-05-20', avatar: 'https://i.pravatar.cc/150?u=104' },
  ],
  hired: [
    { id: 105, name: 'Noura Youssef', role: 'Sales Executive', experience: '3 years', date: '2024-05-10', avatar: 'https://i.pravatar.cc/150?u=105' },
  ],
};

export default function Hiring() {
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' | 'candidates'
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recruitment & Hiring</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage job postings and track candidates through the pipeline.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-sm transition-colors font-medium">
          <Plus className="w-4 h-4" />
          {activeTab === 'jobs' ? 'Post New Job' : 'Add Candidate'}
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-dark-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700">
        <div className="flex w-full sm:w-auto p-1 bg-gray-50 dark:bg-dark-900 rounded-xl">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'jobs' 
                ? 'bg-white dark:bg-dark-700 text-primary-600 dark:text-primary-400 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Job Postings
          </button>
          <button
            onClick={() => setActiveTab('candidates')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'candidates' 
                ? 'bg-white dark:bg-dark-700 text-primary-600 dark:text-primary-400 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Candidate Pipeline
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto px-2 sm:px-0">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-dark-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-xl transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'jobs' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {MOCK_JOBS.map((job) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  job.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-gray-400'
                }`}>
                  {job.status}
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 transition-colors">{job.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{job.department}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {job.type}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Users className="w-4 h-4 text-gray-400" />
                  {job.applicants} Applicants
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-dark-700">
                <span className="text-xs text-gray-400">Posted on {job.postedDate}</span>
                <button className="text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline flex items-center gap-1">
                  View Details <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar">
          {Object.entries(MOCK_CANDIDATES).map(([stage, candidates]) => (
            <div key={stage} className="min-w-[320px] w-[320px] flex-shrink-0 flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-semibold text-gray-900 dark:text-white uppercase text-sm tracking-wider flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    stage === 'applied' ? 'bg-blue-500' :
                    stage === 'interviewing' ? 'bg-yellow-500' :
                    stage === 'offered' ? 'bg-purple-500' : 'bg-green-500'
                  }`} />
                  {stage}
                </h3>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-dark-700 px-2 py-0.5 rounded-full">
                  {candidates.length}
                </span>
              </div>
              
              <div className="flex flex-col gap-3">
                {candidates.map((candidate) => (
                  <motion.div
                    key={candidate.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-dark-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700 cursor-pointer hover:border-primary-300 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <img src={candidate.avatar} alt={candidate.name} className="w-10 h-10 rounded-full bg-gray-100 object-cover" />
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{candidate.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{candidate.role}</p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600"><MoreVertical className="w-4 h-4" /></button>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-4">
                      <span>Exp: {candidate.experience}</span>
                      <span>{candidate.date}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
