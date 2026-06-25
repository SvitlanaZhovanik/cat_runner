import React from "react";
import { CatSkin, CAT_SKINS } from "../types";
import { synth } from "./AudioSynth";
import { Lock, Check, Sparkles } from "lucide-react";

interface SkinSelectorProps {
  selectedSkin: CatSkin;
  setSelectedSkin: (skin: CatSkin) => void;
  unlockedSkinIds: string[];
  setUnlockedSkinIds: (ids: string[]) => void;
  totalFish: number;
  setTotalFish: (amount: number | ((prev: number) => number)) => void;
}

export default function SkinSelector({
  selectedSkin,
  setSelectedSkin,
  unlockedSkinIds,
  setUnlockedSkinIds,
  totalFish,
  setTotalFish,
}: SkinSelectorProps) {
  
  const handleSelectSkin = (skin: CatSkin) => {
    // If already unlocked, just select
    if (unlockedSkinIds.includes(skin.id)) {
      setSelectedSkin(skin);
      synth.playMeowHappy();
    } else {
      // Try to unlock
      if (totalFish >= skin.cost) {
        setTotalFish((prev) => prev - skin.cost);
        setUnlockedSkinIds([...unlockedSkinIds, skin.id]);
        setSelectedSkin(skin);
        synth.playUnlock();
      } else {
        // Can't afford - negative buzzer sound
        synth.playMeowDamaged();
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 max-w-2xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
            🐱 Котячий Гардероб
          </h3>
          <p className="text-xs text-slate-500">
            Збирай золоту рибку під час забігу, щоб відкрити нових милих котиків!
          </p>
        </div>

        {/* Current Fish Counter */}
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl self-start sm:self-auto shadow-xs">
          <span className="text-xs font-bold text-amber-800">Твій улов:</span>
          <div className="flex items-center gap-1 text-amber-600 font-extrabold text-sm">
            <span>{totalFish}</span>
            {/* Tiny Fish SVG Icon */}
            <svg viewBox="0 0 24 16" className="w-5 h-4 fill-amber-500">
              <ellipse cx="11" cy="8" rx="8" ry="5" />
              <path d="M4 8 L0 4 L0 12 Z" />
              <circle cx="15" cy="6" r="1" fill="white" />
            </svg>
          </div>
        </div>
      </div>

      {/* Grid of Skins */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CAT_SKINS.map((skin) => {
          const isUnlocked = unlockedSkinIds.includes(skin.id);
          const isSelected = selectedSkin.id === skin.id;
          const canAfford = totalFish >= skin.cost;

          // Render Custom Inline Cat Preview SVG
          return (
            <button
              id={`skin-btn-${skin.id}`}
              key={skin.id}
              onClick={() => handleSelectSkin(skin)}
              className={`relative flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.01] active:scale-95 cursor-pointer select-none ${
                isSelected
                  ? "bg-amber-50/50 border-amber-400 shadow-md"
                  : isUnlocked
                  ? "bg-slate-50/40 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  : "bg-slate-100/50 border-slate-100 opacity-80 hover:opacity-100"
              }`}
            >
              {/* Left Side: Custom Inline SVG Cat Icon */}
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center relative shadow-inner overflow-hidden shrink-0"
                style={{ backgroundColor: isUnlocked ? "#fef3c7" : "#cbd5e1" }}
              >
                {/* SVG Vector Drawing of the Cat Head */}
                <svg viewBox="0 0 60 60" className="w-12 h-12">
                  {/* Ears */}
                  <polygon
                    points="10,25 6,5 24,18"
                    fill={skin.color}
                  />
                  <polygon
                    points="12,23 9,8 21,17"
                    fill={skin.earColor}
                  />
                  
                  <polygon
                    points="50,25 54,5 36,18"
                    fill={skin.color}
                  />
                  <polygon
                    points="48,23 51,8 39,17"
                    fill={skin.earColor}
                  />

                  {/* Head base */}
                  <circle cx="30" cy="32" r="18" fill={skin.color} />

                  {/* Stripes (if applicable) */}
                  {skin.stripeColor && (
                    <>
                      <rect x="28" y="14" width="4" height="8" rx="1" fill={skin.stripeColor} />
                      <rect x="22" y="15" width="3" height="6" rx="1" fill={skin.stripeColor} />
                      <rect x="35" y="15" width="3" height="6" rx="1" fill={skin.stripeColor} />
                    </>
                  )}

                  {/* Eyes (Sclera) */}
                  <ellipse cx="22" cy="29" rx="4" ry="5.5" fill="#ffffff" />
                  <ellipse cx="38" cy="29" rx="4" ry="5.5" fill="#ffffff" />

                  {/* Iris & Pupils */}
                  <circle cx="22" cy="29" r="3" fill={skin.eyeColor} />
                  <circle cx="38" cy="29" r="3" fill={skin.eyeColor} />
                  <circle cx="22" cy="29" r="1.3" fill="#000000" />
                  <circle cx="38" cy="29" r="1.3" fill="#000000" />

                  {/* Cute Cheeks */}
                  <circle cx="20" cy="36" r="3" fill="#ffffff" />
                  <circle cx="40" cy="36" r="3" fill="#ffffff" />
                  <circle cx="24" cy="36" r="3" fill="#ffffff" />
                  <circle cx="36" cy="36" r="3" fill="#ffffff" />

                  {/* Pink Nose */}
                  <polygon points="28,34 32,34 30,36" fill={skin.earColor} />
                </svg>

                {/* Status indicator icon */}
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-white drop-shadow-sm" />
                  </div>
                )}
              </div>

              {/* Right Side: Metadata / Unlock Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-800 truncate">
                    {skin.name}
                  </h4>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-0.5 shrink-0">
                      <Check className="w-3 h-3" /> Екіпіровано
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-normal mt-0.5 pr-2">
                  {skin.description}
                </p>

                {/* Unlock cost banner if locked */}
                {!isUnlocked && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Кошт:</span>
                    <span className={`text-xs font-black flex items-center gap-0.5 ${canAfford ? 'text-amber-600' : 'text-slate-400'}`}>
                      {skin.cost}
                      <svg viewBox="0 0 24 16" className="w-4 h-3 fill-current inline-block">
                        <ellipse cx="11" cy="8" rx="8" ry="5" />
                        <path d="M4 8 L0 4 L0 12 Z" />
                      </svg>
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${canAfford ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse' : 'bg-slate-200/60 text-slate-500'}`}>
                      {canAfford ? "Доступно" : "Недостатньо"}
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
