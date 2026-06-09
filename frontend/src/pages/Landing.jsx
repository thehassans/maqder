import { HeroSection } from '@/components/ui/hero-3';
import { Header3 } from '@/components/ui/header-3';

export default function Landing() {
  return (
    <div className="flex w-full flex-col min-h-screen bg-white">
      <Header3 />
      <main className="grow">
        <HeroSection />
      </main>
    </div>
  );
}
