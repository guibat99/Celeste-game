
import React from 'react';
import { Progression, AbilityType } from '../types';

interface ShopProps {
  progression: Progression;
  onPurchase: (ability: AbilityType, cost: number) => void;
  onClose: () => void;
}

interface UpgradeItem {
  id: AbilityType;
  name: string;
  description: string;
  cost: number;
  icon: string;
}

const UPGRADES: UpgradeItem[] = [
  {
    id: 'multi_dash',
    name: 'Celestial Soul',
    description: 'Allows your spirit to dash twice before touching the ground.',
    cost: 5,
    icon: 'fa-bolt'
  },
  {
    id: 'double_jump',
    name: 'Wings of Light',
    description: 'Manifest ephemeral wings to jump once more mid-air.',
    cost: 8,
    icon: 'fa-feather-pointed'
  },
  {
    id: 'speed_boost',
    name: 'Fleet Foot',
    description: 'Permanent 30% increase to base movement speed.',
    cost: 3,
    icon: 'fa-wind'
  }
];

const Shop: React.FC<ShopProps> = ({ progression, onPurchase, onClose }) => {
  return (
    <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-lg flex flex-col items-center justify-center p-8 z-50">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-black text-white italic tracking-tighter mb-1">THE SACRED ALTAR</h2>
        <div className="flex items-center justify-center gap-2 text-cyan-400 font-bold uppercase tracking-widest text-sm">
          <i className="fas fa-gem"></i>
          <span>{progression.shards} Shards Collected</span>
        </div>
      </div>

      <div className="w-full max-w-lg space-y-4 mb-8">
        {UPGRADES.map((upgrade) => {
          const isUnlocked = progression.unlockedAbilities.includes(upgrade.id);
          const canAfford = progression.shards >= upgrade.cost;
          
          return (
            <div 
              key={upgrade.id}
              className={`p-4 rounded-2xl border transition-all ${
                isUnlocked 
                  ? 'bg-stone-800/50 border-emerald-500/50 opacity-60' 
                  : 'bg-stone-900 border-white/10 hover:border-white/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                    isUnlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white'
                  }`}>
                    <i className={`fas ${upgrade.icon}`}></i>
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{upgrade.name}</h3>
                    <p className="text-stone-400 text-xs">{upgrade.description}</p>
                  </div>
                </div>
                
                {isUnlocked ? (
                  <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-emerald-500/10 rounded-full">Unlocked</span>
                ) : (
                  <button
                    disabled={!canAfford}
                    onClick={() => onPurchase(upgrade.id, upgrade.cost)}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                      canAfford 
                        ? 'bg-rose-600 text-white active:scale-95' 
                        : 'bg-stone-800 text-stone-600 cursor-not-allowed'
                    }`}
                  >
                    <i className="fas fa-gem text-[10px]"></i>
                    {upgrade.cost}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onClose}
        className="px-12 py-4 bg-white text-black font-black text-lg rounded-xl hover:bg-stone-200 active:scale-95 transition-all"
      >
        CONTINUE ASCENT
      </button>
      
      <p className="mt-4 text-stone-600 text-[10px] font-bold uppercase tracking-widest">
        Level Up to earn more shards and XP
      </p>
    </div>
  );
};

export default Shop;
