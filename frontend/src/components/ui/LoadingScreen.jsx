export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#1a3d28] flex items-center justify-center">
      <div className="text-center flex flex-col items-center gap-6">
        <div className="w-28 h-28 flex items-center justify-center">
          <img src="/maqdernewlogo.webp" alt="Maqder" className="h-full w-auto object-contain" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white/70 text-sm font-medium tracking-wide">Loading your workspace...</p>
        </div>
      </div>
    </div>
  )
}
