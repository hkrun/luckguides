"use client";

import { Play } from "lucide-react";

interface ScrollToSectionButtonProps {
  targetId: string;
  children: React.ReactNode;
  className?: string;
}

export function ScrollToSectionButton({ targetId, children, className }: ScrollToSectionButtonProps) {
  const handleClick = () => {
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      className={className}
    >
      <Play className="w-5 h-5 mr-2" />
      {children}
    </button>
  );
}
