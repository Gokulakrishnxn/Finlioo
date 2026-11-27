// Original score for the Finlio launch film, synthesised from scratch (no samples, no licences).
// 120 BPM, 45 bars = 90 s. Ocean + pads under the Goa opener, then a modern SaaS groove:
// four-on-the-floor, offbeat bass, plucks, chord stabs, risers and an impact on every big cut.
import { writeFileSync, mkdirSync } from "node:fs";

const SR = 48000;
const LEN = 90;
const N = SR * LEN;
const BEAT = 0.5;
const BAR = 2;

const L = new Float32Array(N);
const R = new Float32Array(N);
const sL = new Float32Array(N);
const sR = new Float32Array(N);
const duck = new Float32Array(N).fill(1); // sidechain from the kick

const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
const TAU = Math.PI * 2;
let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

function add(i, v, pan, rev, ducked = true) {
  if (i < 0 || i >= N) return;
  const d = ducked ? duck[i] : 1;
  const gl = Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = Math.sin(((pan + 1) * Math.PI) / 4);
  L[i] += v * gl * d;
  R[i] += v * gr * d;
  sL[i] += v * gl * rev * d;
  sR[i] += v * gr * rev * d;
}

// ── Drums ───────────────────────────────────────────────
function kick(t0, vel = 0.6) {
  const s0 = Math.floor(t0 * SR);
  let ph = 0;
  for (let i = 0; i < SR * 0.4; i++) {
    const t = i / SR;
    ph += (TAU * (48 + 110 * Math.exp(-t * 30))) / SR;
    const click = i < 200 ? rnd() * 0.3 * (1 - i / 200) : 0;
    add(s0 + i, (Math.sin(ph) * Math.exp(-t * 8) + click) * vel, 0, 0.02, false);
    // sidechain: duck everything else for ~180 ms
    const j = s0 + i;
    if (j < N && t < 0.22) duck[j] = Math.min(duck[j], 0.35 + 0.65 * (t / 0.22) ** 1.5);
  }
}
function clap(t0, vel = 0.12) {
  const s0 = Math.floor(t0 * SR);
  let lp = 0;
  for (let i = 0; i < SR * 0.25; i++) {
    const t = i / SR;
    lp += 0.4 * (rnd() - lp);
    const bursts = t < 0.03 ? (Math.floor(t / 0.01) % 2 ? 0.5 : 1) : 1;
    add(s0 + i, (rnd() - lp) * Math.exp(-t * 22) * vel * bursts, 0.05, 0.5);
  }
}
function hat(t0, vel = 0.05, open = false, pan = 0.3) {
  const s0 = Math.floor(t0 * SR);
  let prev = 0;
  for (let i = 0; i < SR * (open ? 0.22 : 0.05); i++) {
    const t = i / SR;
    const w = rnd();
    const hp = w - prev;
    prev = w;
    add(s0 + i, hp * Math.exp(-t * (open ? 14 : 70)) * vel, pan, 0.15);
  }
}
function impact(t0, vel = 0.7) {
  const s0 = Math.floor(t0 * SR);
  let ph = 0;
  let lp = 0;
  for (let i = 0; i < SR * 2.5; i++) {
    const t = i / SR;
    ph += (TAU * (32 + 70 * Math.exp(-t * 6))) / SR;
    lp += 0.08 * (rnd() - lp);
    const boom = Math.sin(ph) * Math.exp(-t * 2.2);
    const crash = (rnd() - lp * 0.5) * Math.exp(-t * 2.8) * 0.35;
    add(s0 + i, (boom + crash) * vel, 0, 0.6, false);
  }
}
function whoosh(tEnd, len = 0.5, vel = 0.12) {
  const s0 = Math.floor((tEnd - len) * SR);
  const n = Math.floor(len * SR);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const x = i / n;
    lp += (0.02 + 0.4 * x) * (rnd() - lp);
    add(s0 + i, lp * Math.sin(x * Math.PI) ** 2 * vel * 2.2, Math.sin(x * 4) * 0.6, 0.5, false);
  }
}
function riser(t0, len, vel = 0.1) {
  const s0 = Math.floor(t0 * SR);
  const n = Math.floor(len * SR);
  let lp = 0;
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const x = i / n;
    lp += (0.01 + 0.5 * x * x) * (rnd() - lp);
    ph += (TAU * (200 + 1400 * x * x)) / SR;
    add(s0 + i, (lp * 2 + Math.sin(ph) * 0.15) * x * x * vel, Math.sin(x * 9) * 0.4, 0.7, false);
  }
}
function snareRoll(t0, len, vel = 0.08) {
  const steps = 16;
  for (let k = 0; k < steps; k++) {
    const x = k / steps;
    const dt = len * (1 - (1 - x) ** 1.6);
    clap(t0 + dt, vel * (0.3 + 0.9 * x));
  }
}

// ── Tonal ───────────────────────────────────────────────
function pluck(t0, midi, vel = 0.1, pan = 0, rev = 0.35) {
  const f = mtof(midi);
  const s0 = Math.floor(t0 * SR);
  const n = Math.floor(0.9 * SR);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let v = 0;
    for (let k = 1; k <= 10; k++) {
      if (f * k > 12000) break;
      v += (Math.sin(TAU * f * k * t) / k) * Math.exp(-t * (5 + k * 3.2));
    }
    add(s0 + i, v * vel * Math.min(1, t / 0.002), pan, rev);
  }
}
function stab(t0, midis, vel = 0.07) {
  midis.forEach((m, j) => {
    const f = mtof(m);
    const s0 = Math.floor(t0 * SR);
    for (let i = 0; i < SR * 0.35; i++) {
      const t = i / SR;
      let v = 0;
      for (let k = 1; k <= 8; k++) v += (Math.sin(TAU * f * k * t * (1 + (j % 2 ? 0.003 : -0.003))) / k) * Math.exp(-t * (6 + k * 2));
      add(s0 + i, v * vel, j % 2 ? 0.4 : -0.4, 0.5);
    }
  });
}
function pad(t0, len, midis, vel = 0.04) {
  const s0 = Math.floor(t0 * SR);
  const n = Math.floor(len * SR);
  const rel = 0.8;
  midis.forEach((m, j) => {
    const f = mtof(m);
    for (const det of [-0.1, 0.1]) {
      const fd = f * 2 ** (det / 12);
      for (let i = 0; i < n + rel * SR; i++) {
        const t = i / SR;
        const env = Math.min(1, t / 0.6) * (t > len ? Math.max(0, 1 - (t - len) / rel) : 1);
        const v = Math.sin(TAU * fd * t) + 0.3 * Math.sin(TAU * 2 * fd * t) + 0.1 * Math.sin(TAU * 3 * fd * t);
        add(s0 + i, v * env * vel, det < 0 ? -0.55 : 0.55, 0.6);
      }
    }
    void j;
  });
}
function bass(t0, midi, len, vel = 0.3) {
  const f = mtof(midi);
  const s0 = Math.floor(t0 * SR);
  const n = Math.floor(len * SR);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.005) * Math.exp(-t * 3) * (i > n - 600 ? (n - i) / 600 : 1);
    const v = Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * 2 * f * t) + 0.12 * Math.sin(TAU * 3 * f * t);
    add(s0 + i, v * env * vel, 0, 0.02);
  }
}
function ocean(t0, len, vel = 0.12) {
  const s0 = Math.floor(t0 * SR);
  const n = Math.floor(len * SR);
  let lp = 0;
  let lp2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const swell = 0.35 + 0.65 * Math.max(0, Math.sin(TAU * 0.13 * t - 1.2)) ** 2;
    lp += 0.03 * (rnd() - lp);
    lp2 += 0.25 * (rnd() - lp2);
    const fade = Math.min(1, t / 0.8) * Math.min(1, (len - t) / 1.5);
    const v = (lp * 3.0 + (lp2 - lp) * 0.6 * swell) * swell * fade * vel;
    add(s0 + i, v, Math.sin(t * 0.4) * 0.5, 0.2, false);
  }
}

// IV – V – vi – I in C, bright and forward
const PROG = [
  { root: 29, chord: [53, 57, 60, 64], arp: [65, 69, 72, 76] },
  { root: 31, chord: [55, 59, 62, 67], arp: [67, 71, 74, 79] },
  { root: 33, chord: [57, 60, 64, 67], arp: [69, 72, 76, 79] },
  { root: 36, chord: [55, 60, 64, 67], arp: [67, 72, 76, 79] },
];
const ARP_ORDER = [0, 1, 2, 3, 2, 1, 3, 2, 0, 2, 1, 3, 2, 1, 3, 1];

const has = (bar, a, b) => bar >= a && bar < b;
for (let bar = 0; bar < 45; bar++) {
  const t = bar * BAR;
  const ch = PROG[bar % 4];
  const full = has(bar, 9, 22) || has(bar, 26, 35);
  const intro = bar < 7;
  const breakdown = has(bar, 22, 26);
  const half = has(bar, 35, 38);
  const build = has(bar, 38, 40);
  const outro = bar >= 40;

  // pads
  if (!outro) pad(t, BAR, ch.chord, intro ? 0.03 : breakdown ? 0.045 : 0.03);

  // intro: sparse, airy plucks on the 1 and the "and" of 3
  if (intro && bar >= 1) {
    pluck(t, ch.arp[0] + 12, 0.06, 0.3, 0.6);
    pluck(t + 2.5 * BEAT, ch.arp[2] + 12, 0.05, -0.3, 0.6);
    if (bar >= 4) for (let k = 0; k < 8; k++) pluck(t + k * BEAT * 0.5, ch.arp[ARP_ORDER[k] % 4] + 12, 0.025, Math.sin(k) * 0.5, 0.6);
  }

  // hook (14–18 s): kick on every beat, bass, rising hats
  if (has(bar, 7, 9)) {
    for (let k = 0; k < 4; k++) kick(t + k * BEAT, 0.55);
    for (let k = 0; k < 4; k++) bass(t + k * BEAT + BEAT / 2, ch.root + 12, BEAT / 2, 0.24);
    for (let k = 0; k < 8; k++) hat(t + k * BEAT * 0.5, 0.03 + k * 0.004);
  }

  // full groove
  if (full) {
    for (let k = 0; k < 4; k++) {
      kick(t + k * BEAT, 0.62);
      bass(t + k * BEAT + BEAT / 2, ch.root + 12, BEAT * 0.45, 0.28);
      hat(t + k * BEAT + BEAT / 2, 0.06, k === 3, 0.25);
    }
    clap(t + BEAT, 0.13);
    clap(t + 3 * BEAT, 0.13);
    for (let k = 0; k < 16; k++) {
      hat(t + k * BEAT * 0.25, k % 2 ? 0.018 : 0.026, false, -0.35);
      pluck(t + k * BEAT * 0.25, ch.arp[ARP_ORDER[k]] + (k >= 8 ? 12 : 0), 0.055, Math.sin(k * 1.3) * 0.45);
    }
  }
  // rapid-fire section: a chord stab on every beat (22–26 s)
  if (has(bar, 11, 13)) for (let k = 0; k < 4; k++) stab(t + k * BEAT, ch.chord.map((m) => m + 12), 0.05);

  // breakdown (44–52 s): no drums, filtered plucks, build at the end
  if (breakdown) {
    for (let k = 0; k < 8; k++) pluck(t + k * BEAT * 0.5, ch.arp[ARP_ORDER[k]], 0.05, Math.sin(k) * 0.4, 0.5);
    if (bar === 25) {
      riser(t, BAR, 0.1);
      snareRoll(t, BAR, 0.07);
    }
  }

  // half-time (70–76 s)
  if (half) {
    kick(t, 0.6);
    kick(t + 2.5 * BEAT, 0.35);
    clap(t + 2 * BEAT, 0.14);
    bass(t, ch.root + 12, BAR * 0.9, 0.22);
    for (let k = 0; k < 8; k++) {
      hat(t + k * BEAT * 0.5, 0.025, false, 0.3);
      pluck(t + k * BEAT * 0.5, ch.arp[ARP_ORDER[k]] + 12, 0.045, Math.sin(k) * 0.4);
    }
  }

  // build into the end card (76–80 s)
  if (build) {
    for (let k = 0; k < 4; k++) kick(t + k * BEAT, 0.5 + (bar - 38) * 0.08);
    for (let k = 0; k < 8; k++) stab(t + k * BEAT * 0.5, ch.chord.map((m) => m + 12), 0.025 + k * 0.004);
    if (bar === 38) riser(t, BAR * 2, 0.12);
    if (bar === 39) snareRoll(t, BAR, 0.09);
  }
}

// Ocean under the Goa opener
ocean(0, 14.5, 0.16);
// "Checking your money" — a soft ticking while Finlio thinks (4–7 s)
for (let k = 0; k < 12; k++) pluck(4 + k * 0.25, 96 + (k % 3) * 2, 0.012, (k % 2) * 0.6 - 0.3, 0.5);
// Answer lands (7.6 s): a warm chord
stab(7.6, [60, 64, 67, 72], 0.05);
pad(7.6, 6, [48, 55, 60, 64], 0.035);
riser(12, 2, 0.12);

// Impacts on the big cuts
impact(14, 0.55);
impact(18, 0.7);
impact(52, 0.6);
impact(80, 0.75);
// Whooshes into the other cuts
[22, 26, 36, 44, 62, 70, 76].forEach((c) => whoosh(c, 0.45, 0.1));

// Outro (80–90 s): final chord, motif, long tail
pad(80, 8, [48, 55, 60, 64, 67], 0.045);
bass(80, 36, 3, 0.3);
[72, 76, 79, 84, 79, 76, 72].forEach((m, k) => pluck(80.5 + k * 0.25, m, 0.06, (k - 3) * 0.15, 0.7));
[84, 88, 91].forEach((m, k) => pluck(83 + k * 0.5, m, 0.04, 0.3, 0.8));

// ── Reverb + master ─────────────────────────────────────
function reverb(input, combs, aps) {
  const out = new Float32Array(N);
  for (const [d, g] of combs) {
    const buf = new Float32Array(d);
    let idx = 0;
    let lp = 0;
    for (let i = 0; i < N; i++) {
      const y = buf[idx];
      lp = y * 0.6 + lp * 0.4;
      buf[idx] = input[i] + lp * g;
      out[i] += y;
      idx = (idx + 1) % d;
    }
  }
  let sig = out;
  for (const [d, g] of aps) {
    const buf = new Float32Array(d);
    const o = new Float32Array(N);
    let idx = 0;
    for (let i = 0; i < N; i++) {
      const b = buf[idx];
      const y = -g * sig[i] + b;
      buf[idx] = sig[i] + g * y;
      o[i] = y;
      idx = (idx + 1) % d;
    }
    sig = o;
  }
  return sig;
}
const k = SR / 44100;
const C1 = [1557, 1617, 1491, 1422];
const C2 = [1580, 1640, 1514, 1445];
const rl = reverb(sL, C1.map((d) => [Math.round(d * k * 1.2), 0.82]), [[225, 0.5], [556, 0.5]].map(([d, g]) => [Math.round(d * k), g]));
const rr = reverb(sR, C2.map((d) => [Math.round(d * k * 1.2), 0.82]), [[248, 0.5], [579, 0.5]].map(([d, g]) => [Math.round(d * k), g]));

let peak = 0;
for (let i = 0; i < N; i++) {
  L[i] = Math.tanh((L[i] + rl[i] * 0.2) * 1.25);
  R[i] = Math.tanh((R[i] + rr[i] * 0.2) * 1.25);
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const gain = 0.89 / peak;
const fadeOut = SR * 2.5;
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0);
buf.writeUInt32LE(36 + N * 4, 4);
buf.write("WAVEfmt ", 8);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32);
buf.writeUInt16LE(16, 34);
buf.write("data", 36);
buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const f = i > N - fadeOut ? (N - i) / fadeOut : 1;
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * gain * f)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * gain * f)) * 32767), 46 + i * 4);
}
mkdirSync(new URL("../public/", import.meta.url), { recursive: true });
writeFileSync(new URL("../public/score.wav", import.meta.url), buf);
console.log(`score.wav written: ${LEN}s, gain ${gain.toFixed(2)}`);
