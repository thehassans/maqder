import React, { useState, useEffect } from 'react';
import { ArrowLeft, GraduationCap, Plus, X, Phone, Mail, Trash2, Edit2, Users, Loader2 } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function BookStoreCourseEnrollments() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    studentName: '', studentNameAr: '', studentPhone: '', studentEmail: '',
    studentGrade: '', parentName: '', parentPhone: '', paymentStatus: 'unpaid', amountPaid: 0, notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      const [coursesRes, enrRes] = await Promise.all([
        api.get('/bookstore/courses'),
        api.get(`/bookstore/courses/${courseId}/enrollments`),
      ]);
      const c = (coursesRes.data || []).find(c => c._id === courseId);
      setCourse(c);
      setEnrollments(enrRes.data || []);
    } catch (err) {
      toast.error('Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/bookstore/enrollments/${editingId}`, form);
        toast.success('Enrollment updated');
      } else {
        await api.post(`/bookstore/courses/${courseId}/enroll`, form);
        toast.success('Student enrolled');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ studentName: '', studentNameAr: '', studentPhone: '', studentEmail: '', studentGrade: '', parentName: '', parentPhone: '', paymentStatus: 'unpaid', amountPaid: 0, notes: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    }
  };

  const handleEdit = (enr) => {
    setEditingId(enr._id);
    setForm({
      studentName: enr.studentName || '', studentNameAr: enr.studentNameAr || '',
      studentPhone: enr.studentPhone || '', studentEmail: enr.studentEmail || '',
      studentGrade: enr.studentGrade || '', parentName: enr.parentName || '',
      parentPhone: enr.parentPhone || '', paymentStatus: enr.paymentStatus || 'unpaid',
      amountPaid: enr.amountPaid || 0, notes: enr.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this enrollment?')) return;
    try {
      await api.delete(`/bookstore/enrollments/${id}`);
      toast.success('Enrollment removed');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[calc(100vh-8rem)]"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const statusColors = {
    enrolled: 'bg-emerald-50 text-emerald-600',
    completed: 'bg-indigo-50 text-indigo-600',
    cancelled: 'bg-rose-50 text-rose-600',
    waitlisted: 'bg-amber-50 text-amber-600',
  };
  const payColors = {
    paid: 'bg-emerald-50 text-emerald-600',
    partial: 'bg-amber-50 text-amber-600',
    unpaid: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/app/dashboard/bookstore/products" className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Course Enrollments</h1>
          {course && (
            <p className="text-sm text-gray-400">
              {course.name} · {course.courseLevel || '—'} · {enrollments.length}/{course.courseCapacity || '∞'} enrolled
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-indigo-600/10 hover:bg-indigo-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          Enroll Student
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editingId ? 'Edit Enrollment' : 'New Enrollment'}</h3>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="p-2 text-gray-400 hover:text-gray-900 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Student Name *</label>
              <input value={form.studentName} onChange={e => setForm({ ...form, studentName: e.target.value })} required className="input" />
            </div>
            <div>
              <label className="label">Student Name (Arabic)</label>
              <input value={form.studentNameAr} onChange={e => setForm({ ...form, studentNameAr: e.target.value })} className="input" dir="rtl" />
            </div>
            <div>
              <label className="label">Student Phone</label>
              <input value={form.studentPhone} onChange={e => setForm({ ...form, studentPhone: e.target.value })} className="input" placeholder="05xxxxxxxx" />
            </div>
            <div>
              <label className="label">Student Email</label>
              <input value={form.studentEmail} onChange={e => setForm({ ...form, studentEmail: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Grade</label>
              <input value={form.studentGrade} onChange={e => setForm({ ...form, studentGrade: e.target.value })} className="input" placeholder="e.g. Grade 5" />
            </div>
            <div>
              <label className="label">Parent Name</label>
              <input value={form.parentName} onChange={e => setForm({ ...form, parentName: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Parent Phone</label>
              <input value={form.parentPhone} onChange={e => setForm({ ...form, parentPhone: e.target.value })} className="input" placeholder="05xxxxxxxx" />
            </div>
            <div>
              <label className="label">Payment Status</label>
              <select value={form.paymentStatus} onChange={e => setForm({ ...form, paymentStatus: e.target.value })} className="select">
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div>
              <label className="label">Amount Paid (SAR)</label>
              <input type="number" min="0" step="0.01" value={form.amountPaid} onChange={e => setForm({ ...form, amountPaid: e.target.value })} className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows="2" className="input" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-6 py-3 text-gray-600 bg-gray-100 rounded-2xl font-bold">Cancel</button>
            <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700">{editingId ? 'Update' : 'Enroll'}</button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
        {enrollments.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 font-medium">No students enrolled yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-700 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="text-left py-4 px-6">Student</th>
                  <th className="text-left py-4 px-4">Contact</th>
                  <th className="text-left py-4 px-4">Parent</th>
                  <th className="text-center py-4 px-4">Status</th>
                  <th className="text-center py-4 px-4">Payment</th>
                  <th className="text-left py-4 px-4">Enrolled</th>
                  <th className="text-center py-4 px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map(enr => (
                  <tr key={enr._id} className="border-b border-gray-50 dark:border-dark-700 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{enr.studentName}</p>
                      {enr.studentNameAr && <p className="text-xs text-gray-400" dir="rtl">{enr.studentNameAr}</p>}
                      {enr.studentGrade && <p className="text-xs text-gray-400">{enr.studentGrade}</p>}
                    </td>
                    <td className="py-4 px-4">
                      {enr.studentPhone && <p className="text-xs text-gray-600 flex items-center gap-1"><Phone className="w-3 h-3" /> {enr.studentPhone}</p>}
                      {enr.studentEmail && <p className="text-xs text-gray-600 flex items-center gap-1"><Mail className="w-3 h-3" /> {enr.studentEmail}</p>}
                      {(!enr.studentPhone && !enr.studentEmail) && <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="py-4 px-4">
                      {enr.parentName && <p className="text-xs font-medium text-gray-700">{enr.parentName}</p>}
                      {enr.parentPhone && <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {enr.parentPhone}</p>}
                      {(!enr.parentName && !enr.parentPhone) && <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-bold ${statusColors[enr.status] || statusColors.enrolled}`}>
                        {enr.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-bold ${payColors[enr.paymentStatus] || payColors.unpaid}`}>
                        {enr.paymentStatus}
                      </span>
                      {enr.amountPaid > 0 && <p className="text-xs text-gray-400 mt-1">SAR {Number(enr.amountPaid).toFixed(2)}</p>}
                    </td>
                    <td className="py-4 px-4 text-xs text-gray-500">
                      {enr.enrollmentDate ? new Date(enr.enrollmentDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(enr)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(enr._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
