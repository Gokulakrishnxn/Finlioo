import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, s } from "./theme";
import { Grain } from "./kit";
import { Opener } from "./scenes/Opener";
import { Bento, Brief, Chat, End, Free, Hook, Holdings, Logo, NetWorth, Rapid, Trust } from "./scenes/Saas";

// Cut list in seconds. The score is 120 BPM (one bar = 2 s); every cut lands on a bar line.
export const CUTS = [
  { C: Opener, at: 0, len: 14 },
  { C: Hook, at: 14, len: 4 },
  { C: Logo, at: 18, len: 4 },
  { C: Rapid, at: 22, len: 4 },
  { C: NetWorth, at: 26, len: 10 },
  { C: Holdings, at: 36, len: 8 },
  { C: Brief, at: 44, len: 8 },
  { C: Chat, at: 52, len: 10 },
  { C: Bento, at: 62, len: 8 },
  { C: Trust, at: 70, len: 6 },
  { C: Free, at: 76, len: 4 },
  { C: End, at: 80, len: 10 },
];

export const DURATION = s(90);

const FadeOut: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [DURATION - 24, DURATION], [0, 1], { extrapolateLeft: "clamp" }) }} />;
};

export const Launch: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    {CUTS.map(({ C: Scene, at, len }, i) => (
      <Sequence key={i} from={s(at)} durationInFrames={s(len)} premountFor={30}>
        <Scene dur={s(len)} />
      </Sequence>
    ))}
    <Grain />
    <FadeOut />
    <Audio src={staticFile("score.wav")} />
  </AbsoluteFill>
);
