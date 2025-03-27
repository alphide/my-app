'use client';

export default function ScrollArrow() {
  return (
    <div 
      className="animate-bounce cursor-pointer opacity-0 animate-fade-in" 
      onClick={() => {
        const mainContainer = document.querySelector('main');
        const targetSection = document.getElementById('how-it-works');
        
        if (mainContainer && targetSection) {
          const headerOffset = 100;
          const sectionPosition = targetSection.getBoundingClientRect().top;
          const containerScroll = mainContainer.scrollTop;
          const targetPosition = containerScroll + sectionPosition - headerOffset;

          // Ensure smooth scrolling behavior
          mainContainer.style.scrollBehavior = 'smooth';
          
          // Scroll to the target position
          mainContainer.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          // Reset scroll behavior after animation
          setTimeout(() => {
            mainContainer.style.scrollBehavior = 'auto';
          }, 1000);
        }
      }}
    >
      <svg 
        className="w-12 h-12 text-primary transform rotate-90" 
        viewBox="0 0 24 24" 
        fill="currentColor"
      >
        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
      </svg>
    </div>
  );
} 