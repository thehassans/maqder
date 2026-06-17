import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, Shield, ArrowRight } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../lib/translations';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const { language } = useSelector((state) => state.ui);
  const { t } = useTranslation(language);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState(null); // 'loading', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setErrorMessage(language === 'ar' ? 'كلمة المرور قصيرة جداً (الحد الأدنى 8 أحرف)' : 'Password too short (min 8 characters)');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch(`/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setStatus('error');
        setErrorMessage(data.error || 'An error occurred');
      } else {
        setStatus('success');
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('Network error, please try again.');
    }
  };

  if (!token) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
        <p className="text-gray-500 mb-6">The password reset link is invalid or missing the token.</p>
        <button onClick={() => navigate('/login')} className="text-[#244D33] font-semibold hover:underline">
          {language === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        
        <div className="text-center lg:text-start mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {language === 'ar' ? 'تعيين كلمة مرور جديدة' : 'Set New Password'}
          </h1>
          <p className="text-gray-500 text-lg">
            {language === 'ar' ? 'أدخل كلمة مرورك الجديدة أدناه.' : 'Enter your new password below.'}
          </p>
        </div>

        {status === 'success' ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {language === 'ar' ? 'تم إعادة تعيين كلمة المرور بنجاح' : 'Password Reset Successfully'}
            </h2>
            <p className="text-gray-500 mb-6">
              {language === 'ar' ? 'سيتم توجيهك لتسجيل الدخول...' : 'Redirecting you to login...'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {status === 'error' && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('password') || 'New Password'}</label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 ps-12 pe-14 bg-white border-2 border-gray-200 focus:border-[#244D33] rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#244D33]/10 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 flex items-center pe-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-14 ps-12 pe-14 bg-white border-2 border-gray-200 focus:border-[#244D33] rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#244D33]/10 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 end-0 flex items-center pe-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full h-14 bg-gradient-to-r from-[#244D33] to-[#1e3f2a] hover:from-[#1e3f2a] hover:to-[#163121] text-white font-semibold rounded-2xl shadow-lg shadow-[#244D33]/30 hover:shadow-xl hover:shadow-[#244D33]/40 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              {status === 'loading' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {language === 'ar' ? 'تحديث كلمة المرور' : 'Update Password'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
