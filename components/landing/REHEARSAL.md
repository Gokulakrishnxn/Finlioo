# Hero product shot — rehearsal notes

Following `stageshow` (`.agents/skills/stageshow`, MIT). This records what the
shot was built from, what changed, and what was not checked.

## What it is

Not a scripted demo (no `Stage` playback, no cursor, no loop): the hero needs a
still that is unmistakably Finlio's own dashboard, with one motion beat on load.
So the kit is used for the parts where hand-drawing goes wrong — the window
chrome and its tokens — and the product's own UI is drawn inside it, which the
skill sanctions ("if the developer asks for their own components, use them
inside the stage instead of the kit's small parts").

## The gold copied

`examples/static-card` — a window pinned top-left that runs off two edges, with
a detail card straddling its left edge over the sidebar. Layout borrowed:
one gutter on the pinned edges, a reserve column for the satellite (gutter plus
half its width), satellite covering chrome only, filler under the crop.

Adopted with it: the window runs off the right and the foot; the satellite is
110px outside and 110px inside the window's left edge; words never enter the
crop zone (content keeps a 72px right inset while the surface bleeds past).

## What changed from the gold

- **Tokens:** `--ss-*` mapped onto Finlio's palette on `.fl-stage`
  (`app/globals.css`) — cream canvas, warm grays, green accent, 14px window
  radius, the kit's three shadow steps.
- **Subject:** net worth, the Indian financial-year quarters, the coming-up
  brief and recent activity, with the sample household's real figures from
  `lib/landing-content.ts`.
- **Satellite:** the app's "This month" card (In / Out / Saved), 220px, on the
  window's left edge at 216px from the top.
- **Foot:** a 56px mask instead of a hard cut (`framing.md`, fade crop), because
  the crop would otherwise slice a row in half at an arbitrary line.
- **Compact design:** below 640px the rail is dropped (chrome, not content, and
  it takes half the column), the figure steps down to 26px, chart labels are
  dropped and the satellite is not shown. The traffic lights lived in the rail's
  top, so the compact window runs on its address bar alone. It is a second
  composition, not a squeeze.
- **Motion:** bars grow (scaleY, stagger 0.06) and the satellite settles left to
  right after the headline; reduced motion shows the finished still.
- **Own mark:** the real `finlio-mark.png`, multiplied, in the rail.

## Checked

- Stills at 1440 and 390 (`puppeteer-core` against the dev server).
- Crop: the window is cut at the stage's right edge and dissolves at the foot;
  real words stay left of the crop; the satellite straddles the left edge over
  the rail and covers no content.
- Reduced motion: `prefers-reduced-motion` returns early in both the GSAP
  timeline and the reveal helpers; the shot renders complete.
- Geometry probed in the browser: stage 1120×620, window 1030×660 at x=150,
  satellite 220×80 at x=40, address pill capped at 300px and centred.

## Not checked

- `film.mjs` / `--gate`: it films the skill's own playground examples, which are
  not installed in this repo. The equivalent here was a still at both widths,
  and there is no loop to step through (no cursor, no scene reset).
- No mobile-frame (phone) or dark-theme variant of the shot exists; the page is
  light-only by design.
- The kit is vendored in full (`components/landing/stage-kit`) but only
  `window.tsx` and its CSS are imported; if the kit is updated, replace the
  folder and re-check `window.css` tokens.
