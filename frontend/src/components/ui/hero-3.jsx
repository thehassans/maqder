import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, PhoneCallIcon } from "lucide-react";

export function HeroSection({ isArabic }) {
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
            "group flex w-fit items-center gap-3 rounded-full border border-gray-200/60 bg-white/50 backdrop-blur-md px-3 py-1.5 shadow-sm hover:bg-white/80 transition-all",
            "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-500 duration-500 ease-out"
          )}
          href="#link"
        >
          <div className="rounded-full bg-primary-600 px-2.5 py-0.5 shadow-sm text-white">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider">NEW</p>
          </div>

          <span className="text-xs text-gray-600 font-medium tracking-wide">
            {isArabic ? 'نظام مقدر المتكامل' : 'Maqder ERP Complete System'}
          </span>
          <span className="block h-4 border-l border-gray-300" />

          <div className="pr-1">
            <ArrowRightIcon className={`w-3 h-3 text-gray-400 duration-200 ease-out group-hover:text-gray-700 ${isArabic ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
          </div>
        </a>

        <h1
          className={cn(
            "text-balance font-extrabold text-5xl text-gray-900 leading-[1.1] md:text-6xl lg:text-7xl tracking-tight",
            "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-100 duration-500 ease-out"
          )}
        >
          {isArabic ? 'إدارة أعمالك' : 'Manage your business'} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-emerald-500">
            {isArabic ? 'بذكاء وأناقة' : 'with intelligence and elegance'}
          </span>
        </h1>

        <p
          className={cn(
            "text-gray-500 text-base sm:text-lg md:text-xl max-w-2xl font-light leading-relaxed",
            "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-200 duration-500 ease-out"
          )}
        >
          {isArabic 
            ? 'نظام متكامل يجمع بين قوة الأداء وبساطة التصميم. مصمم خصيصاً لتلبية متطلبات السوق السعودي والفوترة الإلكترونية.'
            : 'An integrated system combining powerful performance with minimal design. Specifically built for the Saudi market and ZATCA e-invoicing.'}
        </p>

        <div className="fade-in slide-in-from-bottom-10 flex w-fit flex-col sm:flex-row items-center gap-4 fill-mode-backwards pt-6 delay-300 duration-500 ease-out">
          <Button className="w-full sm:w-auto rounded-full bg-gray-900 text-white hover:bg-gray-800 px-8 py-6 font-medium shadow-xl shadow-gray-900/20 transition-all hover:-translate-y-0.5 text-base">
            {isArabic ? 'ابدأ الآن' : 'Get Started'} <ArrowRightIcon className={`w-4 h-4 mx-2 ${isArabic ? 'rotate-180' : ''}`} />
          </Button>
          <Button variant="outline" className="w-full sm:w-auto rounded-full border-gray-200 text-gray-700 hover:bg-gray-50 px-8 py-6 font-medium transition-all text-base">
            <PhoneCallIcon className="w-4 h-4 mx-2" /> {isArabic ? 'احجز مكالمة' : 'Book a Call'}
          </Button>
          <Button variant="outline" asChild className="w-full sm:w-auto rounded-full border-gray-200 bg-white text-gray-900 hover:bg-gray-50 px-6 py-6 font-medium transition-all shadow-sm text-base">
            <a href="https://maqder.com/downloads/MaqderDesktop-Setup.exe">
              <svg className="w-5 h-5 mx-2 text-primary-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.801"/>
              </svg>
              {isArabic ? 'تنزيل لويندوز' : 'Download for Windows'}
            </a>
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
              className="z-10 relative aspect-[16/10] w-full rounded-xl border border-gray-100/50 object-cover shadow-sm dark:hidden"
              src="/adminpanel.png"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
