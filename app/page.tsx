"use client";

import { AtlasPulse } from "@/components/dashboard/AtlasPulse";
import { ScreenshotStream } from "@/components/dashboard/ScreenshotStream";
import { LedgerFeed } from "@/components/dashboard/LedgerFeed";
import { FieldNotes } from "@/components/dashboard/FieldNotes";
import { EcosystemMap } from "@/components/dashboard/EcosystemMap";
import { TaskWidget } from "@/components/dashboard/TaskWidget";
import { Activity, Camera, ScrollText, Map, MessageSquare, CheckSquare } from "lucide-react";
import { useRef, useState, useEffect } from "react";

export default function Home() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollTo = (index: number) => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({
        left: width * index,
        behavior: "smooth",
      });
      setActiveIndex(index);
    }
  };

  // Update active index on manual scroll
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const index = Math.round(scrollRef.current.scrollLeft / scrollRef.current.offsetWidth);
        setActiveIndex(index);
      }
    };
    const el = scrollRef.current;
    el?.addEventListener('scroll', handleScroll);
    return () => el?.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { icon: Activity, index: 0, label: "Pulse" },
    { icon: Camera, index: 1, label: "Screenshots" },
    { icon: ScrollText, index: 2, label: "Ledger" },
    { icon: Map, index: 3, label: "Ecosystem" },
    { icon: MessageSquare, index: 4, label: "Notes" },
    { icon: CheckSquare, index: 5, label: "Tasks" },
  ];

  return (
    <div className="app-container">
      {/* Aurora Background Effects */}
      <div className="aurora top-[-50px] left-[-50px]" />
      <div className="aurora bottom-[-100px] right-[-50px] opacity-50" />
      
      {/* Mobile: Horizontal scroll layout */}
      <main 
        ref={scrollRef}
        className="snap-x w-full h-full flex overflow-x-auto snap-mandatory snap-x relative z-10 no-scrollbar md:hidden"
      >
        <section className="widget snap-center min-w-full flex items-center justify-center">
          <AtlasPulse />
        </section>
        
        <section className="widget snap-center min-w-full pt-16 px-6">
          <ScreenshotStream />
        </section>

        <section className="widget snap-center min-w-full pt-16 px-6">
          <LedgerFeed />
        </section>

        <section className="widget snap-center min-w-full pt-16 px-6">
          <EcosystemMap />
        </section>

        <section className="widget snap-center min-w-full pt-16 px-6">
          <FieldNotes />
        </section>

        <section className="widget snap-center min-w-full pt-16 px-6">
          <TaskWidget isActive={activeIndex === 5} />
        </section>
      </main>

      {/* Desktop: Grid layout */}
      <main className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-6 p-6 relative z-10 overflow-y-auto h-full pb-24">
        <section className="widget">
          <AtlasPulse />
        </section>
        
        <section className="widget">
          <ScreenshotStream />
        </section>

        <section className="widget">
          <LedgerFeed />
        </section>

        <section className="widget">
          <EcosystemMap />
        </section>

        <section className="widget">
          <FieldNotes />
        </section>

        <section className="widget">
          <TaskWidget isActive={activeIndex === 5} />
        </section>
      </main>
      
      {/* Mobile: iOS-style Dock */}
      <nav className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[360px] h-16 bg-[#18181B]/60 backdrop-blur-2xl rounded-3xl border border-white/5 flex items-center justify-around px-2 z-50 shadow-2xl">
        {navItems.map((item) => (
          <button 
            key={item.index}
            onClick={() => scrollTo(item.index)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group ${
              activeIndex === item.index 
                ? "bg-[#F97316] text-white shadow-lg shadow-[#F97316]/20 scale-110" 
                : "text-[#71717A] hover:bg-white/5"
            }`}
          >
            <item.icon size={20} className="group-active:scale-90 transition-transform" />
          </button>
        ))}
      </nav>

      {/* Desktop: Top Navigation Bar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-[#18181B]/80 backdrop-blur-xl border-b border-white/5 items-center justify-between px-6 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#F97316] flex items-center justify-center">
            <Activity size={18} className="text-white" />
          </div>
          <span className="font-semibold text-white">Atlas Cockpit</span>
        </div>
        
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <button 
              key={item.index}
              onClick={() => {
                // Scroll to section on desktop
                const sections = document.querySelectorAll('.widget');
                sections[item.index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                activeIndex === item.index 
                  ? "bg-[#F97316]/20 text-[#F97316]" 
                  : "text-[#71717A] hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon size={18} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Desktop: Add top padding to account for fixed nav */}
      <style jsx>{`
        @media (min-width: 768px) {
          main {
            padding-top: 5rem;
          }
        }
      `}</style>
    </div>
  );
}
