// 0:14–1:30 — the fast product cut. One idea per beat. Figures are an invented household.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BEAT, C, FONT } from "../theme";
import { Caret, Glass, H, Kinetic, Label, Stage, center, clamp, ease, enter, inr, lakh, prog, streamWords, typed, usePop } from "../kit";
import { I, IconName, Mark, STOCKS, StockBadge, Ticker, Tile } from "../icons";

const Title: React.FC<{ text: string; kicker?: string; accent?: string[] }> = ({ text, kicker, accent }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top: 90, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      {kicker && <div style={{ ...Label, color: C.gain, opacity: prog(f, 0, 10) }}>{kicker}</div>}
      <Kinetic text={text} at={2} style={{ fontSize: 84 }} accent={accent} />
    </div>
  );
};

/* 0:14 — hook */
export const Hook: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const swap = 4 * BEAT;
  return (
    <Stage dur={dur} zoom={0.1}>
      <AbsoluteFill style={center}>
        {f < swap ? (
          <Kinetic text="Every rupee." at={0} every={3} style={{ fontSize: 190 }} />
        ) : (
          <Kinetic text="Finally clear." at={swap} every={3} style={{ fontSize: 190 }} accent={["clear"]} />
        )}
      </AbsoluteFill>
    </Stage>
  );
};

/* 0:18 — logo slam */
export const Logo: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const m = usePop(2, 11, 220);
  const ring = prog(f, 2, 40);
  const word = prog(f, 12, 16);
  return (
    <Stage dur={dur} zoom={0.05}>
      <AbsoluteFill style={center}>
        <div
          style={{
            position: "absolute",
            width: 300 + ring * 1200,
            height: 300 + ring * 1200,
            borderRadius: 9999,
            border: `2px solid ${C.gain}`,
            opacity: (1 - ring) * 0.7,
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
          <Mark size={210} style={{ transform: `scale(${0.4 + 0.6 * m}) rotate(${(1 - m) * -20}deg)`, opacity: Math.min(1, m * 2) }} />
          <div style={{ ...H, fontSize: 230, letterSpacing: "-0.06em", opacity: word, transform: `translateX(${(1 - word) * -40}px)`, filter: `blur(${(1 - word) * 12}px)` }}>
            Finlio
          </div>
        </div>
        <div style={{ marginTop: 40, opacity: prog(f, 40, 14) }}>
          <Kinetic text="All your money. One place." at={40} every={2} style={{ fontSize: 52, fontWeight: 500, color: C.body, letterSpacing: "-0.02em" }} />
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

/* 0:22 — rapid fire, one per beat */
const RAPID: { icon: IconName; t: string; c: string }[] = [
  { icon: "stocks", t: "Stocks.", c: C.gain },
  { icon: "funds", t: "Mutual funds.", c: C.blue },
  { icon: "epf", t: "EPF.", c: C.teal },
  { icon: "ppf", t: "PPF & NPS.", c: C.violet },
  { icon: "gold", t: "Gold.", c: C.gold },
  { icon: "fd", t: "Fixed deposits.", c: C.blue },
  { icon: "home", t: "Property.", c: C.teal },
  { icon: "card", t: "Loans.", c: C.loss },
];

export const Rapid: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const i = Math.min(RAPID.length - 1, Math.floor(f / BEAT));
  const local = f - i * BEAT;
  const it = RAPID[i];
  const p = prog(local, 0, 7);
  return (
    <Stage dur={dur} glow={it.c} zoom={0.04}>
      <AbsoluteFill style={center}>
        <div style={{ display: "flex", alignItems: "center", gap: 56, transform: `scale(${1.18 - 0.18 * p})`, opacity: p }}>
          <Tile name={it.icon} color={it.c} size={190} />
          <div style={{ ...H, fontSize: 170 }}>{it.t}</div>
        </div>
        <div style={{ position: "absolute", bottom: 120, display: "flex", gap: 14 }}>
          {RAPID.map((r, k) => (
            <span key={k} style={{ width: k === i ? 42 : 12, height: 12, borderRadius: 99, background: k <= i ? r.c : "rgba(255,255,255,0.15)" }} />
          ))}
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

/* 0:26 — net worth */
const ALLOC: { k: string; v: number; icon: IconName; c: string }[] = [
  { k: "Stocks", v: 1420000, icon: "stocks", c: C.gain },
  { k: "Mutual funds", v: 1180000, icon: "funds", c: C.blue },
  { k: "EPF", v: 840000, icon: "epf", c: C.teal },
  { k: "Fixed deposits", v: 650000, icon: "fd", c: "#7FB2FF" },
  { k: "Gold", v: 410000, icon: "gold", c: C.gold },
  { k: "PPF", v: 362500, icon: "ppf", c: C.violet },
];
const TOTAL = ALLOC.reduce((a, b) => a + b.v, 0);
const CURVE = [30.2, 31.0, 31.6, 32.9, 33.4, 34.1, 35.8, 36.2, 37.4, 38.1, 39.0, 39.8, 41.2, 42.2, 42.9, 44.1, 45.0, 46.3, 47.1, 48.6];

export const NetWorth: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const a = usePop(14);
  const b = usePop(30);
  const draw = prog(f, 24, 60);
  const n = interpolate(f, [20, 80], [0, TOTAL], { ...clamp, easing: ease });
  const W = 900;
  const Hh = 300;
  const pts = CURVE.map((v, i) => [(i / (CURVE.length - 1)) * W, Hh - ((v - 28) / 22) * Hh] as const);
  const path = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const len = 1400;
  const head = pts[Math.min(pts.length - 1, Math.floor(draw * (pts.length - 1)))];
  return (
    <Stage dur={dur}>
      <Title kicker="Net worth" text="See everything. At once." accent={["everything."]} />
      <AbsoluteFill style={{ flexDirection: "row", gap: 32, justifyContent: "center", alignItems: "flex-start", paddingTop: 330 }}>
        <Glass style={{ width: 1010, padding: "44px 52px", ...enter(a) }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={Label}>Total · ₹ INR</span>
            <span style={{ fontSize: 22, fontWeight: 600, color: C.gain, background: C.gainDim, padding: "8px 16px", borderRadius: 99, opacity: prog(f, 80, 10) }}>
              ↗ +16.4% this FY
            </span>
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 112, letterSpacing: "-0.05em", marginTop: 10 }}>{inr(n)}</div>
          <svg width={W} height={Hh + 20} style={{ marginTop: 24, overflow: "visible" }}>
            <defs>
              <linearGradient id="nwfill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={C.gain} stopOpacity={0.35} />
                <stop offset="1" stopColor={C.gain} stopOpacity={0} />
              </linearGradient>
              <clipPath id="nwclip">
                <rect x={0} y={-20} width={W * draw} height={Hh + 40} />
              </clipPath>
            </defs>
            {[0, 1, 2, 3].map((k) => (
              <line key={k} x1={0} x2={W} y1={(k / 3) * Hh} y2={(k / 3) * Hh} stroke="rgba(255,255,255,0.06)" />
            ))}
            <g clipPath="url(#nwclip)">
              <path d={`${path} L${W},${Hh} L0,${Hh} Z`} fill="url(#nwfill)" />
            </g>
            <path d={path} fill="none" stroke={C.gain} strokeWidth={4} strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
            <circle cx={head[0]} cy={head[1]} r={9} fill={C.gain} style={{ filter: `drop-shadow(0 0 12px ${C.gain})` }} />
          </svg>
        </Glass>
        <Glass style={{ width: 560, padding: "40px 40px", ...enter(b) }}>
          <span style={Label}>Where it lives</span>
          <div style={{ display: "flex", height: 14, borderRadius: 99, overflow: "hidden", marginTop: 22, gap: 3 }}>
            {ALLOC.map((x, i) => (
              <div key={x.k} style={{ width: `${(x.v / TOTAL) * 100 * prog(f, 40 + i * 4, 24)}%`, background: x.c, borderRadius: 99 }} />
            ))}
          </div>
          <div style={{ marginTop: 18 }}>
            {ALLOC.map((x, i) => {
              const p = usePop(44 + i * 5, 16, 200);
              return (
                <div key={x.k} style={{ display: "flex", alignItems: "center", gap: 18, padding: "13px 0", ...enter(p, 20) }}>
                  <Tile name={x.icon} color={x.c} size={50} />
                  <span style={{ fontSize: 28, flex: 1, color: C.body }}>{x.k}</span>
                  <span style={{ fontFamily: FONT.mono, fontSize: 28 }}>{lakh(x.v)}</span>
                </div>
              );
            })}
          </div>
        </Glass>
      </AbsoluteFill>
    </Stage>
  );
};

/* 0:36 — holdings, live */
const HOLD: { t: Ticker; px: number; ch: number; seed: number }[] = [
  { t: "TCS", px: 3412.5, ch: -1.9, seed: 1 },
  { t: "RELIANCE", px: 1486.2, ch: 0.6, seed: 2 },
  { t: "HDFCBANK", px: 1742.8, ch: 0.4, seed: 3 },
  { t: "INFY", px: 1612.35, ch: -2.3, seed: 4 },
  { t: "ITC", px: 431.9, ch: 0.2, seed: 5 },
];
const spark = (seed: number, ch: number) =>
  Array.from({ length: 24 }, (_, i) => Math.sin(i * 0.7 + seed * 2) * 0.6 + Math.sin(i * 1.9 + seed) * 0.3 + (i / 23) * ch * 1.2);

export const Holdings: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const card = usePop(10);
  return (
    <Stage dur={dur}>
      <Title kicker="Holdings" text="Every stock. Live." accent={["Live."]} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 320 }}>
        <Glass style={{ width: 1400, padding: "18px 0", ...enter(card) }}>
          <div style={{ display: "flex", padding: "14px 44px", ...Label, fontSize: 17 }}>
            <span style={{ flex: 1 }}>Company</span>
            <span style={{ width: 240, textAlign: "center" }}>Today</span>
            <span style={{ width: 230, textAlign: "right" }}>Price</span>
            <span style={{ width: 170, textAlign: "right" }}>Change</span>
          </div>
          {HOLD.map((h, i) => {
            const p = usePop(18 + i * 6, 16, 200);
            const tick = Math.sin(f / 7 + h.seed * 3) * h.px * 0.0009 + Math.sin(f / 3.3 + h.seed) * h.px * 0.0003;
            const up = h.ch >= 0;
            const col = up ? C.gain : C.loss;
            const sp = spark(h.seed, h.ch);
            const mn = Math.min(...sp);
            const mx = Math.max(...sp);
            const d = sp.map((v, k) => `${k ? "L" : "M"}${(k / 23) * 200},${50 - ((v - mn) / (mx - mn)) * 44}`).join(" ");
            const flash = Math.floor((f + h.seed * 11) / 20) % 4 === 0 && f > 40 ? 1 : 0;
            return (
              <div key={h.t} style={{ display: "flex", alignItems: "center", padding: "18px 44px", borderTop: `1px solid ${C.edge}`, ...enter(p, 24) }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 22 }}>
                  <StockBadge t={h.t} size={60} />
                  <div>
                    <div style={{ fontSize: 30, fontWeight: 600 }}>{STOCKS[h.t].name}</div>
                    <div style={{ fontFamily: FONT.mono, fontSize: 20, color: C.muted, marginTop: 2 }}>NSE · {h.t}</div>
                  </div>
                </div>
                <svg width={240} height={54} style={{ padding: "0 20px" }}>
                  <path d={d} fill="none" stroke={col} strokeWidth={3} strokeDasharray={400} strokeDashoffset={400 * (1 - prog(f, 26 + i * 6, 40))} />
                </svg>
                <span
                  style={{
                    width: 230,
                    textAlign: "right",
                    fontFamily: FONT.mono,
                    fontSize: 32,
                    color: flash ? col : C.ink,
                    textShadow: flash ? `0 0 16px ${col}` : undefined,
                  }}
                >
                  {"₹" + (h.px + tick).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span style={{ width: 170, textAlign: "right" }}>
                  <span style={{ fontFamily: FONT.mono, fontSize: 24, color: col, background: up ? C.gainDim : C.lossDim, padding: "8px 14px", borderRadius: 10 }}>
                    {up ? "+" : "−"}
                    {Math.abs(h.ch).toFixed(1)}%
                  </span>
                </span>
              </div>
            );
          })}
        </Glass>
        <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 12, color: C.muted, fontSize: 22, opacity: prog(f, 60, 12) }}>
          <span style={{ width: 10, height: 10, borderRadius: 99, background: C.gain, boxShadow: `0 0 10px ${C.gain}`, opacity: 0.5 + 0.5 * Math.sin(f / 5) }} />
          Live NSE prices · Illustrative figures
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

/* 0:44 — morning brief */
const B_HEAD = "Your portfolio may open about 0.8% lower.";
const B_BODY = "US tech fell overnight. IT is 22% of what you own, so TCS and Infosys drive most of today's move. Gold, FDs and EPF are unchanged.";

export const Brief: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const card = usePop(12);
  const head = typed(f, 30, B_HEAD, 46);
  const body = streamWords(f, 64, B_BODY, 1.5);
  return (
    <Stage dur={dur} glow={C.gold}>
      <Title kicker="Morning brief · 8:45 AM" text="Know why. Before 9:15." accent={["why."]} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 330 }}>
        <Glass style={{ width: 1300, padding: "52px 64px", ...enter(card) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Tile name="sun" color={C.gold} size={60} />
            <div>
              <div style={{ fontSize: 26, fontWeight: 600 }}>Your morning brief</div>
              <div style={{ fontFamily: FONT.mono, fontSize: 20, color: C.muted }}>Tue · 8:45 AM IST · 30 min before the bell</div>
            </div>
          </div>
          <div style={{ fontSize: 62, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, marginTop: 36, minHeight: 70 }}>
            {head}
            {head.length < B_HEAD.length && f > 28 && <Caret />}
          </div>
          <div style={{ fontSize: 32, lineHeight: 1.5, color: C.body, marginTop: 22, minHeight: 150 }}>{body}</div>
          <div style={{ display: "flex", gap: 14, marginTop: 26 }}>
            {[
              { t: "IT −1.9%", c: C.loss, bg: C.lossDim },
              { t: "Banks flat", c: C.body, bg: "rgba(255,255,255,0.07)" },
              { t: "Gold +0.3%", c: C.gain, bg: C.gainDim },
            ].map((x, i) => {
              const p = usePop(150 + i * 5, 14, 220);
              return (
                <span key={x.t} style={{ fontFamily: FONT.mono, fontSize: 24, padding: "10px 20px", borderRadius: 12, color: x.c, background: x.bg, ...enter(p, 16) }}>
                  {x.t}
                </span>
              );
            })}
          </div>
        </Glass>
      </AbsoluteFill>
    </Stage>
  );
};

/* 0:52 — ask in your language */
const LANGS = ["English", "हिन्दी", "தமிழ்", "తెలుగు", "ಕನ್ನಡ", "मराठी"];
const Q1 = "இன்று என் முதலீடு ஏன் குறைந்தது?";
const A1 = "அமெரிக்க தொழில்நுட்பப் பங்குகள் நேற்றிரவு சரிந்தன. உங்கள் முதலீட்டில் 22% IT பங்குகள் என்பதால், இன்றைய இறக்கத்தின் பெரும்பகுதி அவையே.";
const Q2 = "Should I sell TCS?";
const A2 = "I can't tell you to buy or sell. Here's what changed: TCS fell 2.1% with the IT sector, and it is 9% of your portfolio.";

const Msg: React.FC<{ me?: boolean; at: number; children: React.ReactNode }> = ({ me, at, children }) => {
  const p = usePop(at, 16, 200);
  return (
    <div style={{ display: "flex", justifyContent: me ? "flex-end" : "flex-start", gap: 16, ...enter(p, 24) }}>
      {!me && (
        <div style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(255,255,255,0.08)", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Mark size={28} />
        </div>
      )}
      <div
        style={{
          maxWidth: me ? 720 : 980,
          padding: me ? "18px 28px" : "6px 0",
          borderRadius: 24,
          background: me ? "rgba(255,255,255,0.1)" : "transparent",
          fontSize: 31,
          lineHeight: 1.5,
          color: C.ink,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const Chat: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const card = usePop(10);
  const lang = f < 150 ? 2 : 0;
  const guard = usePop(250, 14, 200);
  return (
    <Stage dur={dur} glow={C.violet}>
      <Title kicker="Ask Finlio" text="Ask in your language." accent={["your"]} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 300 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          {LANGS.map((l, i) => {
            const p = usePop(6 + i * 3, 14, 220);
            const on = i === lang;
            return (
              <span
                key={l}
                style={{
                  fontFamily: FONT.sans,
                  fontSize: 24,
                  fontWeight: 500,
                  padding: "10px 22px",
                  borderRadius: 99,
                  background: on ? C.ink : "rgba(255,255,255,0.06)",
                  color: on ? C.bg : C.body,
                  border: `1px solid ${on ? C.ink : C.edge}`,
                  ...enter(p, 12),
                }}
              >
                {l}
              </span>
            );
          })}
        </div>
        <Glass style={{ width: 1240, height: 560, overflow: "hidden", position: "relative", ...enter(card) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "24px 40px", borderBottom: `1px solid ${C.edge}` }}>
            <span style={{ color: C.gain }}>{I.chat({ size: 28 })}</span>
            <span style={{ fontSize: 24, fontWeight: 600 }}>Ask Finlio</span>
            <span
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 18px",
                borderRadius: 99,
                background: C.gainDim,
                color: C.gain,
                fontSize: 21,
                fontWeight: 600,
                opacity: guard,
                transform: `scale(${0.8 + 0.2 * guard})`,
              }}
            >
              {I.check({ size: 20 })} Explains. Never advises.
            </span>
          </div>
          <div
            style={{
              position: "absolute",
              top: 80,
              left: 0,
              right: 0,
              bottom: 0,
              padding: "30px 46px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              gap: 26,
              overflow: "hidden",
              maskImage: "linear-gradient(to bottom, transparent 0, black 70px)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0, black 70px)",
            }}
          >
            <Msg me at={20}>
              {Q1}
            </Msg>
            <Msg at={56}>{streamWords(f, 60, A1, 2.2)}</Msg>
            {f >= 156 && (
              <Msg me at={156}>
                {typed(f, 160, Q2, 36)}
              </Msg>
            )}
            {f >= 196 && <Msg at={196}>{streamWords(f, 200, A2, 1.6)}</Msg>}
          </div>
        </Glass>
      </AbsoluteFill>
    </Stage>
  );
};

/* 1:02 — bento: goals, analytics, spending, export */
const Ring: React.FC<{ p: number; size: number; color: string }> = ({ p, size, color }) => {
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={14} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round" strokeDasharray={`${c * p} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>
  );
};

const SPEND = [
  { k: "Rent & bills", v: 0.82, c: C.blue },
  { k: "Groceries", v: 0.46, c: C.gain },
  { k: "Food & dining", v: 0.31, c: C.gold },
  { k: "Travel", v: 0.18, c: C.violet },
];

export const Bento: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const t = [usePop(8), usePop(14), usePop(20), usePop(26)];
  const goals = [
    { k: "Home down payment", p: 0.41, c: C.gain },
    { k: "Emergency fund", p: 0.8, c: C.blue },
    { k: "Goa trip", p: 1, c: C.gold },
  ];
  return (
    <Stage dur={dur} zoom={0.035}>
      <Title text="Plan. Track. Export." accent={["Plan.", "Track.", "Export."]} />
      <AbsoluteFill style={{ padding: "290px 150px 110px", display: "grid", gridTemplateColumns: "1.25fr 1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 26 }}>
        <Glass style={{ gridRow: "span 2", padding: 40, ...enter(t[0]) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Tile name="target" color={C.gain} size={52} />
            <span style={{ fontSize: 32, fontWeight: 600 }}>Goals with a clear pace</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 36 }}>
            {goals.map((g, i) => {
              const p = prog(f, 22 + i * 8, 50) * g.p;
              return (
                <div key={g.k} style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <Ring p={p} size={110} color={g.c} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 30, fontWeight: 600 }}>{g.k}</div>
                    <div style={{ fontFamily: FONT.mono, fontSize: 22, color: g.p >= 1 && p > 0.99 ? C.gain : C.muted, marginTop: 4 }}>
                      {g.p >= 1 && p > 0.99 ? "Done ✓" : `${Math.round(p * 100)}% · on pace`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Glass>
        <Glass style={{ gridColumn: "span 2", padding: 40, ...enter(t[1]) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Tile name="chart" color={C.blue} size={52} />
            <span style={{ fontSize: 32, fontWeight: 600 }}>This quarter vs last</span>
            <span style={{ marginLeft: "auto", fontFamily: FONT.mono, fontSize: 26, color: C.gain }}>+₹1,84,500</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 18, height: 150, marginTop: 26 }}>
            {[0.42, 0.55, 0.48, 0.62, 0.58, 0.7, 0.66, 0.78, 0.74, 0.86, 0.82, 0.95].map((v, i) => (
              <div key={i} style={{ flex: 1, height: `${v * 100 * prog(f, 26 + i * 2, 24)}%`, borderRadius: 10, background: i >= 6 ? C.blue : "rgba(106,168,255,0.25)" }} />
            ))}
          </div>
        </Glass>
        <Glass style={{ padding: 36, ...enter(t[2]) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Tile name="wallet" color={C.gold} size={48} />
            <span style={{ fontSize: 28, fontWeight: 600 }}>Spending, sorted</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 13, marginTop: 22 }}>
            {SPEND.map((x, i) => (
              <div key={x.k} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ width: 170, fontSize: 21, color: C.body }}>{x.k}</span>
                <div style={{ flex: 1, height: 12, borderRadius: 99, background: "rgba(255,255,255,0.06)" }}>
                  <div style={{ width: `${x.v * 100 * prog(f, 34 + i * 4, 30)}%`, height: "100%", borderRadius: 99, background: x.c }} />
                </div>
              </div>
            ))}
          </div>
        </Glass>
        <Glass style={{ padding: 36, display: "flex", flexDirection: "column", ...enter(t[3]) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Tile name="download" color={C.teal} size={48} />
            <span style={{ fontSize: 28, fontWeight: 600 }}>Your data, your file</span>
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: "auto" }}>
            {["CSV", "JSON"].map((x, i) => {
              const p = usePop(44 + i * 6, 12, 240);
              return (
                <span key={x} style={{ fontFamily: FONT.mono, fontSize: 30, padding: "16px 30px", borderRadius: 16, background: "rgba(79,209,197,0.12)", border: `1px solid rgba(79,209,197,0.35)`, color: C.teal, ...enter(p, 20) }}>
                  .{x.toLowerCase()}
                </span>
              );
            })}
          </div>
        </Glass>
      </AbsoluteFill>
    </Stage>
  );
};

/* 1:10 — trust, three beats */
const TRUST: { icon: IconName; t: string; c: string }[] = [
  { icon: "lock", t: "Encrypted on Google Cloud.", c: C.gain },
  { icon: "download", t: "Export or delete. Any time.", c: C.teal },
  { icon: "check", t: "Explains. Never advises.", c: C.blue },
];
export const Trust: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const step = Math.floor(dur / 3);
  const i = Math.min(2, Math.floor(f / step));
  const local = f - i * step;
  const it = TRUST[i];
  const p = usePop(i * step, 13, 220);
  return (
    <Stage dur={dur} glow={it.c} zoom={0.03}>
      <AbsoluteFill style={center}>
        <div style={{ ...enter(p, 40), display: "flex", flexDirection: "column", alignItems: "center", gap: 46 }}>
          <Tile name={it.icon} color={it.c} size={150} />
          <Kinetic key={i} text={it.t} at={i * step + 2} every={2} style={{ fontSize: 110 }} />
        </div>
        <div style={{ position: "absolute", bottom: 110, ...Label, opacity: prog(local, 0, 10) }}>Your money is yours</div>
      </AbsoluteFill>
    </Stage>
  );
};

/* 1:16 — free */
export const Free: React.FC<{ dur: number }> = ({ dur }) => (
  <Stage dur={dur} zoom={0.12}>
    <AbsoluteFill style={center}>
      <Kinetic text="Clarity starts free." at={2} every={3} style={{ fontSize: 200 }} accent={["free"]} />
    </AbsoluteFill>
  </Stage>
);

/* 1:20 — end card */
export const End: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const m = usePop(4, 12, 200);
  const w = prog(f, 12, 18);
  const btn = usePop(40, 14, 200);
  return (
    <Stage dur={dur + 20} zoom={0.03}>
      <AbsoluteFill style={center}>
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <Mark size={150} style={{ transform: `scale(${0.5 + 0.5 * m})`, opacity: Math.min(1, m * 2) }} />
          <div style={{ ...H, fontSize: 180, letterSpacing: "-0.06em", opacity: w, filter: `blur(${(1 - w) * 12}px)` }}>Finlio</div>
        </div>
        <div style={{ marginTop: 34 }}>
          <Kinetic text="Real clarity on why it moved." at={24} every={2} style={{ fontSize: 56, fontWeight: 500, color: C.body, letterSpacing: "-0.02em" }} accent={["why"]} />
        </div>
        <div
          style={{
            marginTop: 56,
            padding: "22px 44px",
            borderRadius: 99,
            background: C.ink,
            color: C.bg,
            fontFamily: FONT.sans,
            fontWeight: 600,
            fontSize: 34,
            display: "flex",
            alignItems: "center",
            gap: 14,
            boxShadow: `0 0 60px ${C.gain}55`,
            ...enter(btn, 30),
          }}
        >
          Start free at finlio.app <span style={{ color: C.gain }}>→</span>
        </div>
        <div style={{ position: "absolute", bottom: 60, fontFamily: FONT.sans, fontSize: 18, color: C.muted, opacity: prog(f, 60, 20) }}>
          Finlio explains your finances. It is not a SEBI-registered adviser and does not give investment advice. Figures are illustrative.
        </div>
      </AbsoluteFill>
    </Stage>
  );
};
