import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Plus, Search, Filter, MoreVertical, Briefcase, Users, Calendar,
  ExternalLink, X, Save, Trash2, MapPin, Star, Phone, Mail,
  UserCheck, UserX, ArrowRight
} from 'lucide-react';
import api from '../../lib/api';

const STAGES = ['new', 'screening', 'interview', 'offer', 'hired', 'rejected'];
const STAGE_DOTS = {
  new: 'bg-gray-400', screening: 'bg-blue-500', interview: 'bg-amber-500',
  offer: 'bg-purple-500', hired: 'bg-green-500', rejected: 'bg-red-500',
};
const STATUS_OPTS = ['draft', 'open', 'on_hold', 'closed', 'filled'];
const PRIORITY_OPTS = ['low', 'medium', 'high', 'urgent'];
const SOURCE_OPTS = ['career_site', 'referral', 'linkedin', 'indeed', 'social_media', 'agency', 'walk_in', 'other'];
const TYPE_OPTS = ['full_time', 'part_time', 'contract', 'internship'];

function initJobForm(job) {
  if (!job) return { requisitionId: '', title: '', titleAr: '', department: '', position: '', employmentType: 'full_time', location: '', vacancies: 1, salaryMin: '', salaryMax: '', description: '', requirements: '', status: 'draft', priority: 'medium', postedDate: '', closingDate: '' };
  return { requisitionId: job.requisitionId || '', title: job.title || '', titleAr: job.titleAr || '', department: job.department || '', position: job.position || '', employmentType: job.employmentType || 'full_time', location: job.location || '', vacancies: job.vacancies || 1, salaryMin: job.salaryMin || '', salaryMax: job.salaryMax || '', description: job.description || '', requirements: job.requirements || '', status: job.status || 'draft', priority: job.priority || 'medium', postedDate: job.postedDate ? job.postedDate.slice(0, 10) : '', closingDate: job.closingDate ? job.closingDate.slice(0, 10) : '' };
}
function initCandForm(cand, jobId = '') {
  if (!cand) return { jobRequisitionId: jobId, firstName: '', lastName: '', email: '', phone: '', nationality: '', source: 'other', stage: 'new', rating: '', resumeUrl: '', coverLetter: '', notes: '', interviewDate: '', offerSalary: '' };
  return { jobRequisitionId: cand.jobRequisitionId || jobId, firstName: cand.firstName || '', lastName: cand.lastName || '', email: cand.email || '', phone: cand.phone || '', nationality: cand.nationality || '', source: cand.source || 'other', stage: cand.stage || 'new', rating: cand.rating || '', resumeUrl: cand.resumeUrl || '', coverLetter: cand.coverLetter || '', notes: cand.notes || '', interviewDate: cand.interviewDate ? cand.interviewDate.slice(0, 10) : '', offerSalary: cand.offerSalary || '' };
}

export default function Hiring() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('jobs');
  const [search, setSearch] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobForm, setJobForm] = useState(initJobForm());
  const [showCandModal, setShowCandModal] = useState(false);
  const [editingCand, setEditingCand] = useState(null);
  const [candForm, setCandForm] = useState(initCandForm());
  const [candJobFilter, setCandJobFilter] = useState('');

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['hr-requisitions', search, jobFilter],
    queryFn: () => api.get('/hr/requisitions', { params: { search, status: jobFilter } }).then(r => r.data),
  });
  const { data: candidates, isLoading: candsLoading } = useQuery({
    queryKey: ['hr-candidates', candJobFilter],
    queryFn: () => api.get('/hr/candidates', { params: { jobRequisitionId: candJobFilter } }).then(r => r.data),
  });

  const jobMut = useMutation({
    mutationFn: (payload) => editingJob ? api.put(`/hr/requisitions/${editingJob._id}`, payload) : api.post('/hr/requisitions', payload),
    onSuccess: () => { toast.success(editingJob ? 'Updated' : 'Created'); qc.invalidateQueries({ queryKey: ['hr-requisitions'] }); closeJobModal(); },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });
  const delJobMut = useMutation({
    mutationFn: (id) => api.delete(`/hr/requisitions/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['hr-requisitions'] }); },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });
  const candMut = useMutation({
    mutationFn: (payload) => editingCand ? api.put(`/hr/candidates/${editingCand._id}`, payload) : api.post('/hr/candidates', payload),
    onSuccess: () => { toast.success(editingCand ? 'Updated' : 'Created'); qc.invalidateQueries({ queryKey: ['hr-candidates'] }); closeCandModal(); },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });
  const delCandMut = useMutation({
    mutationFn: (id) => api.delete(`/hr/candidates/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['hr-candidates'] }); },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });
  const moveCandMut = useMutation({
    mutationFn: ({ id, stage }) => api.put(`/hr/candidates/${id}`, { stage }),
    onSuccess: () => { toast.success('Stage updated'); qc.invalidateQueries({ queryKey: ['hr-candidates'] }); },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const openJobModal = (job = null) => { setEditingJob(job); setJobForm(initJobForm(job)); setShowJobModal(true); };
  const closeJobModal = () => { setShowJobModal(false); setEditingJob(null); };
  const openCandModal = (cand = null) => { setEditingCand(cand); setCandForm(initCandForm(cand, candJobFilter)); setShowCandModal(true); };
  const closeCandModal = () => { setShowCandModal(false); setEditingCand(null); };

  const candidatesByStage = STAGES.reduce((acc, s) => { acc[s] = (candidates || []).filter(c => c.stage === s); return acc; }, {});
  const nextStage = (stage) => { const i = STAGES.indexOf(stage); return i >= 0 && i < STAGES.length - 2 ? STAGES[i + 1] : null; };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recruitment & Hiring</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage job postings and track candidates through the pipeline.</p>
        </div>
        <button onClick={() => activeTab === 'jobs' ? openJobModal() : openCandModal()} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-sm transition-colors font-medium">
          <Plus className="w-4 h-4" />
          {activeTab === 'jobs' ? 'Post New Job' : 'Add Candidate'}
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-dark-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700">
        <div className="flex w-full sm:w-auto p-1 bg-gray-50 dark:bg-dark-900 rounded-xl">
          <button onClick={() => setActiveTab('jobs')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'jobs' ? 'bg-white dark:bg-dark-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
            Job Postings ({(jobs || []).length})
          </button>
          <button onClick={() => setActiveTab('candidates')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'candidates' ? 'bg-white dark:bg-dark-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
            Candidate Pipeline ({(candidates || []).length})
          </button>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto px-2 sm:px-0">
          {activeTab === 'jobs' ? (
            <>
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-dark-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <select value={jobFilter} onChange={e => setJobFilter(e.target.value)} className="bg-gray-50 dark:bg-dark-900 border-none rounded-xl text-sm py-2 px-3 outline-none">
                <option value="">All Status</option>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </>
          ) : (
            <select value={candJobFilter} onChange={e => setCandJobFilter(e.target.value)} className="bg-gray-50 dark:bg-dark-900 border-none rounded-xl text-sm py-2 px-3 outline-none">
              <option value="">All Jobs</option>
              {(jobs || []).map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* ── JOBS ── */}
      {activeTab === 'jobs' && (
        jobsLoading ? (
          <div className="py-20 text-center text-gray-400"><div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"/></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {(jobs || []).map(job => (
              <motion.div key={job._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 hover:shadow-md transition-all group relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400"><Briefcase className="w-6 h-6" /></div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${job.status === 'open' ? 'bg-green-100 text-green-700' : job.status === 'filled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{job.status}</span>
                    <button onClick={() => openJobModal(job)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"><MoreVertical className="w-4 h-4"/></button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 transition-colors">{job.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{job.department} {job.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3"/>{job.location}</span>}</p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><Calendar className="w-4 h-4 text-gray-400"/>{job.employmentType?.replace('_', ' ')}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><Users className="w-4 h-4 text-gray-400"/>{job.vacancies} Vacanc{job.vacancies === 1 ? 'y' : 'ies'}</div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-dark-700">
                  <span className="text-xs text-gray-400">ID: {job.requisitionId}</span>
                  <div className="flex gap-2">
                    <button onClick={() => { if (window.confirm('Delete?')) delJobMut.mutate(job._id); }} className="text-red-400 hover:text-red-600 text-xs font-medium"><Trash2 className="w-3.5 h-3.5 inline"/> Delete</button>
                    <button onClick={() => { setActiveTab('candidates'); setCandJobFilter(job._id); }} className="text-primary-600 dark:text-primary-400 text-xs font-medium hover:underline flex items-center gap-1">Candidates <ExternalLink className="w-3 h-3"/></button>
                  </div>
                </div>
              </motion.div>
            ))}
            {(jobs || []).length === 0 && <div className="col-span-full py-20 text-center text-gray-400"><Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30"/><p className="font-bold">No jobs yet</p><p className="text-xs">Post your first job requisition</p></div>}
          </div>
        )
      )}
      {/* ── CANDIDATES KANBAN ── */}
      {activeTab === 'candidates' && (
        candsLoading ? (
          <div className="py-20 text-center text-gray-400"><div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"/></div>
        ) : (
          <div className="flex gap-5 overflow-x-auto pb-4">
            {STAGES.map(stage => (
              <div key={stage} className="min-w-[300px] w-[300px] flex-shrink-0 flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white uppercase text-xs tracking-wider flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${STAGE_DOTS[stage]}`}/> {stage}</h3>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-dark-700 px-2 py-0.5 rounded-full">{candidatesByStage[stage]?.length || 0}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {(candidatesByStage[stage] || []).map(c => (
                    <motion.div key={c._id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-dark-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700 hover:border-primary-300 transition-colors relative">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">{c.firstName} {c.lastName}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{(jobs || []).find(j => j._id === c.jobRequisitionId)?.title || 'Unknown Job'}</p>
                        </div>
                        <div className="flex gap-1">
                          {nextStage(c.stage) && (
                            <button onClick={() => moveCandMut.mutate({ id: c._id, stage: nextStage(c.stage) })} title={`Move to ${nextStage(c.stage)}`} className="p-1 rounded-md hover:bg-green-50 text-gray-400 hover:text-green-600"><ArrowRight className="w-3.5 h-3.5"/></button>
                          )}
                          <button onClick={() => openCandModal(c)} className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700"><MoreVertical className="w-3.5 h-3.5"/></button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/>{c.phone}</span>}
                        {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3"/>{c.email}</span>}
                      </div>
                      {c.rating && <div className="flex items-center gap-0.5 mt-2"><Star className="w-3 h-3 text-amber-400 fill-amber-400"/><span className="text-xs font-medium text-gray-700">{c.rating}</span></div>}
                      <div className="flex gap-2 mt-3">
                        {c.stage !== 'rejected' && c.stage !== 'hired' && (
                          <button onClick={() => moveCandMut.mutate({ id: c._id, stage: 'rejected' })} className="text-[10px] px-2 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 font-medium flex items-center gap-1"><UserX className="w-3 h-3"/> Reject</button>
                        )}
                        <button onClick={() => { if (window.confirm('Delete candidate?')) delCandMut.mutate(c._id); }} className="text-[10px] px-2 py-1 rounded-md bg-gray-50 text-gray-500 hover:bg-gray-100 font-medium"><Trash2 className="w-3 h-3 inline"/> Delete</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── JOB MODAL ── */}
      <AnimatePresence>
        {showJobModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-dark-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingJob ? 'Edit Job' : 'New Job Requisition'}</h2>
                <button onClick={closeJobModal} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5"/></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-gray-500">Requisition ID</label><input value={jobForm.requisitionId} onChange={e => setJobForm(f => ({ ...f, requisitionId: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm"/></div>
                  <div><label className="text-xs font-medium text-gray-500">Title</label><input value={jobForm.title} onChange={e => setJobForm(f => ({ ...f, title: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm"/></div>
                  <div><label className="text-xs font-medium text-gray-500">Department</label><input value={jobForm.department} onChange={e => setJobForm(f => ({ ...f, department: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm"/></div>
                  <div><label className="text-xs font-medium text-gray-500">Position</label><input value={jobForm.position} onChange={e => setJobForm(f => ({ ...f, position: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm"/></div>
                  <div><label className="text-xs font-medium text-gray-500">Location</label><input value={jobForm.location} onChange={e => setJobForm(f => ({ ...f, location: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm"/></div>
                  <div><label className="text-xs font-medium text-gray-500">Vacancies</label><input type="number" value={jobForm.vacancies} onChange={e => setJobForm(f => ({ ...f, vacancies: Number(e.target.value) }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm"/></div>
                  <div><label className="text-xs font-medium text-gray-500">Status</label><select value={jobForm.status} onChange={e => setJobForm(f => ({ ...f, status: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm">{STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></div>
                  <div><label className="text-xs font-medium text-gray-500">Priority</label><select value={jobForm.priority} onChange={e => setJobForm(f => ({ ...f, priority: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm">{PRIORITY_OPTS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div><label className="text-xs font-medium text-gray-500">Employment Type</label><select value={jobForm.employmentType} onChange={e => setJobForm(f => ({ ...f, employmentType: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm">{TYPE_OPTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></div>
                  <div><label className="text-xs font-medium text-gray-500">Posted Date</label><input type="date" value={jobForm.postedDate} onChange={e => setJobForm(f => ({ ...f, postedDate: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm"/></div>
                </div>
                <div><label className="text-xs font-medium text-gray-500">Description</label><textarea value={jobForm.description} onChange={e => setJobForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm"/></div>
                <div><label className="text-xs font-medium text-gray-500">Requirements</label><textarea value={jobForm.requirements} onChange={e => setJobForm(f => ({ ...f, requirements: e.target.value }))} rows={2} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm"/></div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 dark:border-dark-700">
                <button onClick={closeJobModal} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
                <button onClick={() => jobMut.mutate(jobForm)} disabled={jobMut.isPending} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"><Save className="w-4 h-4"/> {jobMut.isPending ? 'Saving...' : 'Save'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CANDIDATE MODAL ── */}
      <AnimatePresence>
        {showCandModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-dark-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingCand ? 'Edit Candidate' : 'New Candidate'}</h2>
                <button onClick={closeCandModal} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5"/></button>
              </div>
              <div className="p-6 space-y-4">
                <div><label className="text-xs font-medium text-gray-500">Job Requisition</label><select value={candForm.jobRequisitionId} onChange={e => setCandForm(f => ({ ...f, jobRequisitionId: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm"><option value="">Select job</option>{(jobs || []).map(j => <option key={j._id} value={j._id}>{j.title}</option>)}</select></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-gray-500">First Name</label><input value={candForm.firstName} onChange={e => setCandForm(f => ({ ...f, firstName: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm"/></div>
                  <div><label className="text-xs font-medium text-gray-500">Last Name</label><input value={candForm.lastName} onChange={e => setCandForm(f => ({ ...f, lastName: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm"/></div>
                  <div><label className="text-xs font-medium text-gray-500">Email</label><input type="email" value={candForm.email} onChange={e => setCandForm(f => ({ ...f, email: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm"/></div>
                  <div><label className="text-xs font-medium text-gray-500">Phone</label><input value={candForm.phone} onChange={e => setCandForm(f => ({ ...f, phone: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm"/></div>
                  <div><label className="text-xs font-medium text-gray-500">Nationality</label><input value={candForm.nationality} onChange={e => setCandForm(f => ({ ...f, nationality: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm"/></div>
                  <div><label className="text-xs font-medium text-gray-500">Source</label><select value={candForm.source} onChange={e => setCandForm(f => ({ ...f, source: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm">{SOURCE_OPTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></div>
                  <div><label className="text-xs font-medium text-gray-500">Stage</label><select value={candForm.stage} onChange={e => setCandForm(f => ({ ...f, stage: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm">{STAGES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div><label className="text-xs font-medium text-gray-500">Rating (1-5)</label><input type="number" min={1} max={5} value={candForm.rating} onChange={e => setCandForm(f => ({ ...f, rating: Number(e.target.value) }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm"/></div>
                  <div><label className="text-xs font-medium text-gray-500">Interview Date</label><input type="date" value={candForm.interviewDate} onChange={e => setCandForm(f => ({ ...f, interviewDate: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm"/></div>
                  <div><label className="text-xs font-medium text-gray-500">Offer Salary</label><input type="number" value={candForm.offerSalary} onChange={e => setCandForm(f => ({ ...f, offerSalary: Number(e.target.value) }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm"/></div>
                </div>
                <div><label className="text-xs font-medium text-gray-500">Resume URL</label><input value={candForm.resumeUrl} onChange={e => setCandForm(f => ({ ...f, resumeUrl: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm"/></div>
                <div><label className="text-xs font-medium text-gray-500">Cover Letter</label><textarea value={candForm.coverLetter} onChange={e => setCandForm(f => ({ ...f, coverLetter: e.target.value }))} rows={2} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm"/></div>
                <div><label className="text-xs font-medium text-gray-500">Notes</label><textarea value={candForm.notes} onChange={e => setCandForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm"/></div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 dark:border-dark-700">
                <button onClick={closeCandModal} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
                <button onClick={() => candMut.mutate(candForm)} disabled={candMut.isPending} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"><Save className="w-4 h-4"/> {candMut.isPending ? 'Saving...' : 'Save'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
