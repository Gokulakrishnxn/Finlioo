import React from "react";
import { Composition, registerRoot } from "remotion";
import { DURATION, Launch } from "./Launch";
import { FPS } from "./theme";

const Root: React.FC = () =>
  React.createElement(Composition, { id: "Launch", component: Launch, durationInFrames: DURATION, fps: FPS, width: 1920, height: 1080 });

registerRoot(Root);
