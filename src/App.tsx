import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { GameState, CAT_SKINS, CatSkin } from "./types";
import CatRunner from "./components/CatRunner";
import SkinSelector from "./components/SkinSelector";
import { synth } from "./components/AudioSynth";
import { Trophy, HelpCircle, Sparkles, Star, Lightbulb, RefreshCw } from "lucide-react";

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [selectedSkin, setSelectedSkin] = useState<CatSkin>(CAT_SKINS[0]);
  const [unlockedSkinIds, setUnlockedSkinIds] = useState<string[]>(["ginger"]);
  const [totalFish, setTotalFish] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);

  // Load persistent scores and skins on mount
  useEffect(() => {
    try {
      const savedHighScore = localStorage.getItem("cat_runner_high_score");
      if (savedHighScore) {
        setHighScore(parseInt(savedHighScore, 10));
      }

      const savedFish = localStorage.getItem("cat_runner_total_fish");
      if (savedFish) {
        setTotalFish(parseInt(savedFish, 10));
      }

      const savedSkins = localStorage.getItem("cat_runner_unlocked_skins");
      if (savedSkins) {
        const parsed = JSON.parse(savedSkins);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUnlockedSkinIds(parsed);
        }
      }

      const savedSelectedSkinId = localStorage.getItem("cat_runner_selected_skin");
      if (savedSelectedSkinId) {
        const found = CAT_SKINS.find((s) => s.id === savedSelectedSkinId);
        if (found) {
          setSelectedSkin(found);
        }
      }
    } catch (e) {
      console.warn("Could not load from localStorage:", e);
    }
  }, []);

  // Save changes to localStorage
  const handleCollectFish = (amount: number) => {
    setTotalFish((prev) => {
      const newVal = prev + amount;
      localStorage.setItem("cat_runner_total_fish", newVal.toString());
      return newVal;
    });
  };

  const updateHighScore = (score: number) => {
    setHighScore(score);
    localStorage.setItem("cat_runner_high_score", score.toString());
  };

  const handleSetSelectedSkin = (skin: CatSkin) => {
    setSelectedSkin(skin);
    localStorage.setItem("cat_runner_selected_skin", skin.id);
  };

  const handleSetUnlockedSkinIds = (ids: string[]) => {
    setUnlockedSkinIds(ids);
    localStorage.setItem("cat_runner_unlocked_skins", JSON.stringify(ids));
  };

  // Reset progress (for convenience and replayability)
  const handleResetProgress = () => {
    if (window.confirm("Ви дійсно хочете скинути весь ігровий прогрес, рекорди та відкритих котиків?")) {
      synth.playMeowDamaged();
      localStorage.clear();
      setHighScore(0);
      setTotalFish(0);
      setUnlockedSkinIds(["ginger"]);
      setSelectedSkin(CAT_SKINS[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffdf9] text-slate-800 pb-12 font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Decorative top ambient bar */}
      <div className="h-2 bg-gradient-to-r from-amber-300 via-pink-300 to-sky-300" />

      {/* Main Grid Content Container */}
      <div className="max-w-4xl mx-auto px-4 mt-8 flex flex-col gap-6">
        
        {/* Cute Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-amber-100 p-6 rounded-2xl shadow-sm"
        >
          <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-3xl shadow-inner border border-amber-200">
              🐾
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                  Кіт-Раннер
                </h1>
                <span className="text-xs px-2.5 py-0.5 font-bold text-amber-700 bg-amber-50 rounded-full border border-amber-100 flex items-center gap-1">
                  v1.2 <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Допоможи пухнастику подолати всі перешкоди та зібрати смакоту!
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="flex gap-4">
            <div className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl text-center min-w-[100px] shadow-xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
                Найкращий результат
              </span>
              <div className="flex items-center justify-center gap-1 text-slate-800 font-extrabold text-base">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span>{highScore}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 1. Core Game Element */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="w-full"
        >
          <CatRunner
            gameState={gameState}
            setGameState={setGameState}
            selectedSkin={selectedSkin}
            onCollectFish={handleCollectFish}
            highScore={highScore}
            updateHighScore={updateHighScore}
          />
        </motion.div>

        {/* 2. Skin Selector Shop */}
        {gameState !== GameState.PLAYING && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="w-full"
          >
            <SkinSelector
              selectedSkin={selectedSkin}
              setSelectedSkin={handleSetSelectedSkin}
              unlockedSkinIds={unlockedSkinIds}
              setUnlockedSkinIds={handleSetUnlockedSkinIds}
              totalFish={totalFish}
              setTotalFish={setTotalFish}
            />
          </motion.div>
        )}

        {/* 3. Instructions & Guide Panel */}
        {gameState !== GameState.PLAYING && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {/* Rules and Description Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-3">
                <HelpCircle className="w-4 h-4 text-sky-500" /> Як грати?
              </h3>
              <ul className="text-xs text-slate-600 space-y-2.5 list-none pl-1">
                <li className="flex gap-2">
                  <span className="text-sky-500 font-bold">1.</span>
                  <span>Перестрибуй через <strong className="text-slate-700">коробки</strong> та <strong className="text-slate-700">клубочки ниток</strong>, які котяться по підлозі.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sky-500 font-bold">2.</span>
                  <span>Пригинайся (ковзай), щоб сховатися від низько літаючих <strong className="text-slate-700">іграшкових пташок</strong> та метеликів.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sky-500 font-bold">3.</span>
                  <span>Збирай смачні золоті <strong className="text-amber-600">рибки</strong>, які висять у повітрі — кожні ласощі стануть у нагоді у вбиральні котиків!</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sky-500 font-bold">4.</span>
                  <span>З часом швидкість гри поступово <strong className="text-rose-500">збільшуватиметься</strong>, тримай лапки готовими!</span>
                </li>
              </ul>
            </div>

            {/* Strategy & Tips Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-amber-500" /> Корисні підказки
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-2.5 items-start">
                    <Star className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 leading-relaxed">
                      У грі реалізовано динамічний <strong className="text-slate-700">зсув часу доби</strong>! Чим більше балів ти набереш, тим красивішим ставатиме небо за віконцем (Ранок → День → Захід сонця → Сутінки → Зоряна ніч).
                    </p>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <Star className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Кожен розблокований котик має свій унікальний окрас хутра, оченят та вушок, що відображається під час гри та в гардеробі.
                    </p>
                  </div>
                </div>
              </div>

              {/* Reset Progress Section */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">Скинути всі дані та почати наново?</span>
                <button
                  id="reset-progress-btn"
                  onClick={handleResetProgress}
                  className="px-2.5 py-1 text-[10px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-transparent hover:border-rose-100"
                >
                  <RefreshCw className="w-3 h-3" /> Скинути дані
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Decorative footer */}
        <div className="text-center text-[10px] text-slate-400 mt-4 font-semibold select-none">
          Зроблено з любов'ю до котиків 🐱🐾 • Кіт-Раннер в AI Studio
        </div>

      </div>
    </div>
  );
}

