import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Scissors, Database, AlertCircle, Upload, Search, Users, Receipt, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function KhayyatSeeder() {
  const { id } = useParams();
  const { language } = useSelector((state) => state.ui);
  const isAr = language === 'ar';
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get(`/super-admin/tenants/${id}/khayyat-customers/stats`);
      setStats(data);
    } catch {
      // ignore
    }
  }, [id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSeed = async () => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من بذر البيانات؟' : 'Are you sure you want to seed default Khayyat data?')) {
      return;
    }
    setLoading(true);
    try {
      await api.post(`/super-admin/tenants/${id}/seed-khayyat`);
      toast.success(isAr ? 'تم بذر البيانات بنجاح' : 'Khayyat data seeded successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || (isAr ? 'فشل بذر البيانات' : 'Failed to seed Khayyat data'));
    }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0] || null);
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error(isAr ? 'يرجى اختيار ملف CSV' : 'Please select a CSV file');
      return;
    }
    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const { data } = await api.post(`/super-admin/tenants/${id}/seed-khayyat-customers`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      });
      toast.success(data.message || (isAr ? 'تم استيراد العملاء' : 'Customers imported'));
      setSelectedFile(null);
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.error || (isAr ? 'فشل الاستيراد' : 'Import failed'));
    }
    setImportLoading(false);
  };

  const handleSearch = async (searchPage = page) => {
    setSearchLoading(true);
    try {
      const { data } = await api.get(`/super-admin/tenants/${id}/khayyat-customers`, {
        params: { q: searchQuery, page: searchPage, limit: 50 },
      });
      setSearchResults(data);
    } catch (error) {
      toast.error(error.response?.data?.error || (isAr ? 'فشل البحث' : 'Search failed'));
    }
    setSearchLoading(false);
  };

  const onSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    handleSearch(1);
  };

  const goToPage = (newPage) => {
    setPage(newPage);
    handleSearch(newPage);
  };

  return (
    <div className="space-y-6">
      {/* Default Khayyat Data Seed */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {isAr ? 'بيانات الخياط الافتراضية' : 'Default Khayyat Data'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {isAr
                ? 'قم ببذر بيانات الأقمشة والتصاميم التطريزية والموردين الافتراضية لمستأجر الخياط هذا.'
                : 'Seed default fabrics, embroidery designs, and suppliers for this tailoring tenant.'}
            </p>

            <div className="mt-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-300">
                {isAr
                  ? 'هذا الإجراء سيضيف بيانات جديدة فقط ولن يحذف البيانات الموجودة.'
                  : 'This action will only add new data and will not delete any existing data.'}
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleSeed}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Scissors className="w-4 h-4" />
                )}
                {isAr ? 'بذر بيانات الخياط' : 'Seed Khayyat Data'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer CSV Import */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <Upload className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {isAr ? 'استيراد عملاء الخياط من CSV' : 'Import Khayyat Customers from CSV'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {isAr
                ? 'قم برفع ملف CSV لاستيراد العملاء. الأعمدة المطلوبة: CusName (الاسم)، TelNo (الهاتف)، CusId (المعرف)، FaxNo (التاريخ الهجري)، Address (أرقام الإيصالات).'
                : 'Upload a CSV file to bulk import customers. Columns: CusName (name), TelNo (phone), CusId (unique ID), FaxNo (Hijri date), Address (receipt numbers).'}
            </p>

            {/* Stats */}
            {stats && (
              <div className="mt-4 flex gap-4">
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 rounded-xl px-4 py-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isAr ? 'إجمالي العملاء' : 'Total Customers'}: <span className="font-bold">{stats.total}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 rounded-xl px-4 py-2">
                  <Receipt className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isAr ? 'بإيصالات' : 'With Receipts'}: <span className="font-bold">{stats.withReceipts}</span>
                  </span>
                </div>
              </div>
            )}

            <div className="mt-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                {isAr
                  ? 'سيتم تحديث العملاء الموجودين بنفس المعرف (CusId) بدلاً من تكرارهم. يدعم حتى 50 ميجابايت.'
                  : 'Existing customers with the same CusId will be updated instead of duplicated. Supports up to 50MB.'}
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white dark:file:bg-white dark:file:text-gray-900 hover:file:opacity-90 file:cursor-pointer file:transition-opacity"
              />
              <button
                onClick={handleImport}
                disabled={importLoading || !selectedFile}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {importLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {isAr ? 'استيراد العملاء' : 'Import Customers'}
              </button>
            </div>
            {selectedFile && (
              <p className="mt-2 text-xs text-gray-500">
                {isAr ? 'الملف المحدد:' : 'Selected file:'} <span className="font-medium">{selectedFile.name}</span> ({(selectedFile.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Customer Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Search className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {isAr ? 'بحث عن العملاء' : 'Search Customers'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {isAr
                ? 'ابحث بالاسم أو رقم الإيصال أو رقم الهاتف أو المعرف.'
                : 'Search by name, receipt number, phone, or customer code.'}
            </p>

            <form onSubmit={onSearchSubmit} className="mt-4 flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'ابحث بالاسم أو رقم الإيصال...' : 'Search by name or receipt number...'}
                className="flex-1 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={searchLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {isAr ? 'بحث' : 'Search'}
              </button>
            </form>

            {/* Search Results */}
            {searchResults && (
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-3">
                  {isAr
                    ? `${searchResults.total} نتيجة (صفحة ${searchResults.page} من ${searchResults.pages})`
                    : `${searchResults.total} results (page ${searchResults.page} of ${searchResults.pages})`}
                </p>

                {searchResults.customers.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    {isAr ? 'لا توجد نتائج' : 'No results found'}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-slate-800">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">{isAr ? 'المعرف' : 'Code'}</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">{isAr ? 'الاسم' : 'Name'}</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">{isAr ? 'الهاتف' : 'Phone'}</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">{isAr ? 'أرقام الإيصالات' : 'Receipt Numbers'}</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">{isAr ? 'التاريخ الهجري' : 'Hijri Date'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {searchResults.customers.map((c) => (
                          <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.customerCode}</td>
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.name}</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400" dir="ltr">{c.phone || '—'}</td>
                            <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{c.khayyatReceiptNumbers || '—'}</td>
                            <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{c.khayyatHijriDate || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {searchResults.pages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      onClick={() => goToPage(page - 1)}
                      disabled={page <= 1 || searchLoading}
                      className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-slate-800"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-500 px-3">
                      {page} / {searchResults.pages}
                    </span>
                    <button
                      onClick={() => goToPage(page + 1)}
                      disabled={page >= searchResults.pages || searchLoading}
                      className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-slate-800"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
