import React, { useEffect, useRef, useState } from "react";
import { GameState, CatSkin, Obstacle, FishTreat, Particle } from "../types";
import { synth } from "./AudioSynth";
import { Award, RotateCcw, Volume2, VolumeX, Sparkles, Trophy, ArrowUp, ArrowDown } from "lucide-react";

interface CatRunnerProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  selectedSkin: CatSkin;
  onCollectFish: (amount: number) => void;
  highScore: number;
  updateHighScore: (score: number) => void;
}

export default function CatRunner({
  gameState,
  setGameState,
  selectedSkin,
  onCollectFish,
  highScore,
  updateHighScore,
}: CatRunnerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Core mutable game loops variables to run at 60fps without triggering React re-renders
  const stateRef = useRef({
    score: 0,
    fishCollectedThisRun: 0,
    speed: 5.5,
    maxSpeed: 14,
    gravity: 0.65,
    distanceTravelled: 0,
    gameTime: 0,

    // Cat properties
    cat: {
      x: 80,
      y: 0, // calculated from ground level
      width: 64,
      height: 48,
      vy: 0,
      isJumping: false,
      isDucking: false,
      runFrame: 0,
      duckSlideFrame: 0,
      rotation: 0,
    },

    // Arrays
    obstacles: [] as Obstacle[],
    fishTreats: [] as FishTreat[],
    particles: [] as Particle[],

    // Scrolling background offsets
    bgOffsetRoom: 0,
    bgOffsetShelf: 0,
    bgOffsetFloor: 0,

    // Controls
    keys: {} as Record<string, boolean>,
    groundY: 260, // ground level on canvas coordinate
    spawnTimer: 0,
    fishTimer: 0,
    isMuted: false,
  });

  const [currentScore, setCurrentScore] = useState(0);
  const [sessionFish, setSessionFish] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Sync mute state
  useEffect(() => {
    setIsMuted(synth.getMutedState());
  }, []);

  const handleMuteToggle = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const muted = synth.toggleMute();
    setIsMuted(muted);
    stateRef.current.isMuted = muted;
    // Simple click sound
    synth.playClick();
  };

  // Start/Restart the game
  const startGame = () => {
    synth.playMeowHappy();
    const s = stateRef.current;
    s.score = 0;
    s.fishCollectedThisRun = 0;
    s.speed = 5.8;
    s.obstacles = [];
    s.fishTreats = [];
    s.particles = [];
    s.cat.y = 0;
    s.cat.vy = 0;
    s.cat.isJumping = false;
    s.cat.isDucking = false;
    s.cat.runFrame = 0;
    s.spawnTimer = 40; // spawn soon
    s.fishTimer = 80;
    s.gameTime = 0;

    setCurrentScore(0);
    setSessionFish(0);
    setGameState(GameState.PLAYING);
  };

  // Trigger jumps or ducks
  const handleJump = () => {
    const s = stateRef.current;
    if (gameState !== GameState.PLAYING) return;
    if (!s.cat.isJumping && !s.cat.isDucking) {
      s.cat.vy = 12.5; // Jump strength (positive to go UP)
      s.cat.isJumping = true;
      synth.playJump();
      
      // Spawn tiny jump dust particles
      for (let i = 0; i < 6; i++) {
        s.particles.push({
          x: s.cat.x + 20,
          y: s.groundY,
          vx: -s.speed * 0.3 - Math.random() * 2,
          vy: -Math.random() * 3,
          color: "#e5e7eb",
          size: Math.random() * 5 + 3,
          life: 0,
          maxLife: 30,
        });
      }
    }
  };

  const handleDuck = (active: boolean) => {
    const s = stateRef.current;
    if (gameState !== GameState.PLAYING) return;
    if (active) {
      if (!s.cat.isDucking && !s.cat.isJumping) {
        s.cat.isDucking = true;
        s.cat.height = 28; // Smaller hitbox
        synth.playDuck();
      }
    } else {
      if (s.cat.isDucking) {
        s.cat.isDucking = false;
        s.cat.height = 48; // Restore normal hitbox
      }
    }
  };

  // Listeners for keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling when pressing Space, ArrowUp, ArrowDown
      if (["Space", " ", "ArrowUp", "ArrowDown", "KeyW", "KeyS"].includes(e.code) || e.key === " ") {
        e.preventDefault();
      }

      stateRef.current.keys[e.code] = true;

      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW" || e.key === " ") {
        if (gameState === GameState.PLAYING) {
          handleJump();
        } else if (gameState === GameState.START || gameState === GameState.GAME_OVER) {
          startGame();
        }
      }

      if (e.code === "ArrowDown" || e.code === "KeyS") {
        handleDuck(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.code] = false;
      if (e.code === "ArrowDown" || e.code === "KeyS") {
        handleDuck(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  // Touch and Mouse Controls
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (gameState !== GameState.PLAYING) {
      startGame();
      return;
    }

    const s = stateRef.current;
    // If user tapped on upper half -> Jump, else on lower half -> Duck
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const relativeY = clientY - rect.top;
      
      if (relativeY < rect.height * 0.6) {
        handleJump();
      } else {
        handleDuck(true);
      }
    }
  };

  const handleTouchEnd = () => {
    handleDuck(false);
  };

  // Main Canvas Rendering & Physics Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const renderLoop = () => {
      const s = stateRef.current;
      
      // Update Game physics and elements if playing
      if (gameState === GameState.PLAYING) {
        s.gameTime++;
        s.score += 0.15; // gradual score increment
        
        // Dynamic speed acceleration
        if (s.speed < s.maxSpeed) {
          s.speed += 0.0012;
        }

        // Apply jump physics
        if (s.cat.isJumping) {
          s.cat.y += s.cat.vy;
          s.cat.vy -= s.gravity; // Gravity pulls the cat DOWN

          // Check landing
          if (s.cat.y <= 0) {
            s.cat.y = 0;
            s.cat.vy = 0;
            s.cat.isJumping = false;
          }
        }

        // Animated Run frames
        s.cat.runFrame += s.speed * 0.04;
        
        // Spawn obstacles
        s.spawnTimer--;
        if (s.spawnTimer <= 0) {
          // Adjust spawn rate based on speed
          const minInterval = Math.max(45, 110 - s.speed * 4);
          const maxInterval = Math.max(90, 180 - s.speed * 5);
          s.spawnTimer = Math.floor(Math.random() * (maxInterval - minInterval)) + minInterval;

          // Select random obstacle type
          const rand = Math.random();
          let type: Obstacle["type"] = "box";
          let height = 36;
          let width = 36;
          let obsY = s.groundY - height;

          if (rand < 0.22) {
            // Cardboard Box
            type = "box";
            width = 36;
            height = 36;
            obsY = s.groundY - height;
          } else if (rand < 0.40) {
            // Yarn ball
            type = "yarn";
            width = 40;
            height = 40;
            obsY = s.groundY - height;
          } else if (rand < 0.55) {
            // Scratch post
            type = "scratch_post";
            width = 28;
            height = 54;
            obsY = s.groundY - height;
          } else if (rand < 0.70) {
            // Flying butterfly/bird
            type = "bird";
            width = 34;
            height = 24;
            // Spawn low (requires ducking!) or high (requires jumping!)
            // Make low-flying (ducking) very common for birds
            const requiresDucking = Math.random() > 0.35;
            obsY = requiresDucking ? s.groundY - 45 : s.groundY - 78;
          } else if (rand < 0.85) {
            // Cozy overhead hanging lamp (requires ducking!)
            type = "hanging_lamp";
            width = 32;
            height = 76; // drops from top down to groundY - 30
            obsY = s.groundY - 106; // bottom edge will be at s.groundY - 30, so cat can only pass if ducked (height 28)
          } else {
            // Dangling rubber band toy mouse (requires ducking!)
            type = "toy_mouse_dangling";
            width = 24;
            height = 72; // bottom edge at s.groundY - 30
            obsY = s.groundY - 102;
          }

          s.obstacles.push({
            x: canvas.width + 50,
            y: obsY,
            width,
            height,
            type,
            speedMultiplier: (type === "bird" || type === "toy_mouse_dangling") ? 1.15 : 1.0,
            rotation: 0,
            pulse: 0,
          });
        }

        // Spawn Goldfish Treats
        s.fishTimer--;
        if (s.fishTimer <= 0) {
          s.fishTimer = Math.floor(Math.random() * 120) + 90;
          
          // Spawn fish at variable heights
          const fishHeight = s.groundY - 35 - Math.random() * 80;
          s.fishTreats.push({
            x: canvas.width + 50,
            y: fishHeight,
            width: 25,
            height: 16,
            collected: false,
            oscillateOffset: Math.random() * Math.PI * 2,
          });
        }

        // Update Background offsets
        s.bgOffsetFloor = (s.bgOffsetFloor + s.speed) % 800;
        s.bgOffsetShelf = (s.bgOffsetShelf + s.speed * 0.4) % 800;
        s.bgOffsetRoom = (s.bgOffsetRoom + s.speed * 0.1) % 800;

        // Process Obstacles
        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const obs = s.obstacles[i];
          obs.x -= s.speed * obs.speedMultiplier;

          if (obs.type === "yarn") {
            obs.rotation += s.speed * 0.05; // roll yarn
          }
          if (obs.type === "bird") {
            // flap animation wave
            obs.pulse += 0.2;
            obs.y += Math.sin(obs.pulse) * 0.8;
          }

          // Cat hitbox coordinates
          const catLeft = s.cat.x + 8;
          const catRight = s.cat.x + s.cat.width - 8;
          const catTop = s.groundY - s.cat.y - s.cat.height + 4;
          const catBottom = s.groundY - s.cat.y - 2;

          // Obstacle bounding box
          const obsLeft = obs.x + 4;
          const obsRight = obs.x + obs.width - 4;
          const obsTop = obs.y + 4;
          const obsBottom = obs.y + obs.height - 4;

          // AABB Collision check
          if (
            catRight > obsLeft &&
            catLeft < obsRight &&
            catBottom > obsTop &&
            catTop < obsBottom
          ) {
            // CRASH! Game Over!
            synth.playMeowDamaged();
            setCurrentScore(Math.floor(s.score));
            setSessionFish(s.fishCollectedThisRun);
            setGameState(GameState.GAME_OVER);
            
            // Burst of stars/fur particles on impact
            for (let p = 0; p < 20; p++) {
              s.particles.push({
                x: (catRight + obsLeft) / 2,
                y: (catBottom + obsTop) / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 3,
                color: p % 2 === 0 ? selectedSkin.color : "#ef4444",
                size: Math.random() * 6 + 3,
                life: 0,
                maxLife: 45,
              });
            }

            // Sync high score
            const finalScore = Math.floor(s.score);
            if (finalScore > highScore) {
              updateHighScore(finalScore);
            }
          }

          // Remove offscreen obstacles
          if (obs.x + obs.width < -50) {
            s.obstacles.splice(i, 1);
          }
        }

        // Process Fish Treats
        for (let i = s.fishTreats.length - 1; i >= 0; i--) {
          const fish = s.fishTreats[i];
          fish.x -= s.speed;

          // Hover hover animation
          fish.oscillateOffset += 0.1;
          const hoverY = fish.y + Math.sin(fish.oscillateOffset) * 2;

          // Hitbox check
          const catLeft = s.cat.x + 4;
          const catRight = s.cat.x + s.cat.width - 4;
          const catTop = s.groundY - s.cat.y - s.cat.height;
          const catBottom = s.groundY - s.cat.y;

          if (
            !fish.collected &&
            catRight > fish.x &&
            catLeft < fish.x + fish.width &&
            catBottom > hoverY &&
            catTop < hoverY + fish.height
          ) {
            fish.collected = true;
            s.fishCollectedThisRun += 1;
            onCollectFish(1); // update persist database/state
            synth.playCollect();

            // Spawn sparkly gold fish scales
            for (let p = 0; p < 8; p++) {
              s.particles.push({
                x: fish.x + fish.width / 2,
                y: hoverY + fish.height / 2,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 4 - 1,
                color: "#f59e0b", // Golden
                size: Math.random() * 4 + 2,
                life: 0,
                maxLife: 30,
              });
            }
          }

          // Remove offscreen or collected fish
          if (fish.x + fish.width < -50 || fish.collected) {
            s.fishTreats.splice(i, 1);
          }
        }

        // Process running paw dust particles
        if (!s.cat.isJumping && !s.cat.isDucking && Math.random() < 0.2) {
          s.particles.push({
            x: s.cat.x + 12,
            y: s.groundY - 2,
            vx: -s.speed * 0.4 - Math.random() * 1.5,
            vy: -Math.random() * 1,
            color: "#ebd9c3", // matching rug/floor beige
            size: Math.random() * 4 + 2,
            life: 0,
            maxLife: 20,
          });
        }

        // Process particles
        for (let i = s.particles.length - 1; i >= 0; i--) {
          const p = s.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life++;
          if (p.life >= p.maxLife) {
            s.particles.splice(i, 1);
          }
        }

        // No high-frequency React state setters here to avoid laggy React re-renders.
        // Canvas HUD reads directly from ref s.score and s.fishCollectedThisRun,
        // and we sync these to React state once on Game Over.
      }

      // DRAWING PIPELINE
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Cozy Room Wallpaper (steady background, doesn't change color except a warm soft tone)
      ctx.fillStyle = "#faf3eb"; // Warm cozy cream wallpaper color
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Wallpaper vertical stripes details (very soft)
      ctx.fillStyle = "#f3e7db";
      for (let i = 0; i < canvas.width; i += 32) {
        ctx.fillRect(i, 0, 12, canvas.height);
      }

      // Draw sky/time of day inside the window frame ONLY (using clipping)
      ctx.save();
      ctx.beginPath();
      ctx.rect(280, 20, 180, 140);
      ctx.clip();

      // Change sky color based on score milestone (Day, sunset, twilight, night, dawn loop)
      const stage = Math.floor(s.score / 200) % 5;
      let skyGradient = ctx.createLinearGradient(280, 20, 280, 160);
      
      if (stage === 0) {
        // Morning: Soft Pink to Peach
        skyGradient.addColorStop(0, "#fde2e4");
        skyGradient.addColorStop(0.6, "#ffcad4");
        skyGradient.addColorStop(1, "#fcd5ce");
      } else if (stage === 1) {
        // Mid-Day: Pastel Blue
        skyGradient.addColorStop(0, "#bae6fd");
        skyGradient.addColorStop(0.5, "#e0f2fe");
        skyGradient.addColorStop(1, "#f0f9ff");
      } else if (stage === 2) {
        // Sunset: Warm Peach/Orange
        skyGradient.addColorStop(0, "#fdba74");
        skyGradient.addColorStop(0.6, "#fecdd3");
        skyGradient.addColorStop(1, "#ffe4e6");
      } else if (stage === 3) {
        // Twilight: Moody Lavender/Indigo
        skyGradient.addColorStop(0, "#818cf8");
        skyGradient.addColorStop(0.6, "#c084fc");
        skyGradient.addColorStop(1, "#eedffc");
      } else {
        // Deep Starry Night
        skyGradient.addColorStop(0, "#1e1b4b");
        skyGradient.addColorStop(0.6, "#312e81");
        skyGradient.addColorStop(1, "#4338ca");
      }

      ctx.fillStyle = skyGradient;
      ctx.fillRect(280, 20, 180, 140);

      // Night Stars / Clouds (inside window frame coordinate system)
      if (stage === 4) {
        // Starry night sparkles
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        for (let i = 0; i < 15; i++) {
          const starX = 280 + ((i * 47 + s.bgOffsetRoom * 0.1) % 180);
          const starY = 20 + ((i * 19) % 140);
          ctx.beginPath();
          ctx.arc(starX, starY, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Cute floating clouds inside window
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        for (let i = 0; i < 2; i++) {
          const cx = 280 + ((i * 110 - s.bgOffsetRoom * 0.12) % 240);
          const cy = 40 + i * 25;
          ctx.beginPath();
          ctx.arc(cx, cy, 10, 0, Math.PI * 2);
          ctx.arc(cx + 12, cy - 3, 14, 0, Math.PI * 2);
          ctx.arc(cx + 24, cy, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore(); // restore clipping

      // Cozy Window Frame outline (drawn over the clipped view)
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 5;
      ctx.strokeRect(280, 20, 180, 140);

      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(280 + 90, 20);
      ctx.lineTo(280 + 90, 160);
      ctx.moveTo(280, 20 + 70);
      ctx.lineTo(280 + 180, 20 + 70);
      ctx.stroke();

      // Layer 1 Parallax: Domestic shelf with Cat elements
      ctx.fillStyle = "#a16207"; // Rich wood color for shelf
      const shelfY = 120;
      ctx.fillRect(0, shelfY, canvas.width, 8); // draw shelf across whole screen so it's continuous
      
      // Draw cute things on shelves
      for (let i = 0; i < 6; i++) {
        // Correct looping coordinates for smooth movement
        let itemX = (i * 180 - s.bgOffsetShelf) % (canvas.width + 120);
        if (itemX < -100) itemX += (canvas.width + 120);

        if (itemX > -60 && itemX < canvas.width + 60) {
          if (i % 3 === 0) {
            // Group of books (different heights, standing and leaning!)
            // Book 1 (vertical)
            ctx.fillStyle = "#2563eb"; // Blue
            ctx.fillRect(itemX, shelfY - 26, 9, 26);
            ctx.fillStyle = "#1e3a8a"; // Spine label accent
            ctx.fillRect(itemX + 2, shelfY - 22, 5, 4);

            // Book 2 (vertical)
            ctx.fillStyle = "#f43f5e"; // Rose
            ctx.fillRect(itemX + 10, shelfY - 22, 11, 22);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(itemX + 13, shelfY - 18, 5, 3);

            // Book 3 (leaning book!)
            ctx.save();
            ctx.translate(itemX + 21, shelfY);
            ctx.rotate(0.22); // leaning angle
            ctx.fillStyle = "#10b981"; // Emerald green leaning book
            ctx.fillRect(0, -24, 8, 24);
            ctx.fillStyle = "#f59e0b";
            ctx.fillRect(2, -20, 4, 3);
            ctx.restore();
          } else if (i % 3 === 1) {
            // Cozy plant pot with cascading trailing green vines!
            ctx.fillStyle = "#ea580c"; // Terracotta pot
            ctx.beginPath();
            ctx.moveTo(itemX + 20, shelfY);
            ctx.lineTo(itemX + 16, shelfY - 15);
            ctx.lineTo(itemX + 34, shelfY - 15);
            ctx.lineTo(itemX + 30, shelfY);
            ctx.closePath();
            ctx.fill();

            // Broad leaves
            ctx.fillStyle = "#15803d"; // Dark Green
            ctx.beginPath();
            ctx.ellipse(itemX + 25, shelfY - 20, 5, 9, -Math.PI / 3, 0, Math.PI * 2);
            ctx.ellipse(itemX + 25, shelfY - 20, 5, 9, Math.PI / 3, 0, Math.PI * 2);
            ctx.fill();

            // Cascading vines hanging down the shelf!
            ctx.strokeStyle = "#16a34a"; // vine stems
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(itemX + 25, shelfY - 10);
            ctx.quadraticCurveTo(itemX + 20, shelfY + 12, itemX + 23, shelfY + 28);
            ctx.moveTo(itemX + 28, shelfY - 10);
            ctx.quadraticCurveTo(itemX + 32, shelfY + 16, itemX + 30, shelfY + 34);
            ctx.stroke();

            // Little vine leaves
            ctx.fillStyle = "#22c55e";
            ctx.beginPath();
            ctx.arc(itemX + 21, shelfY + 8, 3, 0, Math.PI * 2);
            ctx.arc(itemX + 24, shelfY + 20, 2.5, 0, Math.PI * 2);
            ctx.arc(itemX + 31, shelfY + 12, 3, 0, Math.PI * 2);
            ctx.arc(itemX + 29, shelfY + 26, 2.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Cute framed photo
            // Picture frame wood
            ctx.fillStyle = "#78350f";
            ctx.fillRect(itemX + 10, shelfY - 24, 22, 24);
            // Polaroid white inner
            ctx.fillStyle = "#f8fafc";
            ctx.fillRect(itemX + 12, shelfY - 22, 18, 20);
            // Cute heart or cat silhouette in the frame
            ctx.fillStyle = "#ef4444"; // red heart
            ctx.beginPath();
            ctx.moveTo(itemX + 21, shelfY - 14);
            ctx.bezierCurveTo(itemX + 18, shelfY - 18, itemX + 18, shelfY - 11, itemX + 21, shelfY - 8);
            ctx.bezierCurveTo(itemX + 24, shelfY - 11, itemX + 24, shelfY - 18, itemX + 21, shelfY - 14);
            ctx.fill();

            // Stack of books horizontally next to the picture!
            ctx.fillStyle = "#a855f7"; // purple book
            ctx.fillRect(itemX + 36, shelfY - 6, 24, 6);
            ctx.fillStyle = "#f59e0b"; // yellow book on top
            ctx.fillRect(itemX + 38, shelfY - 11, 20, 5);
          }
        }
      }

      // Baseboard / Skirting board (with natural cream molding styling)
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(0, s.groundY - 12, canvas.width, 12);
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(0, s.groundY - 12, canvas.width, 2.5);

      // Floor & Carpet Layer
      ctx.fillStyle = "#ebd2b0"; // cozy warm natural wooden floor boards
      ctx.fillRect(0, s.groundY, canvas.width, canvas.height - s.groundY);

      // Draw elegant wooden planks lines for a real home parquet feel
      ctx.strokeStyle = "#cca685";
      ctx.lineWidth = 1.5;
      for (let py = s.groundY + 12; py < canvas.height; py += 15) {
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(canvas.width, py);
        ctx.stroke();
      }

      // Carpet/Rug: Cosy textured loop runner rug
      ctx.fillStyle = "#fbcfe8"; // pastel pink rug base
      ctx.fillRect(0, s.groundY + 4, canvas.width, 42);
      // Rug pattern
      ctx.fillStyle = "#f472b6"; // darker pink accents
      for (let rX = -s.bgOffsetFloor; rX < canvas.width + 100; rX += 24) {
        ctx.beginPath();
        ctx.arc(rX, s.groundY + 12, 3, 0, Math.PI * 2);
        ctx.arc(rX + 12, s.groundY + 32, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // Rug tassels on bottom edge
      ctx.fillStyle = "#ffffff";
      for (let tx = 0; tx < canvas.width; tx += 6) {
        ctx.fillRect(tx, s.groundY + 46, 2, 4);
      }

      // 2. Draw Obstacles
      s.obstacles.forEach((obs) => {
        ctx.save();
        ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2);

        if (obs.type === "yarn") {
          // Rolling Ball of Yarn!
          ctx.rotate(obs.rotation);

          // Outer circle glow/shading
          ctx.fillStyle = "#ec4899"; // Pink yarn
          ctx.beginPath();
          ctx.arc(0, 0, obs.width / 2, 0, Math.PI * 2);
          ctx.fill();

          // Yarn texture loops (wrapped around)
          ctx.strokeStyle = "#db2777";
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.arc(0, 0, obs.width / 3.2, 0.4, Math.PI * 1.5);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(-2, -2, obs.width / 2.5, 2.5, Math.PI * 0.4);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(-obs.width / 2, 0);
          ctx.bezierCurveTo(-5, -12, 5, 12, obs.width / 2, 0);
          ctx.stroke();

          // Draw trailing loose string
          ctx.restore();
          ctx.save();
          ctx.strokeStyle = "rgba(219, 39, 119, 0.65)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(obs.x, obs.y + obs.height * 0.85);
          ctx.bezierCurveTo(obs.x - 12, obs.y + obs.height + 4, obs.x - 22, obs.y + obs.height - 2, obs.x - 30, obs.y + obs.height + 6);
          ctx.stroke();

        } else if (obs.type === "box") {
          // Cute cardboard box ("I fits!")
          ctx.fillStyle = "#b45309"; // Warm box cardboard brown
          ctx.fillRect(-obs.width / 2, -obs.height / 2 + 6, obs.width, obs.height - 6);

          // Inside shadow of box opening
          ctx.fillStyle = "#78350f";
          ctx.fillRect(-obs.width / 2 + 3, -obs.height / 2 + 6, obs.width - 6, 4);

          // Left box flap
          ctx.save();
          ctx.translate(-obs.width / 2, -obs.height / 2 + 6);
          ctx.rotate(-Math.PI / 4); // tilted flap
          ctx.fillStyle = "#d97706";
          ctx.fillRect(0, -3, obs.width / 2, 3);
          ctx.restore();

          // Right box flap
          ctx.save();
          ctx.translate(obs.width / 2, -obs.height / 2 + 6);
          ctx.rotate(Math.PI / 4);
          ctx.fillStyle = "#d97706";
          ctx.fillRect(-obs.width / 2, -3, obs.width / 2, 3);
          ctx.restore();

          // Cute fragile symbol or parcel tape
          ctx.fillStyle = "#78350f";
          ctx.fillRect(-obs.width / 4, 2, obs.width / 2, 4);

        } else if (obs.type === "scratch_post") {
          // Cat scratching post
          // Base
          ctx.fillStyle = "#475569";
          ctx.fillRect(-obs.width / 2, obs.height / 2 - 8, obs.width, 8);

          // Wooden post
          ctx.fillStyle = "#d97706";
          ctx.fillRect(-4, -obs.height / 2 + 10, 8, obs.height - 18);

          // Wrapping rope texture
          ctx.fillStyle = "#cbd5e1";
          for (let ry = -obs.height / 2 + 12; ry < obs.height / 2 - 10; ry += 5) {
            ctx.fillRect(-5, ry, 10, 2.5);
          }

          // Top mouse toy hanging down
          ctx.fillStyle = "#ec4899";
          ctx.beginPath();
          ctx.arc(8, -obs.height / 2 + 18, 3.5, 0, Math.PI * 2);
          ctx.fill();
          // Hanging string
          ctx.strokeStyle = "#334155";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, -obs.height / 2 + 10);
          ctx.quadraticCurveTo(6, -obs.height / 2 + 12, 8, -obs.height / 2 + 15);
          ctx.stroke();

          // Top post cap
          ctx.fillStyle = "#e2e8f0";
          ctx.beginPath();
          ctx.ellipse(0, -obs.height / 2 + 10, 6, 3, 0, 0, Math.PI * 2);
          ctx.fill();

        } else if (obs.type === "bird") {
          // Flying toy bird or butterfly!
          ctx.fillStyle = "#f43f5e"; // Rose body

          // Wing flap calculation
          const wingOffset = Math.sin(obs.pulse * 1.5) * 8;

          // Body
          ctx.beginPath();
          ctx.ellipse(0, 0, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2);
          ctx.fill();

          // Wings (flying animation)
          ctx.fillStyle = "#fda4af"; // lighter rose
          ctx.beginPath();
          ctx.ellipse(-2, -wingOffset, 6, 12, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();

          // Cute antenna or beak
          ctx.fillStyle = "#f59e0b";
          ctx.beginPath();
          ctx.moveTo(obs.width / 2, -2);
          ctx.lineTo(obs.width / 2 + 6, 0);
          ctx.lineTo(obs.width / 2, 2);
          ctx.closePath();
          ctx.fill();

        } else if (obs.type === "hanging_lamp") {
          // Cozy overhead hanging lamp (requires ducking!)
          // Draw thin wire hanging from the top down to the lampshade
          ctx.strokeStyle = "#475569";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, -obs.height / 2);
          ctx.lineTo(0, -6);
          ctx.stroke();

          // Amber warm lampshade (bell-shaped dome)
          ctx.fillStyle = "#ea580c"; // warm orange shade
          ctx.beginPath();
          ctx.moveTo(-14, 10);
          ctx.quadraticCurveTo(-12, -8, 0, -8);
          ctx.quadraticCurveTo(12, -8, 14, 10);
          ctx.closePath();
          ctx.fill();

          // Warm glowing yellow bulb inside
          ctx.fillStyle = "#fef08a";
          ctx.beginPath();
          ctx.arc(0, 11, 4.5, 0, Math.PI * 2);
          ctx.fill();

          // Soft ambient warm glow light cone spilling down
          let glowGrad = ctx.createLinearGradient(0, 11, 0, obs.height / 2 + 20);
          glowGrad.addColorStop(0, "rgba(253, 224, 71, 0.4)");
          glowGrad.addColorStop(1, "rgba(253, 224, 71, 0)");
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.moveTo(-5, 11);
          ctx.lineTo(-24, obs.height / 2 + 20);
          ctx.lineTo(24, obs.height / 2 + 20);
          ctx.lineTo(5, 11);
          ctx.closePath();
          ctx.fill();

        } else if (obs.type === "toy_mouse_dangling") {
          // Cute dangling plush toy mouse (requires ducking!)
          // Dangling elastic string
          ctx.strokeStyle = "#94a3b8";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, -obs.height / 2);
          ctx.lineTo(0, 0);
          ctx.stroke();

          // Plush mouse body
          ctx.fillStyle = "#64748b"; // slate plush gray
          ctx.beginPath();
          ctx.ellipse(0, 14, 10, 14, 0, 0, Math.PI * 2);
          ctx.fill();

          // Pink ears
          ctx.fillStyle = "#fda4af"; // pink ears
          ctx.beginPath();
          ctx.arc(-8, 5, 4, 0, Math.PI * 2);
          ctx.arc(8, 5, 4, 0, Math.PI * 2);
          ctx.fill();

          // Long thin tail waving upward
          ctx.strokeStyle = "#fda4af";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(0, -2);
          ctx.quadraticCurveTo(-6, -14, -4, -22);
          ctx.stroke();

          // Little bead eyes
          ctx.fillStyle = "#0f172a";
          ctx.beginPath();
          ctx.arc(-3, 16, 1.2, 0, Math.PI * 2);
          ctx.arc(3, 16, 1.2, 0, Math.PI * 2);
          ctx.fill();

          // Pink nose
          ctx.fillStyle = "#f43f5e";
          ctx.beginPath();
          ctx.arc(0, 24, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // 3. Draw Goldfish Treats (Fish)
      s.fishTreats.forEach((fish) => {
        if (fish.collected) return;
        ctx.save();
        const hoverY = fish.y + Math.sin(fish.oscillateOffset) * 2;
        ctx.translate(fish.x + fish.width / 2, hoverY + fish.height / 2);

        // Goldfish body
        ctx.fillStyle = "#f97316"; // Bright Orange
        ctx.beginPath();
        ctx.ellipse(0, 0, fish.width / 2, fish.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Fishtail
        ctx.fillStyle = "#fb923c"; // Lighter orange
        ctx.beginPath();
        ctx.moveTo(-fish.width / 2, 0);
        ctx.lineTo(-fish.width / 2 - 6, -fish.height / 2 - 1);
        ctx.lineTo(-fish.width / 2 - 3, 0);
        ctx.lineTo(-fish.width / 2 - 6, fish.height / 2 + 1);
        ctx.closePath();
        ctx.fill();

        // Eye
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(4, -2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(4.5, -2, 1, 0, Math.PI * 2);
        ctx.fill();

        // Sparkling back glow
        ctx.fillStyle = "rgba(251, 146, 60, 0.3)";
        ctx.beginPath();
        ctx.arc(0, 0, fish.width * 0.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // 4. Draw Particles
      s.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        const alpha = 1 - p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0; // reset
      });

      // 5. Draw the Cute Cat Hero!
      ctx.save();
      
      // Cat base coordinate is relative to ground level
      const catDrawY = s.groundY - s.cat.y;
      ctx.translate(s.cat.x, catDrawY);

      const isGameOver = (gameState === GameState.GAME_OVER);
      const isDucking = s.cat.isDucking;
      const isJumping = s.cat.isJumping;

      // Running body cycle offsets
      const legOsc = Math.sin(s.cat.runFrame);
      const legOsc2 = Math.cos(s.cat.runFrame);
      const tailOsc = Math.sin(s.gameTime * 0.1) * 0.15;
      
      // Cat Colors
      const coat = selectedSkin.color;
      const stripe = selectedSkin.stripeColor || coat;
      const ears = selectedSkin.earColor;
      const eyes = selectedSkin.eyeColor;

      // A. Tail
      ctx.save();
      ctx.translate(6, -18);
      ctx.rotate(tailOsc - (isJumping ? 0.3 : 0) + (isDucking ? 0.3 : 0));
      ctx.strokeStyle = coat;
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-14, -14, -6, -24);
      ctx.stroke();
      // White tail tip
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-10, -20);
      ctx.quadraticCurveTo(-9, -22, -6, -24);
      ctx.stroke();
      ctx.restore();

      // B. Running Legs (Skip if ducking as legs tuck underneath)
      if (!isDucking) {
        ctx.strokeStyle = coat;
        ctx.lineWidth = 5;
        ctx.lineCap = "round";

        // Back Leg 1
        ctx.beginPath();
        ctx.moveTo(16, -6);
        ctx.lineTo(12 + legOsc * 8, 0);
        ctx.stroke();
        // White paws
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(12 + legOsc * 8, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        // Back Leg 2
        ctx.strokeStyle = stripe; // darker background leg
        ctx.beginPath();
        ctx.moveTo(22, -6);
        ctx.lineTo(24 - legOsc * 8, 0);
        ctx.stroke();
        ctx.fillStyle = "#f5f5f4";
        ctx.beginPath();
        ctx.arc(24 - legOsc * 8, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        // Front Leg 1
        ctx.strokeStyle = coat;
        ctx.beginPath();
        ctx.moveTo(42, -6);
        ctx.lineTo(38 - legOsc2 * 8, 0);
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(38 - legOsc2 * 8, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        // Front Leg 2
        ctx.strokeStyle = stripe;
        ctx.beginPath();
        ctx.moveTo(46, -6);
        ctx.lineTo(48 + legOsc2 * 8, 0);
        ctx.stroke();
        ctx.fillStyle = "#f5f5f4";
        ctx.beginPath();
        ctx.arc(48 + legOsc2 * 8, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Ducking/sliding flat paws
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(15, -1, 6, 2.5, 0, 0, Math.PI * 2);
        ctx.ellipse(45, -1, 6, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // C. Body
      // Body shape changes based on Duck or Normal
      ctx.fillStyle = coat;
      ctx.beginPath();
      if (isDucking) {
        // Flattened longer body capsule
        ctx.roundRect(8, -18, 44, 18, [6, 12, 4, 6]);
      } else {
        // Cute plump body capsule
        ctx.roundRect(10, -32, 42, 28, [12, 16, 8, 12]);
      }
      ctx.fill();

      // Stripes on body back
      ctx.fillStyle = stripe;
      if (selectedSkin.stripeColor) {
        if (isDucking) {
          ctx.fillRect(20, -18, 3, 10);
          ctx.fillRect(28, -18, 3, 10);
          ctx.fillRect(36, -18, 3, 10);
        } else {
          ctx.fillRect(18, -32, 3, 16);
          ctx.fillRect(26, -32, 3, 18);
          ctx.fillRect(34, -32, 3, 16);
        }
      }

      // White chest/tuxedo marker
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      if (isDucking) {
        ctx.ellipse(40, -8, 6, 7, 0, 0, Math.PI * 2);
      } else {
        ctx.ellipse(42, -18, 8, 11, -0.1, 0, Math.PI * 2);
      }
      ctx.fill();

      // D. Head
      ctx.save();
      if (isDucking) {
        ctx.translate(46, -16);
      } else {
        ctx.translate(44, -32);
      }

      // Head circle
      ctx.fillStyle = coat;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();

      // Cheeks white fluffy dots
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(4, 5, 4.5, 0, Math.PI * 2);
      ctx.arc(-2, 5, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Nose
      ctx.fillStyle = ears; // pink
      ctx.beginPath();
      ctx.moveTo(1, 1);
      ctx.lineTo(3, 1);
      ctx.lineTo(2, 3);
      ctx.closePath();
      ctx.fill();

      // Whiskers
      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = 1.2;
      // Right side whiskers
      ctx.beginPath();
      ctx.moveTo(5, 2);
      ctx.lineTo(13, 1);
      ctx.moveTo(5, 3.5);
      ctx.lineTo(14, 4);
      // Left side whiskers
      ctx.moveTo(-5, 2);
      ctx.lineTo(-12, 1);
      ctx.moveTo(-5, 3.5);
      ctx.lineTo(-13, 4);
      ctx.stroke();

      // Ears (Triangles)
      // Left ear
      ctx.fillStyle = coat;
      ctx.beginPath();
      ctx.moveTo(-11, -5);
      ctx.lineTo(-13, -19);
      ctx.lineTo(-4, -11);
      ctx.closePath();
      ctx.fill();
      // Left ear pink inner
      ctx.fillStyle = ears;
      ctx.beginPath();
      ctx.moveTo(-9, -7);
      ctx.lineTo(-11, -16);
      ctx.lineTo(-5, -11);
      ctx.closePath();
      ctx.fill();

      // Right ear
      ctx.fillStyle = coat;
      ctx.beginPath();
      ctx.moveTo(1, -12);
      ctx.lineTo(5, -20);
      ctx.lineTo(8, -6);
      ctx.closePath();
      ctx.fill();
      // Right ear inner
      ctx.fillStyle = ears;
      ctx.beginPath();
      ctx.moveTo(1, -10);
      ctx.lineTo(4, -17);
      ctx.lineTo(6, -6);
      ctx.closePath();
      ctx.fill();

      // Eyes
      if (isGameOver) {
        // "X X" spiral eyes for game over
        ctx.strokeStyle = "#374151";
        ctx.lineWidth = 1.8;
        // Left X
        ctx.beginPath();
        ctx.moveTo(-8, -4);
        ctx.lineTo(-4, 0);
        ctx.moveTo(-4, -4);
        ctx.lineTo(-8, 0);
        // Right X
        ctx.moveTo(1, -4);
        ctx.lineTo(5, 0);
        ctx.moveTo(5, -4);
        ctx.lineTo(1, 0);
        ctx.stroke();

        // Sad mouth
        ctx.strokeStyle = "#374151";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(1.5, 6, 2, Math.PI, 0, true);
        ctx.stroke();

        // Cute bandage on cheek
        ctx.fillStyle = "#fef08a"; // yellow bandage
        ctx.fillRect(-10, 2, 6, 3);
        ctx.fillStyle = "#fca5a5";
        ctx.fillRect(-8, 2, 2, 3);

      } else {
        // Cute expressive eyes
        ctx.fillStyle = "#ffffff";
        // Left sclera
        ctx.beginPath();
        ctx.ellipse(-5, -2, 3.5, 4.5, 0, 0, Math.PI * 2);
        ctx.ellipse(3, -2, 3.5, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Iris
        ctx.fillStyle = eyes;
        ctx.beginPath();
        ctx.arc(-5, -2, 2.5, 0, Math.PI * 2);
        ctx.arc(3, -2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        if (isDucking) {
          // Closed happy eye curves
          ctx.fillStyle = coat; // overlay
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(-5, -2, 3, 0, Math.PI, true);
          ctx.arc(3, -2, 3, 0, Math.PI, true);
          ctx.stroke();
        } else {
          // Centered pupils
          ctx.arc(-5, -2, 1.3, 0, Math.PI * 2);
          ctx.arc(3, -2, 1.3, 0, Math.PI * 2);
          ctx.fill();

          // Sparkly highlights
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(-6, -3, 0.8, 0, Math.PI * 2);
          ctx.arc(2, -3, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore(); // head

      ctx.restore(); // cat coordinate system

      // If playing, render current HUD score & fishes in top corners
      if (gameState === GameState.PLAYING) {
        // Score on Left
        ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
        ctx.roundRect(16, 16, 120, 28, 8);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px system-ui";
        ctx.fillText(`Рахунок: ${Math.floor(s.score)}`, 26, 34);

        // Collected fish on Right
        ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
        ctx.roundRect(canvas.width - 136, 16, 120, 28, 8);
        ctx.fill();
        ctx.fillStyle = "#fb923c"; // Orange fish color
        ctx.beginPath();
        ctx.ellipse(canvas.width - 116, 30, 7, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(canvas.width - 122, 30);
        ctx.lineTo(canvas.width - 126, 26);
        ctx.lineTo(canvas.width - 126, 34);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px system-ui";
        ctx.fillText(`Рибки: +${s.fishCollectedThisRun}`, canvas.width - 102, 34);
      }

      // Keep looping if playing
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, selectedSkin, highScore]);

  // Handle auto-fitting with resizing element
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      // Keep standard layout size
      canvas.width = 640;
      canvas.height = 360;
    };

    handleResize();

    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center w-full max-w-2xl mx-auto overflow-hidden bg-slate-100 rounded-2xl shadow-xl border-4 border-amber-200/60"
    >
      {/* Sound Overlay Toggle Button */}
      <button
        id="sound-toggle-btn"
        onClick={handleMuteToggle}
        className="absolute top-4 left-4 z-30 p-2 text-slate-700 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-slate-50 border border-slate-200 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title={isMuted ? "Увімкнути звук" : "Вимкнути звук"}
      >
        {isMuted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-emerald-500" />}
      </button>

      {/* Render Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleTouchStart}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        className="w-full h-auto aspect-[16/9] block cursor-pointer select-none bg-sky-100"
      />

      {/* Screen Overlays depending on state */}
      {gameState === GameState.START && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/45 backdrop-blur-xs text-center p-3 select-none animate-fade-in">
          <div className="bg-white/95 p-4 md:p-6 rounded-2xl shadow-2xl border-4 border-amber-400 max-w-sm w-full max-h-[95%] overflow-y-auto flex flex-col items-center transform scale-100 transition-transform">
            <div className="w-10 h-10 md:w-16 md:h-16 bg-amber-100 rounded-full flex items-center justify-center text-xl md:text-3xl mb-2 md:mb-4 animate-bounce">
              🐱
            </div>
            <h1 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight mb-1 md:mb-2">Кіт-Раннер</h1>
            <p className="text-[10px] md:text-xs text-slate-600 mb-3 md:mb-5 leading-relaxed">
              Керуй милим котиком! Перестрибуй через коробки і клубочки ниток, пригинайся під метеликами та збирай смачні рибки!
            </p>

            <div className="text-left w-full text-[10px] md:text-xs space-y-1 bg-amber-50 p-2 md:p-3 rounded-lg border border-amber-100 mb-3 md:mb-5 text-slate-700">
              <div className="font-bold text-amber-800 mb-0.5 md:mb-1">🎮 Керування:</div>
              <div>• <span className="font-semibold text-amber-900">Пробіл / Стрілка Вгору / Клік вгорі</span> — Стрибок</div>
              <div>• <span className="font-semibold text-amber-900">Стрілка Вниз / Затиснути внизу</span> — Присісти</div>
            </div>

            <button
              id="start-game-btn"
              onClick={startGame}
              className="w-full py-2 md:py-3 px-4 md:px-6 text-xs md:text-sm font-bold text-white bg-amber-500 rounded-xl hover:bg-amber-600 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              Грати зараз! 🐾
            </button>
          </div>
        </div>
      )}

      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-rose-950/40 backdrop-blur-xs text-center p-3 select-none">
          <div className="bg-white/95 p-4 md:p-6 rounded-2xl shadow-2xl border-4 border-rose-400 max-w-sm w-full max-h-[95%] overflow-y-auto flex flex-col items-center">
            <div className="w-10 h-10 md:w-16 md:h-16 bg-rose-100 rounded-full flex items-center justify-center text-xl md:text-3xl mb-2 md:mb-4">
              😿
            </div>
            <h2 className="text-lg md:text-2xl font-black text-rose-600 tracking-tight mb-0.5 md:mb-1">Ой! Котик стомився</h2>
            <p className="text-[10px] md:text-xs text-slate-500 mb-2 md:mb-4 font-semibold">
              Зіткнення з перешкодою!
            </p>

            {/* Score Summary */}
            <div className="grid grid-cols-2 gap-2 md:gap-4 w-full p-2 md:p-3 bg-slate-50 border border-slate-100 rounded-xl mb-3 md:mb-5 text-center">
              <div className="flex flex-col items-center justify-center border-r border-slate-200">
                <span className="text-[9px] md:text-[10px] uppercase tracking-wider text-slate-400 font-bold">Рахунок</span>
                <span className="text-base md:text-xl font-extrabold text-slate-800">{currentScore}</span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <span className="text-[9px] md:text-[10px] uppercase tracking-wider text-slate-400 font-bold">Рибки</span>
                <span className="text-base md:text-xl font-extrabold text-amber-500 flex items-center gap-1">
                  +{sessionFish} <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-amber-400 animate-pulse" />
                </span>
              </div>
            </div>

            {currentScore >= highScore && currentScore > 0 && (
              <div className="flex items-center gap-1 text-[10px] md:text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 md:px-3 md:py-1 rounded-full border border-emerald-100 mb-3 md:mb-4 animate-bounce">
                <Trophy className="w-3.5 h-3.5" /> Новий рекорд!
              </div>
            )}

            <button
              id="restart-game-btn"
              onClick={startGame}
              className="w-full py-2 md:py-3 px-4 md:px-6 text-xs md:text-sm font-bold text-white bg-rose-500 rounded-xl hover:bg-rose-600 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" /> Спробувати знову!
            </button>
          </div>
        </div>
      )}

      {/* On-screen control pads for highly responsive mobile, tablet & desktop mouse gameplay */}
      {gameState === GameState.PLAYING && (
        <div className="absolute inset-x-4 bottom-4 flex justify-between pointer-events-none z-20">
          {/* Jump Button */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleJump(); }}
            onMouseDown={(e) => { e.preventDefault(); handleJump(); }}
            className="pointer-events-auto w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center text-white text-[8px] md:text-[9px] font-extrabold border border-white/20 active:scale-90 hover:scale-105 transition-all select-none cursor-pointer shadow-md"
            title="Стрибок (Space)"
          >
            <ArrowUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-300" />
            <span className="tracking-tighter">СТРИБОК</span>
          </button>

          {/* Duck/Slide Button */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleDuck(true); }}
            onTouchEnd={(e) => { e.preventDefault(); handleDuck(false); }}
            onMouseDown={(e) => { e.preventDefault(); handleDuck(true); }}
            onMouseUp={(e) => { e.preventDefault(); handleDuck(false); }}
            onMouseLeave={() => handleDuck(false)}
            className="pointer-events-auto w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center text-white text-[8px] md:text-[9px] font-extrabold border border-white/20 active:scale-90 hover:scale-105 transition-all select-none cursor-pointer shadow-md"
            title="Присісти (Arrow Down)"
          >
            <ArrowDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-300" />
            <span className="tracking-tighter">ПРИСІСТИ</span>
          </button>
        </div>
      )}

      {/* Touch action hints overlay for active gameplay */}
      {gameState === GameState.PLAYING && (
        <div className="absolute inset-x-0 bottom-2 px-4 pointer-events-none flex justify-center text-[9px] text-slate-500 font-semibold opacity-50">
          <span>Клавіші: Стрілки ↑↓ або Пробіл</span>
        </div>
      )}
    </div>
  );
}
