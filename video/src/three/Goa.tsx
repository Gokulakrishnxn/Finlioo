// A Goa beach at sunset, built in three.js (no footage): shader sky and sea, wet sand with foam,
// palm silhouettes and a far headland. Everything is driven by the Remotion frame, so renders are deterministic.
import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCurrentFrame, useVideoConfig } from "remotion";

const SUN = new THREE.Vector3(0.28, 0.05, -1).normalize();

const skyFrag = /* glsl */ `
uniform vec3 uSun;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 top = vec3(0.12, 0.2, 0.4);
  vec3 mid = vec3(0.58, 0.44, 0.62);
  vec3 hor = vec3(1.0, 0.63, 0.37);
  vec3 col = mix(hor, mid, smoothstep(0.0, 0.16, h));
  col = mix(col, top, smoothstep(0.14, 0.62, h));
  float sd = max(dot(d, uSun), 0.0);
  col += vec3(1.0, 0.5, 0.22) * pow(sd, 10.0) * 0.5 + vec3(1.0, 0.75, 0.45) * pow(sd, 300.0) * 0.45;
  col = mix(col, vec3(1.0, 0.98, 0.92), smoothstep(0.99955, 0.99975, sd));
  // thin cloud streaks near the horizon
  float streak = smoothstep(0.02, 0.0, abs(h - 0.07 - sin(d.x * 9.0) * 0.012)) * 0.25;
  col = mix(col, vec3(0.78, 0.45, 0.45), streak);
  if (h < 0.0) col = hor * 0.8;
  gl_FragColor = vec4(col, 1.0);
}`;
const skyVert = /* glsl */ `
varying vec3 vDir;
void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const seaVert = /* glsl */ `
uniform float uTime;
varying vec3 vW;
float wave(vec2 p) {
  return sin(p.x * 0.33 + uTime * 0.9) * 0.08
       + sin(p.y * 0.52 - uTime * 1.3 + p.x * 0.2) * 0.07
       + sin((p.x + p.y) * 1.4 + uTime * 2.1) * 0.025;
}
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  w.y += wave(w.xz);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const seaFrag = /* glsl */ `
uniform vec3 uSun; uniform vec3 uCam; uniform float uTime;
varying vec3 vW;
void main() {
  vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
  if (n.y < 0.0) n = -n;
  vec2 q = vW.xz;
  float rx = sin(dot(q, vec2(2.3, 1.1)) + uTime * 2.7) + sin(dot(q, vec2(-1.7, 2.9)) - uTime * 2.1) * 0.7 + sin(dot(q, vec2(4.1, -3.3)) + uTime * 3.6) * 0.4;
  float rz = cos(dot(q, vec2(1.3, 3.1)) - uTime * 2.4) + cos(dot(q, vec2(-3.7, 1.9)) + uTime * 1.9) * 0.6 + cos(dot(q, vec2(5.3, 2.7)) - uTime * 3.1) * 0.35;
  n = normalize(n + vec3(rx, 0.0, rz) * 0.035);
  vec3 v = normalize(vW - uCam);
  vec3 r = reflect(v, n);
  float fres = pow(1.0 - max(dot(-v, n), 0.0), 3.0);
  vec3 deep = vec3(0.08, 0.13, 0.22);
  vec3 skyR = mix(vec3(1.0, 0.6, 0.38), vec3(0.5, 0.4, 0.62), smoothstep(0.0, 0.3, r.y));
  vec3 col = mix(deep, skyR, 0.22 + 0.7 * fres);
  float sp = pow(max(dot(r, uSun), 0.0), 160.0);
  col += vec3(1.0, 0.74, 0.44) * sp * 3.2;
  float dist = length(vW.xz - uCam.xz);
  col = mix(col, vec3(0.98, 0.62, 0.42), smoothstep(80.0, 420.0, dist) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}`;

// A gently wandering shoreline 20 m out, so the palms stand on sand.
const EDGE = `float edgeAt(float x) { return -21.0 + x * 0.12 + sin(x * 0.21) * 1.2 + sin(x * 0.9 + 1.0) * 0.3; }`;
const sandVert = /* glsl */ `
varying vec3 vW;
${EDGE}
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  w.y = 0.05 + max(w.z - edgeAt(w.x), 0.0) * 0.03 + sin(w.x * 0.7) * 0.03 + sin(w.x * 2.3 + w.z) * 0.012;
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const sandFrag = /* glsl */ `
uniform float uTime; uniform vec3 uSun; uniform vec3 uCam;
varying vec3 vW;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
${EDGE}
void main() {
  float edge = edgeAt(vW.x);
  float swash = sin(uTime * 0.7) * 0.7;
  float alpha = smoothstep(edge + swash - 0.3, edge + swash + 0.6, vW.z);
  vec3 dry = vec3(0.74, 0.52, 0.38);
  vec3 wet = vec3(0.42, 0.3, 0.3);
  float wetness = 1.0 - smoothstep(edge + 0.5, edge + 3.5, vW.z);
  vec3 col = mix(dry, wet, wetness);
  // sun glint in the wet sand
  vec3 v = normalize(vW - uCam);
  vec3 r = reflect(v, vec3(0.0, 1.0, 0.0));
  col += vec3(1.0, 0.65, 0.4) * pow(max(dot(r, uSun), 0.0), 40.0) * wetness * 0.9;
  // foam line riding the swash
  float foam = smoothstep(0.45, 0.0, abs(vW.z - (edge + swash + 0.35) + sin(vW.x * 3.0 + uTime) * 0.12));
  col = mix(col, vec3(1.0, 0.9, 0.82), foam * 0.75);
  col *= 0.5 + 0.5 * smoothstep(12.0, -16.0, vW.z); // falls into shade toward camera
  col *= 0.93 + 0.07 * sin(vW.x * 1.3 + sin(vW.z * 0.7) * 2.0 + vW.z * 5.0); // wind ripples
  col = mix(col, vec3(0.55, 0.36, 0.4), smoothstep(-4.0, 10.0, vW.z) * 0.35); // violet dusk shadow
  col += (hash(floor(vW.xz * 60.0)) - 0.5) * 0.03;
  gl_FragColor = vec4(col, alpha);
}`;

function frondGeometry(len: number, droop: number, width: number) {
  const pos: number[] = [];
  const idx: number[] = [];
  const steps = 22;
  for (let j = 0; j <= steps; j++) {
    const t = j / steps;
    const x = len * t;
    const y = Math.sin(t * Math.PI * 0.55) * 0.9 - t * t * droop;
    const w = width * Math.sin(Math.min(1, t * 1.15) * Math.PI) * (j % 2 ? 1 : 0.35);
    pos.push(x, y - w * 0.25, -w, x, y - w * 0.25, w);
    if (j < steps) {
      const a = j * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

const Palm: React.FC<{ x: number; z: number; h: number; lean: number; rot?: number; sway: number }> = ({ x, z, h, lean, rot = 0, sway }) => {
  const { trunk, fronds, top } = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(lean * 0.25, h * 0.35, 0),
      new THREE.Vector3(lean * 0.7, h * 0.7, 0),
      new THREE.Vector3(lean, h, 0),
    ]);
    const trunk = new THREE.TubeGeometry(curve, 40, 0.16, 8);
    const top = new THREE.Vector3(lean, h, 0);
    const fronds = Array.from({ length: 9 }, (_, i) => ({
      geo: frondGeometry(2.6 + (i % 3) * 0.5, 1.6 + (i % 2) * 0.8, 0.42),
      a: (i / 9) * Math.PI * 2 + rot,
      tilt: (i % 3) * 0.12,
    }));
    return { trunk, fronds, top };
  }, [h, lean, rot]);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#140e0d", side: THREE.DoubleSide }), []);
  return (
    <group position={[x, 0, z]} rotation={[0, rot * 0.3, sway * 0.02]}>
      <mesh geometry={trunk} material={mat} />
      <group position={top}>
        {fronds.map((fr, i) => (
          <mesh key={i} geometry={fr.geo} material={mat} rotation={[0, fr.a, fr.tilt + Math.sin(sway + i) * 0.05]} />
        ))}
      </group>
    </group>
  );
};

function headland(points: [number, number][], color: string) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], 0);
  points.forEach(([px, py]) => shape.lineTo(px, py));
  shape.lineTo(points[points.length - 1][0], 0);
  const g = new THREE.ShapeGeometry(shape);
  return { g, m: new THREE.MeshBasicMaterial({ color, fog: false }) };
}

const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const camera = useThree((st) => st.camera);
  camera.position.set(Math.sin(t * 0.18) * 0.5 - 0.4, 1.25 + t * 0.012, 8.5 - t * 0.3);
  camera.lookAt(1.5, camera.position.y + 3.2, -60);

  const sky = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: skyVert, fragmentShader: skyFrag, side: THREE.BackSide, uniforms: { uSun: { value: SUN } }, depthWrite: false }),
    [],
  );
  const sea = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: seaVert, fragmentShader: seaFrag, uniforms: { uSun: { value: SUN }, uCam: { value: new THREE.Vector3() }, uTime: { value: 0 } } }),
    [],
  );
  const sand = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: sandVert,
        fragmentShader: sandFrag,
        transparent: true,
        uniforms: { uSun: { value: SUN }, uCam: { value: new THREE.Vector3() }, uTime: { value: 0 } },
      }),
    [],
  );
  sea.uniforms.uTime.value = t;
  sea.uniforms.uCam.value.copy(camera.position);
  sand.uniforms.uTime.value = t;
  sand.uniforms.uCam.value.copy(camera.position);

  const hills = useMemo(
    () => [
      headland([[-420, 0], [-380, 10], [-330, 16], [-280, 13], [-240, 19], [-190, 14], [-150, 9], [-110, 5], [-80, 0]], "#6a4660"),
      headland([[210, 0], [240, 5], [275, 7], [300, 4], [330, 0]], "#7a5068"),
    ],
    [],
  );

  return (
    <>
      <fog attach="fog" args={["#c97a62", 18, 140]} />
      <mesh material={sky}>
        <sphereGeometry args={[600, 48, 24]} />
      </mesh>
      {hills.map((hl, i) => (
        <mesh key={i} geometry={hl.g} material={hl.m} position={[0, -0.2, -330]} />
      ))}
      <mesh material={sea} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -200]}>
        <planeGeometry args={[1400, 420, 260, 120]} />
      </mesh>
      <mesh material={sand} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -6]}>
        <planeGeometry args={[160, 60, 240, 120]} />
      </mesh>
      <Palm x={-8.5} z={-11} h={8.2} lean={1.6} rot={0.2} sway={t * 0.9} />
      <Palm x={-13} z={-17} h={9.4} lean={2.2} rot={1.3} sway={t * 0.8 + 1} />
      <Palm x={11} z={-13} h={7.6} lean={-1.6} rot={0.7} sway={t * 1.0 + 2} />
      <Palm x={18} z={-17} h={8.5} lean={-1.2} rot={2.1} sway={t * 0.7 + 3} />
    </>
  );
};

export const Goa: React.FC<{ blur?: number }> = ({ blur = 0 }) => {
  const { width, height } = useVideoConfig();
  return (
    <div style={{ position: "absolute", inset: 0, filter: blur ? `blur(${blur}px)` : undefined, transform: `scale(${1 + blur * 0.01})` }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 38, near: 0.1, far: 1500, position: [0, 1.6, 8] }} gl={{ antialias: true }}>
        <Scene />
      </ThreeCanvas>
    </div>
  );
};
