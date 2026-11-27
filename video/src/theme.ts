import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadTamil } from "@remotion/google-fonts/NotoSansTamil";
import { loadFont as loadDeva } from "@remotion/google-fonts/NotoSansDevanagari";
import { loadFont as loadTelugu } from "@remotion/google-fonts/NotoSansTelugu";
import { loadFont as loadKannada } from "@remotion/google-fonts/NotoSansKannada";

const sans = loadGeist("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] }).fontFamily;
const mono = loadGeistMono("normal", { weights: ["400", "500"], subsets: ["latin"] }).fontFamily;
const tamil = loadTamil("normal", { weights: ["400", "500"], subsets: ["tamil"] }).fontFamily;
const deva = loadDeva("normal", { weights: ["400", "500"], subsets: ["devanagari"] }).fontFamily;
const telugu = loadTelugu("normal", { weights: ["500"], subsets: ["telugu"] }).fontFamily;
const kannada = loadKannada("normal", { weights: ["500"], subsets: ["kannada"] }).fontFamily;

export const FONT = {
  sans: `${sans}, ${tamil}, ${deva}, ${telugu}, ${kannada}, sans-serif`,
  mono: `${mono}, monospace`,
};

// Dark SaaS stage, Finlio green as the one accent.
export const C = {
  bg: "#08090A",
  bg2: "#0E1012",
  glass: "rgba(255,255,255,0.055)",
  glassHi: "rgba(255,255,255,0.09)",
  edge: "rgba(255,255,255,0.10)",
  ink: "#F5F6F4",
  body: "rgba(245,246,244,0.68)",
  muted: "rgba(245,246,244,0.42)",
  gain: "#3DDC6B",
  gainDim: "rgba(61,220,107,0.14)",
  loss: "#FF6B5E",
  lossDim: "rgba(255,107,94,0.14)",
  gold: "#F2C75C",
  blue: "#6AA8FF",
  violet: "#A98BFF",
  teal: "#4FD1C5",
};

export const FPS = 30;
export const s = (sec: number) => Math.round(sec * FPS);
/** 120 BPM: one beat = 0.5 s = 15 frames. */
export const BEAT = 15;
