
import React from 'react';

interface OverlayProps {
  message: string;
  onStart: () => void;
  loading: boolean;
  isGameOver?: boolean;
  shards?: number;
  onOpenShop?: () => void;
}

const Overlay: React.FC<OverlayProps> = ({ message, onStart, loading, isGameOver, shards = 0, onOpenShop }) => {
  return (
    <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 z-40">
      <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter italic">
        {isGameOver ? "ASCENDED" : "CELESTE-X"}
      </h1>
      
      <div className="max-w-md bg-stone-900 border border-white/10 p-6 rounded-2xl shadow-2xl mb-8 relative">
        {loading && (
          <div className="absolute inset-0 bg-stone-900/90 flex items-center justify-center rounded-2xl">
            <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <p className="text-stone-300 text-lg leading-relaxed italic font-serif">
          "{message}"
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-[10px] text-white font-bold">C</div>
          <span className="text-xs text-stone-500 uppercase tracking-widest font-bold">Crystal's Insight</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        <button
          onClick={onStart}
          className="group relative px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white font-black text-xl rounded-xl transition-all active:scale-95 flex items-center justify-center gap-3 overflow-hidden shadow-[0_0_20px_rgba(225,29,72,0.3)]"
        >
          <span className="relative z-10">{isGameOver ? "RESTART ASCENT" : "BEGIN CLIMB"}</span>
          <i className="fas fa-play relative z-10 text-sm opacity-50"></i>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
        </button>

        {onOpenShop && !isGameOver && (
          <button
            onClick={onOpenShop}
            className="px-8 py-4 bg-stone-800 hover:bg-stone-700 text-white font-black text-xl rounded-xl transition-all active:scale-95 flex items-center justify-center gap-3 border border-white/10"
          >
            <span>ALTAR</span>
            <div className="flex items-center gap-1 text-cyan-400 text-sm">
              <i className="fas fa-gem"></i>
              <span>{shards}</span>
            </div>
          </button>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-8 text-stone-500 text-[10px] font-bold uppercase tracking-widest">
        <div>
          <p className="mb-2 text-stone-400">Movement</p>
          <p>WASD / Arrows: Move</p>
          <p>Space / Z: Jump</p>
          <p>Shift / X: Dash</p>
        </div>
        <div>
          <p className="mb-2 text-stone-400">Progression</p>
          <p>Collect Shards for Upgrades</p>
          <p>Dash Refreshes on Ground</p>
          <p>Double Jump (Unlockable)</p>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default Overlay;
