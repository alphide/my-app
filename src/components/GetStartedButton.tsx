'use client';

import { useEffect } from 'react';

export default function GetStartedButton() {
  const handleClick = () => {
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <button
      onClick={handleClick}
      className="animate-fade-in-button hover-float px-8 py-4 text-xl font-semibold text-white bg-primary rounded-full shadow-lg"
    >
      Get Started
    </button>
  );
}
