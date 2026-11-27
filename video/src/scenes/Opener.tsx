// 0:00–0:14 — a family asks Finlio about a Goa trip, over the three.js beach.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Goa } from "../three/Goa";
import { C, FONT } from "../theme";
import { Glass, Kinetic, clamp, ease, easeIn, enter, prog, usePop } from "../kit";
import { I, Mark, Tile } from "../icons";

const Bubble: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const p = usePop(at, 16, 160);
  return (
    <div
      style={{
        alignSelf: "flex-end",
        maxWidth: 1120,
        padding: "34px 56px",
        borderRadius: 64,
        background: "rgba(238,240,241,0.86)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 20px 60px rgba(40,20,30,0.25)",
        fontFamily: FONT.sans,
        fontWeight: 500,
        fontSize: 58,
        lineHeight: 1.32,
        letterSpacing: "-0.015em",
        color: "#121212",
        opacity: Math.min(1, p * 1.5),
        transform: `translateY(${(1 - p) * 40}px) scale(${0.9 + 0.1 * p})`,
        transformOrigin: "right bottom",
      }}
    >
      {children}
    </div>
  );
};

const Thinking: React.FC<{ at: number; until: number }> = ({ at, until }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, 12) * (1 - prog(f, until, 10));
  const shimmer = ((f - at) * 3) % 300;
  return (
    <div style={{ position: "absolute", left: 200, bottom: 230, display: "flex", alignItems: "center", gap: 26, opacity: p }}>
      <div style={{ position: "relative", width: 46, height: 46 }}>
        {[0, 1, 2, 3].map((i) => {
          const a = (f / 9 + i * (Math.PI / 2)) % (Math.PI * 2);
          const r = 14 + Math.sin(f / 6 + i) * 4;
          return (
            <span
              key={i}
              style={{
                position: "absolute",
                left: 23 + Math.cos(a) * r - 6,
                top: 23 + Math.sin(a) * r - 6,
                width: i === 0 ? 16 : 11,
                height: i === 0 ? 16 : 11,
                borderRadius: 99,
                background: C.gain,
                boxShadow: `0 0 14px ${C.gain}`,
              }}
            />
          );
        })}
      </div>
      <span
        style={{
          fontFamily: FONT.sans,
          fontSize: 54,
          fontWeight: 500,
          backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.65) ${shimmer - 100}px, #fff ${shimmer}px, rgba(255,255,255,0.65) ${shimmer + 100}px)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          textShadow: "0 2px 30px rgba(0,0,0,0.25)",
        }}
      >
        Checking your money
      </span>
    </div>
  );
};

const ROWS = [
  { icon: "target" as const, color: C.gain, k: "Goa trip fund", v: "₹60K of ₹60K", tag: "Ready" },
  { icon: "wallet" as const, color: C.blue, k: "Saved this month", v: "+₹66,700", tag: "" },
  { icon: "home" as const, color: C.violet, k: "Home fund", v: "Still on pace", tag: "₹28K / mo" },
];

export const Opener: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const blur = interpolate(f, [10, 40, 215, 245], [0, 4, 4, 9], clamp);
  const askOut = prog(f, 212, 18, easeIn);
  const card = usePop(228, 17, 150);
  const out = prog(f, dur - 12, 12, easeIn);
  const flash = interpolate(f, [0, 10], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ opacity: 1 - out }}>
        <Goa blur={blur} />
        <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(20,10,30,${0.1 + askOut * 0.25}) 0%, rgba(20,10,30,${askOut * 0.35}) 100%)` }} />

        {/* The family's question */}
        <AbsoluteFill
          style={{
            padding: "150px 200px",
            flexDirection: "column",
            gap: 34,
            opacity: 1 - askOut,
            transform: `translateY(${-askOut * 120}px)`,
            filter: `blur(${askOut * 10}px)`,
          }}
        >
          <Bubble at={16}>Hey Finlio, we need a family trip.</Bubble>
          <Bubble at={58}>
            Ten days in Goa this December.
            <br />
            Can we afford it??
          </Bubble>
        </AbsoluteFill>
        <Thinking at={118} until={212} />

        {/* Finlio's answer */}
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          {f >= 222 && (
            <Glass
              style={{
                width: 1040,
                padding: "48px 56px 40px",
                background: "linear-gradient(180deg, rgba(14,16,18,0.78), rgba(14,16,18,0.66))",
                ...enter(card, 90),
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, color: C.muted, fontSize: 24, fontWeight: 500 }}>
                <Mark size={34} /> Finlio
              </div>
              <Kinetic text="Yes. Comfortably." at={238} every={4} style={{ fontSize: 96, textAlign: "left", marginTop: 26 }} accent={["Comfortably"]} />
              <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 14 }}>
                {ROWS.map((r, i) => {
                  const p = usePop(262 + i * 12, 16, 180);
                  return (
                    <div
                      key={r.k}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 22,
                        padding: "18px 22px",
                        borderRadius: 20,
                        background: "rgba(255,255,255,0.05)",
                        border: `1px solid ${C.edge}`,
                        ...enter(p, 30),
                      }}
                    >
                      <Tile name={r.icon} color={r.color} size={58} />
                      <span style={{ fontSize: 32, flex: 1, color: C.body }}>{r.k}</span>
                      <span style={{ fontFamily: FONT.mono, fontSize: 32, color: C.ink }}>{r.v}</span>
                      {r.tag && (
                        <span
                          style={{
                            fontSize: 22,
                            fontWeight: 600,
                            padding: "8px 16px",
                            borderRadius: 99,
                            color: r.tag === "Ready" ? C.gain : C.body,
                            background: r.tag === "Ready" ? C.gainDim : "rgba(255,255,255,0.07)",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {r.tag === "Ready" && I.check({ size: 22 })}
                          {r.tag}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 28, fontSize: 30, color: C.body, opacity: prog(f, 318, 14) }}>
                Pack the sunscreen. Your home fund doesn't move.
              </div>
            </Glass>
          )}
        </AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#000", opacity: flash }} />
    </AbsoluteFill>
  );
};
