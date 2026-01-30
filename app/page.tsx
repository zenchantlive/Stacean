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
    { icon: Activity, index: 0 },
    { icon: Camera, index: 1 },
    { icon: ScrollText, index: 2 },
    { icon: Map, index: 3 },
    { icon: MessageSquare, index: 4 },
    { icon: CheckSquare, index: 5 },
  ];

  return (
    <div className="phone-container">
      <div className="aurora top-[-50px] left-[-50px]" />
      <div className="aurora bottom-[-100px] right-[-50px] opacity-50" />
      
      <main 
        ref={scrollRef}
        className="snap-x w-full h-full flex overflow-x-auto snap-mandatory snap-x relative z-10 no-scrollbar"
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
          <TaskWidget />
        </section>
      </main>
      
      {/* iOS-style Dock */}
      <nav className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[360px] h-16 bg-[#18181B]/60 backdrop-blur-2xl rounded-3xl border border-white/5 flex items-center justify-around px-2 z-50 shadow-2xl">
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
    </div>
  );
}
