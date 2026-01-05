
import React from 'react';

interface ControlsProps {
  onInputUpdate: (input: any) => void;
  isPlaying: boolean;
}

const Controls: React.FC<ControlsProps> = ({ onInputUpdate, isPlaying }) => {
  const handleTouch = (key: string, value: boolean) => {
    onInputUpdate({ [key]: value });
  };

  if (!isPlaying) return null;

  return (
    <div className="absolute bottom-8 left-0 right-0 flex justify-between items-end px-8 md:hidden pointer-events-none">
      {/* Directional Pad */}
      <div className="grid grid-cols-3 gap-2 pointer-events-auto">
        <div />
        <ControlButton icon="fa-chevron-up" onStart={() => handleTouch('up', true)} onEnd={() => handleTouch('up', false)} />
        <div />
        <ControlButton icon="fa-chevron-left" onStart={() => handleTouch('left', true)} onEnd={() => handleTouch('left', false)} />
        <ControlButton icon="fa-chevron-down" onStart={() => handleTouch('down', true)} onEnd={() => handleTouch('down', false)} />
        <ControlButton icon="fa-chevron-right" onStart={() => handleTouch('right', true)} onEnd={() => handleTouch('right', false)} />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pointer-events-auto">
        <div className="flex flex-col gap-4">
          <ControlButton 
            icon="fa-bolt" 
            color="bg-sky-500" 
            onStart={() => handleTouch('dash', true)} 
            onEnd={() => handleTouch('dash', false)} 
            size="w-16 h-16"
          />
          <ControlButton 
            icon="fa-arrow-up" 
            color="bg-rose-500" 
            onStart={() => handleTouch('jump', true)} 
            onEnd={() => handleTouch('jump', false)} 
            size="w-20 h-20"
          />
        </div>
      </div>
    </div>
  );
};

const ControlButton: React.FC<{ 
  icon: string; 
  onStart: () => void; 
  onEnd: () => void; 
  color?: string;
  size?: string;
}> = ({ icon, onStart, onEnd, color = "bg-white/20", size = "w-14 h-14" }) => {
  return (
    <button
      onMouseDown={onStart}
      onMouseUp={onEnd}
      onTouchStart={(e) => { e.preventDefault(); onStart(); }}
      onTouchEnd={(e) => { e.preventDefault(); onEnd(); }}
      className={`${size} ${color} backdrop-blur-lg rounded-2xl flex items-center justify-center text-white text-2xl border border-white/30 active:scale-90 transition-transform`}
    >
      <i className={`fas ${icon}`}></i>
    </button>
  );
};

export default Controls;
