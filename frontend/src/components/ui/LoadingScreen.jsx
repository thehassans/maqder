export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 flex items-center justify-center">
      <div className="text-center">
        <div
          className="w-16 h-16 mx-auto mb-6 animate-spin"
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
        </div>
        <div className="w-auto h-20 flex items-center justify-center mb-6 mx-auto">
          <img src="/maqdernewlogo.webp" alt="Maqder" className="h-full w-auto object-contain" />
        </div>
        <p className="text-primary-200">Loading your workspace...</p>
      </div>
    </div>
  )
}
