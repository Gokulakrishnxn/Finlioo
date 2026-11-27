// Original icon set for the film, drawn on a 24px grid (1.8px strokes). No third-party icons or logos.
import React from "react";
import { Img, staticFile } from "remotion";
import { FONT } from "./theme";

type P = { size?: number; color?: string };
const Svg: React.FC<P & { children: React.ReactNode }> = ({ size = 28, color = "currentColor", children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

export const I = {
  stocks: (p: P) => (
    <Svg {...p}>
      <path d="M6 4v3M6 15v5M12 3v4M12 13v3M18 6v3M18 16v4" />
      <rect x="4" y="7" width="4" height="8" rx="1.2" />
      <rect x="10" y="7" width="4" height="6" rx="1.2" />
      <rect x="16" y="9" width="4" height="7" rx="1.2" />
    </Svg>
  ),
  funds: (p: P) => (
    <Svg {...p}>
      <path d="M12 3a9 9 0 1 0 9 9h-9z" />
      <path d="M15 3.5A9 9 0 0 1 20.5 9H15z" />
    </Svg>
  ),
  epf: (p: P) => (
    <Svg {...p}>
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18M11 12.5v2h2v-2" />
    </Svg>
  ),
  gold: (p: P) => (
    <Svg {...p}>
      <path d="M3 20l2.2-6h5.6L13 20zM11 20l2.2-6h5.6L21 20zM7 14l2.2-6h5.6L17 14z" />
    </Svg>
  ),
  fd: (p: P) => (
    <Svg {...p}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 8v1.5M12 14.5V16M8 12h1.5M14.5 12H16M7 20v1.5M17 20v1.5" />
    </Svg>
  ),
  ppf: (p: P) => (
    <Svg {...p}>
      <path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z" />
      <path d="M9 13c0-2.5 2-4.5 6-4.5 0 3.5-2 5.5-4.5 5.5M9 16l3-3" />
    </Svg>
  ),
  home: (p: P) => (
    <Svg {...p}>
      <path d="M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-5h4v5" />
    </Svg>
  ),
  wallet: (p: P) => (
    <Svg {...p}>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" />
      <rect x="4" y="8" width="17" height="12" rx="2.5" />
      <path d="M16 14h2" />
    </Svg>
  ),
  sun: (p: P) => (
    <Svg {...p}>
      <path d="M3 18h18M6 18a6 6 0 0 1 12 0M12 6V3.5M5.6 9.6 4 8M18.4 9.6 20 8M8 21h8" />
    </Svg>
  ),
  chat: (p: P) => (
    <Svg {...p}>
      <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12z" />
      <path d="M9 11h.01M12 11h.01M15 11h.01" strokeWidth={2.6} />
    </Svg>
  ),
  target: (p: P) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 12l7-7M16 5h3v3" />
    </Svg>
  ),
  chart: (p: P) => (
    <Svg {...p}>
      <path d="M4 4v16h16" />
      <path d="M7.5 15l3.5-4 3 2.5L19 7" />
    </Svg>
  ),
  lock: (p: P) => (
    <Svg {...p}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2.5" />
    </Svg>
  ),
  download: (p: P) => (
    <Svg {...p}>
      <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14" />
    </Svg>
  ),
  globe: (p: P) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5s1-5.9 3.5-8.5z" />
    </Svg>
  ),
  check: (p: P) => (
    <Svg {...p}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Svg>
  ),
  card: (p: P) => (
    <Svg {...p}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M3 10h18M7 15h3" />
    </Svg>
  ),
};

export type IconName = keyof typeof I;

/** Rounded tile holding an icon, tinted. */
export const Tile: React.FC<{ name: IconName; color: string; size?: number }> = ({ name, color, size = 56 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.3,
      display: "grid",
      placeItems: "center",
      color,
      background: `linear-gradient(160deg, ${color}30, ${color}12)`,
      border: `1px solid ${color}40`,
      flexShrink: 0,
    }}
  >
    {I[name]({ size: size * 0.52 })}
  </div>
);

/**
 * Stock badge: an original monogram tile per company (not the company's logo or colours),
 * so the film shows real NSE names without using anyone's trademarks.
 */
export const STOCKS = {
  TCS: { name: "Tata Consultancy", mono: "TC", hue: 212 },
  RELIANCE: { name: "Reliance Industries", mono: "RI", hue: 265 },
  HDFCBANK: { name: "HDFC Bank", mono: "HB", hue: 190 },
  INFY: { name: "Infosys", mono: "IN", hue: 160 },
  ITC: { name: "ITC", mono: "IT", hue: 35 },
} as const;
export type Ticker = keyof typeof STOCKS;

export const StockBadge: React.FC<{ t: Ticker; size?: number }> = ({ t, size = 56 }) => {
  const h = STOCKS[t].hue;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        display: "grid",
        placeItems: "center",
        background: `linear-gradient(145deg, hsl(${h} 70% 62%), hsl(${h + 25} 65% 42%))`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 20px hsl(${h} 70% 30% / 0.45)`,
        fontFamily: FONT.sans,
        fontWeight: 700,
        fontSize: size * 0.34,
        letterSpacing: "-0.04em",
        color: "#fff",
        flexShrink: 0,
      }}
    >
      {STOCKS[t].mono}
    </div>
  );
};

/** The real Finlio mark (public/mark-crop.png), shown white on the dark stage. */
export const Mark: React.FC<{ size?: number; dark?: boolean; style?: React.CSSProperties }> = ({ size = 120, dark, style }) => (
  <Img src={staticFile("mark-crop.png")} style={{ width: size, filter: dark ? undefined : "invert(1)", ...style }} />
);
