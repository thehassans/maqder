import { motion } from 'framer-motion'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 mx-auto mb-6"
        >
          <svg viewBox="0 0 50 50" className="w-full h-full">
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="4"
            />
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="80"
              strokeDashoffset="60"
            />
          </svg>
        </motion.div>
        <div className="w-auto h-16 bg-white rounded-2xl p-2 shadow-xl flex items-center justify-center mb-6 mx-auto">
          <img src="/maqdernewlogo.png" alt="Maqder" className="h-full w-auto object-contain" />
        </div>
        <p className="text-primary-200">Loading your workspace...</p>
      </motion.div>
    </div>
  )
}
