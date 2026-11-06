// The page's atmosphere: a slow aurora, a dot grid and a film of grain.
// All of it is CSS and static markup, so it costs no JavaScript and no layout.
export function LandingBackground() {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[1180px] overflow-hidden">
        <div className="fl-aurora" />
        <div className="fl-dots" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-cream" />
      </div>
      <div aria-hidden className="fl-grain" />
    </>
  );
}
