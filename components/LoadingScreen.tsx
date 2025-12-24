
import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center transition-opacity duration-500">
      <div className="loader-spinner border-4 border-[#d4af37]/30 border-t-[#d4af37] rounded-full w-12 h-12 mb-6 shadow-[0_0_20px_#d4af37]"></div>
      <div className="text-[#d4af37] font-cinzel text-sm tracking-[0.3em] animate-pulse">
        LOADING HOLIDAY MAGIC
      </div>
      <div className="absolute bottom-10 text-[#fceea7]/40 text-[10px] text-center font-cinzel">
        PREPARING PARTICLES & VISION MODELS...
      </div>
    </div>
  );
};

export default LoadingScreen;
