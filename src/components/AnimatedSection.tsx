'use client';

import { useEffect, useRef } from 'react';

export default function AnimatedSection({ children }: { children: React.ReactNode }) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-section');
            entry.target.querySelectorAll('.animate-fade-in-section-1').forEach((el) => {
              el.classList.add('animate-fade-in-section-1');
            });
            entry.target.querySelectorAll('.animate-fade-in-section-2').forEach((el) => {
              el.classList.add('animate-fade-in-section-2');
            });
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <div ref={sectionRef} className="opacity-0">
      {children}
    </div>
  );
} 