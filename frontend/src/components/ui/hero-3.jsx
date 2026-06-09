import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, PhoneCallIcon } from "lucide-react";

export function HeroSection() {
  return (
    <section className="mx-auto w-full max-w-5xl overflow-hidden pt-16">
      {/* Shades */}
      <div
        aria-hidden="true"
        className="absolute inset-0 size-full overflow-hidden pointer-events-none"
      >
        <div
          className={cn(
            "absolute inset-0 isolate -z-10",
            "bg-[radial-gradient(20%_80%_at_20%_0%,rgba(16,185,129,0.1),transparent)]"
          )}
        />
      </div>
      <div className="relative z-10 flex max-w-2xl flex-col gap-5 px-4">
        <a
          className={cn(
            "group flex w-fit items-center gap-3 rounded-full border bg-white p-1 shadow-sm",
            "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards transition-all delay-500 duration-500 ease-out"
          )}
          href="#link"
        >
          <div className="rounded-full border bg-[#1a3d28] px-2 py-0.5 shadow-sm text-white">
            <p className="font-mono text-xs font-bold">NEW</p>
          </div>

          <span className="text-xs text-gray-600 font-medium">Maqder ERP Complete System</span>
          <span className="block h-5 border-l border-gray-200" />

          <div className="pr-2">
            <ArrowRightIcon className="w-3 h-3 text-gray-500 -translate-x-0.5 duration-150 ease-out group-hover:translate-x-0.5" />
          </div>
        </a>

        <h1
          className={cn(
            "text-balance font-bold text-4xl text-gray-900 leading-tight md:text-5xl lg:text-6xl",
            "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-100 duration-500 ease-out"
          )}
        >
          Building Digital Experiences That Drive Growth
        </h1>

        <p
          className={cn(
            "text-gray-500 text-sm tracking-wide sm:text-lg md:text-xl max-w-xl",
            "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-200 duration-500 ease-out"
          )}
        >
          We help brands scale faster through design, development <br className="hidden sm:block" /> and strategic execution.
        </p>

        <div className="fade-in slide-in-from-bottom-10 flex w-fit animate-in items-center justify-start gap-3 fill-mode-backwards pt-4 delay-300 duration-500 ease-out">
          <Button variant="outline" className="rounded-full border-gray-200 text-gray-700 hover:bg-gray-50 px-6 py-6 font-medium">
            <PhoneCallIcon className="w-4 h-4 mr-2" /> Book a Call
          </Button>
          <Button className="rounded-full bg-[#1a3d28] text-white hover:bg-[#1a3d28]/90 px-6 py-6 font-medium shadow-lg shadow-[#1a3d28]/20">
            Get started <ArrowRightIcon className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
      <div className="relative">
        <div
          className={cn(
            "absolute -inset-x-20 inset-y-0 -translate-y-1/3 scale-120 rounded-full pointer-events-none",
            "bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.1),transparent,transparent)]",
            "blur-[50px]"
          )}
        />
        <div
          className={cn(
            "relative mt-12 sm:mt-16 md:mt-24 px-4 sm:px-0",
            "fade-in slide-in-from-bottom-5 animate-in fill-mode-backwards delay-100 duration-1000 ease-out"
          )}
        >
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-gray-200/50 bg-white/50 p-2 shadow-2xl backdrop-blur-sm">
            <img
              alt="app screen"
              className="z-10 relative aspect-[16/10] w-full rounded-xl border border-gray-100 object-cover shadow-sm dark:hidden"
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
