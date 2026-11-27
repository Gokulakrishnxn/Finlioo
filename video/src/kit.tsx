import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "./theme";

export const ease = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const prog = (frame: number, start: number, dur: number, e = ease) =>
  interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing: e });

export const usePop = (at: number, damping = 15, stiffness = 170) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - at, fps, config: { damping, mass: 0.7, stiffness } });
};

/** Dark stage with a moving green aurora and a faint grid. Quick in/out so cuts feel snappy. */
export const Stage: React.FC<{ dur: number; children: React.ReactNode; glow?: string; zoom?: number }> = ({
  dur,
  children,
  glow = C.gain,
  zoom = 0.06,
}) => {
  const f = useCurrentFrame();
  const inn = prog(f, 0, 8);
  const out = 1 - prog(f, dur - 6, 6, easeIn);
  const z = interpolate(f, [0, dur], [1, 1 + zoom]);
  const gx = 50 + Math.sin(f / 50) * 12;
  const gy = 30 + Math.cos(f / 60) * 8;
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 55% at ${gx}% ${gy}%, ${glow}33 0%, transparent 70%), radial-gradient(50% 50% at ${100 - gx}% 95%, ${C.blue}1f 0%, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(70% 70% at 50% 50%, black, transparent)",
          WebkitMaskImage: "radial-gradient(70% 70% at 50% 50%, black, transparent)",
          transform: `translateY(${(f * 0.6) % 80}px)`,
        }}
      />
      <AbsoluteFill style={{ opacity: inn * out, transform: `scale(${z * (0.96 + 0.04 * inn)})`, filter: `blur(${(1 - inn) * 10 + (1 - out) * 14}px)` }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const center: React.CSSProperties = { alignItems: "center", justifyContent: "center", flexDirection: "column" };

export const H: React.CSSProperties = {
  fontFamily: FONT.sans,
  fontWeight: 700,
  fontSize: 120,
  letterSpacing: "-0.045em",
  lineHeight: 1,
  color: C.ink,
  textAlign: "center",
};

export const Label: React.CSSProperties = {
  fontFamily: FONT.sans,
  fontSize: 20,
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: C.muted,
};

/** Kinetic line: slides up out of a mask, word by word. */
export const Kinetic: React.FC<{ text: string; at: number; every?: number; style?: React.CSSProperties; accent?: string[] }> = ({
  text,
  at,
  every = 2,
  style,
  accent = [],
}) => {
  const f = useCurrentFrame();
  return (
    <div style={{ ...H, ...style }}>
      {text.split(" ").map((w, i) => {
        const p = prog(f, at + i * every, 14);
        const hot = accent.includes(w.replace(/[.,?!]/g, ""));
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: "0.08em", marginRight: "0.22em" }}>
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - p) * 105}%)`,
                color: hot ? C.gain : undefined,
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </div>
  );
};

export const Glass: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div
    style={{
      background: `linear-gradient(180deg, ${C.glassHi}, ${C.glass})`,
      border: `1px solid ${C.edge}`,
      borderRadius: 28,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 30px 80px rgba(0,0,0,0.5)",
      backdropFilter: "blur(24px)",
      fontFamily: FONT.sans,
      color: C.ink,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Card entrance: rises, scales and sharpens. */
export const enter = (p: number, dy = 70): React.CSSProperties => ({
  opacity: Math.min(1, p * 1.4),
  transform: `translateY(${(1 - p) * dy}px) scale(${0.94 + 0.06 * p})`,
  filter: `blur(${Math.max(0, 1 - p) * 8}px)`,
});

export const inr = (n: number) => {
  const neg = n < 0;
  const s = Math.round(Math.abs(n)).toString();
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${neg ? "−" : ""}₹${rest ? rest + "," : ""}${last3}`;
};
export const lakh = (v: number) => (v < 100000 ? `₹${Math.round(v / 1000)}K` : `₹${(v / 100000).toFixed(1)}L`);

export const typed = (frame: number, at: number, text: string, cps = 40) => {
  const n = Math.max(0, Math.floor(((frame - at) / 30) * cps));
  return Array.from(text).slice(0, n).join("");
};
export const streamWords = (frame: number, at: number, text: string, perWord = 1.6) =>
  text.split(" ").slice(0, Math.max(0, Math.floor((frame - at) / perWord))).join(" ");

export const Caret: React.FC<{ color?: string }> = ({ color = C.gain }) => {
  const f = useCurrentFrame();
  return (
    <span style={{ display: "inline-block", width: 3, height: "1em", marginLeft: 4, verticalAlign: "-0.12em", background: color, opacity: Math.floor(f / 12) % 2 ? 0.2 : 1 }} />
  );
};

/** Film grain + vignette over everything. */
export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "radial-gradient(80% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.45) 100%)" }} />
      <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.07, mixBlendMode: "overlay" }}>
        <filter id="g">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 12} />
        </filter>
        <rect width="100%" height="100%" filter="url(#g)" />
      </svg>
    </AbsoluteFill>
  );
};
