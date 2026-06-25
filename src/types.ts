export enum GameState {
  START = "START",
  PLAYING = "PLAYING",
  GAME_OVER = "GAME_OVER",
}

export interface CatSkin {
  id: string;
  name: string;
  color: string; // Hex or CSS color
  stripeColor?: string;
  eyeColor: string;
  earColor: string;
  cost: number; // Cost in fish
  description: string;
}

export const CAT_SKINS: CatSkin[] = [
  {
    id: "ginger",
    name: "Рудик 🍊",
    color: "#f59e0b", // Amber 500
    stripeColor: "#b45309", // Amber 700
    eyeColor: "#10b981", // Emerald 500
    earColor: "#fca5a5", // Red 300
    cost: 0,
    description: "Звичайний, веселий рудий котик. Любить грітися на сонечку."
  },
  {
    id: "grey_tux",
    name: "Смоккі 🐾",
    color: "#4b5563", // Gray 600
    stripeColor: "#1f2937", // Gray 800
    eyeColor: "#facc15", // Yellow 400
    earColor: "#fca5a5", // Red 300
    cost: 15,
    description: "Шляхетний димчастий котик у білих шкарпетках."
  },
  {
    id: "black",
    name: "Вуглик 🐈‍⬛",
    color: "#111827", // Gray 900
    stripeColor: "#374151", // Gray 700
    eyeColor: "#a3e635", // Lime 400
    earColor: "#fda4af", // Rose 300
    cost: 35,
    description: "Приносить лише удачу та багато-багато веселощів!"
  },
  {
    id: "siamese",
    name: "Кокос 🥥",
    color: "#f5f5f4", // Stone 100
    stripeColor: "#78716c", // Dark paws/ears (Stone 600)
    eyeColor: "#0ea5e9", // Sky 500
    earColor: "#78716c", // Stone 600
    cost: 60,
    description: "Елегантний сіамський красунчик з блакитними очима."
  }
];

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "box" | "yarn" | "bird" | "scratch_post";
  speedMultiplier: number;
  rotation: number; // for yarn ball
  pulse: number; // for scaling effects
}

export interface FishTreat {
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
  oscillateOffset: number; // for hovering animation
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}
