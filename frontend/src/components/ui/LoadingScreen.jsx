export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#1a3d28] flex items-center justify-center px-4 py-8">
      <div className="text-center flex flex-col items-center gap-5 sm:gap-6">
        <div className="w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center">
          <img src="/maqdernewlogo.webp" alt="Maqder" className="h-full w-auto max-w-full object-contain" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white/70 text-xs sm:text-sm font-medium tracking-wide">Loading your workspace...</p>
        </div>
      </div>
    </div>
  )
}
