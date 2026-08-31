"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedStatProps {
  value: number;
  label: string;
  suffix?: string;
  duration?: number;
}

export function AnimatedStat({ value, label, suffix = "", duration = 1200 }: AnimatedStatProps) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;

        const start = performance.now();
        function tick(now: number) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(eased * value));
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.3 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl font-semibold text-zinc-900 sm:text-4xl">
        {display.toLocaleString("pl-PL")}
        {suffix}
      </p>
      <p className="mt-1 text-sm text-zinc-500">{label}</p>
    </div>
  );
}
