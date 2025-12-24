
import React from 'react';
import { AppMode } from '../types';

interface Props {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onPhotoUpload: (url: string) => void;
}

const UIOverlay: React.FC<Props> = ({ mode, onModeChange, onPhotoUpload }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          onPhotoUpload(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between p-12 pointer-events-none">
      {/* Title Section */}
      <div className="text-center mt-8 pointer-events-auto">
        <h1 className="text-6xl md:text-8xl font-cinzel select-none"
            style={{
                background: 'linear-gradient(to right, #ffffff, #d4af37)',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                textShadow: '0 0 10px rgba(212,175,55,0.8), 0 0 20px rgba(212,175,55,0.5)'
            }}>
          Merry Christmas
        </h1>
        <p className="text-[#fceea7] tracking-widest mt-4 opacity-80 uppercase text-sm">
          A Particle Symphony of Light
        </p>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col items-center gap-6 mb-12 pointer-events-auto">
        <div className="flex gap-4">
          <ModeButton 
            active={mode === AppMode.TREE} 
            label="Sacred Tree" 
            onClick={() => onModeChange(AppMode.TREE)} 
          />
          <ModeButton 
            active={mode === AppMode.SCATTER} 
            label="Golden Dust" 
            onClick={() => onModeChange(AppMode.SCATTER)} 
          />
          <ModeButton 
            active={mode === AppMode.FOCUS} 
            label="Memory Focus" 
            onClick={() => onModeChange(AppMode.FOCUS)} 
          />
        </div>

        <div className="flex flex-col items-center">
          <label className="relative cursor-pointer group">
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            <div className="bg-white/10 backdrop-blur-md border border-[#d4af37] px-8 py-3 rounded-md text-[#fceea7] 
                            font-cinzel transition-all hover:bg-white/20 hover:scale-105 active:scale-95 shadow-lg">
              ADD MEMORIES
            </div>
          </label>
          <span className="text-[#fceea7]/60 text-xs mt-3 font-cinzel">
            Press 'H' to Hide Controls
          </span>
        </div>
      </div>
    </div>
  );
};

const ModeButton: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded border font-cinzel text-xs transition-all duration-300 ${
      active 
      ? 'bg-[#d4af37] text-black border-white shadow-[0_0_15px_#d4af37]' 
      : 'bg-black/30 text-[#d4af37] border-[#d4af37] hover:bg-[#d4af37]/20'
    }`}
  >
    {label}
  </button>
);

export default UIOverlay;
