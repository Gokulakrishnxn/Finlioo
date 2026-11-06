# Finlio — landing page design prompt & copy deck

This file is the brief for Finlio's marketing page. Part 1 is a prompt you can
hand to a designer or to any AI design tool. Part 2 is the copy as it ships.
Part 3 lists the assets. The built page lives at `/` (`app/(marketing)/page.tsx`).

---

## Part 1 — The master prompt

> **Role.** You are a senior product designer and front-end engineer who builds
> launch pages for Apple-grade consumer software. Restraint over decoration.
> Every pixel earns its place; every motion has a cause.
>
> **Objective.** Design and build the landing page for **Finlio**, a private,
> AI-assisted money dashboard for India. One page, six
> sections: Hero, Features, Privacy, Subscription, FAQ, Footer — plus a floating
> navigation with centred links and an Open Finlio button.
>
> **The product, in its own words.** Finlio adds up everything you have and owe,
> and tells you what changed, in plain language. It holds the whole picture of
> your money: stocks, savings, gold, property, loans, spending and goals.
> **It explains. It never advises.**
> It never says buy, sell or hold.
>
> **Audience.** People in India who have money in three apps and a
> bank SMS feed, who were never taught where to look. They are not looking for a
> trading terminal. They want to understand, quietly.
>
> **Emotional goal.** Calm competence. The feeling of opening one clean screen
> on a Sunday morning, not the adrenaline of a terminal. We are replacing a
> scavenger hunt with a sentence in plain English.
>
> **The one idea.** *Know why your money moved.* Everything on the page serves
> that sentence.

### Visual direction

- White-paper product design, not a fintech dashboard. Cream canvas, ink type,
  one green accent used only where money moved in your favour or where the
  product speaks.
- Editorial restraint: a lot of air, one idea per screenful, large quiet type,
  thin rules instead of boxes, shadows only where something is physically
  lifted (a window, a card).
- Borrow structure from a marketplace landing page (floating pill nav, centred
  hero, bento feature grid, a dark pricing band, a clean FAQ column, a wide
  footer) and content from the product itself. Do not borrow its clutter,
  stock photography or testimonial theatre.
- No stock photos of phones, coins, charts or people at laptops. No 3D coins.
  No purple gradients. No sparkles for "AI".

### Brand

- **Mark:** the flying-bird glyph (`public/finlio-mark.png`), ink on cream,
  multiplied onto the page so its white square disappears; cream inverted on
  dark. 28–32px in the nav, 32px in the footer, 20px inside the product shot.
  Never tinted green, never inside a coloured tile, never redrawn.
- **Wordmark:** "Finlio" in Geist, 600, tracking −0.03em, sentence case.
- **Logo rule:** mark + wordmark, 8px apart. Safe area: half the mark's height
  on every side. One mark per viewport region.

### Tokens

| Token | Value | Use |
|---|---|---|
| canvas | `#FBFAF9` | page ground |
| sand | `#F6F4EF` | quiet fills, chips, rails |
| ink | `#343433` | headings, figures |
| body | `#474645` | paragraphs |
| muted | `#716F6B` | labels, metadata |
| line | `#ECEBE7` | 1px rules and card edges |
| green | `#21803D` | accent: gains, the one CTA state, the source dot |
| mint | `#EEF8F1` | soft accent fills |
| night | `#141312` | the subscription band |

Type: Geist Sans only, with Geist Mono (`.nums`, tabular) for figures. Display
`clamp(2.6rem, 6.9vw, 5.4rem)`, weight 600, line-height 0.96, tracking −0.045em.
Section headings `clamp(2rem, 4.4vw, 3.4rem)` at −0.035em. Body 16–18px at 1.65.
Labels 11–13px, uppercase tracking 0.09–0.16em. Nothing below 10px except a
chart caption inside the product shot.

Grid: 1120px max content, 20–32px gutters, sections at 80–112px vertical padding.
Surfaces: 22–26px radii for windows and big cards, 13px for satellites, 999px for
pills. One shadow per depth class.

### Background and texture

Four layers, all CSS, no images to download:

1. Cream ground.
2. **Aurora** — three large blurred radial washes (green 24%, gold 28%, pink 20%
   at 72px blur, 62% opacity) drifting 28px over 26s behind the hero only.
3. **Dot grid** — 1px ink dots on a 24px pitch at 15%, masked to a soft oval so
   it fades before the edges.
4. **Grain** — an inline `feTurbulence` SVG at 3.5% opacity, fixed, multiply.
   It gives the page a printed quality and hides gradient banding.

Nothing else is decorative. If a gradient does not carry the story, delete it.

### Imagery

- **Hero:** a product shot, not a screenshot. A real macOS-style browser window
  on the page's own ground, pinned top-left, running off the right edge and off
  the foot of its stage, dissolving into the page over a 56px mask. Inside:
  the Finlio dashboard at 1:1 — greeting, net worth with the gain since 30 Sept,
  six quarterly bars in the Indian financial year, a stocks list, recent
  activity. One satellite card ("This month", In/Out/Saved) straddles the
  window's left edge, half outside, covering the rail — chrome, never content.
  Only real words where the story is; gray bars are filler at the edges.
  Build it with the stageshow kit's `Window` (`components/landing/stage-kit`),
  never a hand-drawn window.
- **Product section:** the real dashboard screenshot
  (`public/marketing/dashboard.webp`) inside a quiet browser frame, faded at its
  foot. It is the only photograph on the page.
- **Everything else:** typography, drawn UI and numbers. No people.

### Motion

Library choice: **Lenis** for smooth wheel scrolling, **GSAP** (ScrollTrigger,
SplitText) for the scroll choreography and the load sequence, **Motion** for
micro-interactions — all open source. Every one of them is skipped under
`prefers-reduced-motion: reduce`, and the page's final state is the resting
state, so nothing is ever hidden behind an animation that may not run.

| Beat | Spec |
|---|---|
| Page load | headline words rise through a masked line (yPercent 118 → 0, 0.95s, stagger 0.045), sub 0.42s, CTAs 0.55s, shot 0.7s with bars growing (scaleY 0 → 1, stagger 0.06) and the satellite settling last |
| Scroll reveals | y 26 → 0, opacity 0 → 1, blur 6 → 0, 0.85s `power3.out`, `once`, start at 88% of the viewport; elements already on screen never fade |
| Hero parallax | the shot drifts −48px across the hero, scrub 0.5 |
| Smooth scroll | Lenis `lerp 0.1`, bridged to ScrollTrigger through `gsap.ticker` |
| Privacy story | a sticky stage over 300vh; a scrubbed trigger advances three states (what you keep → what travels → what never travels) at 34% and 68% |
| Micro | magnetic hero CTAs, hover lift on cards, layout-animated billing thumb, digit-roll on prices, height-animated FAQ, 46s marquee pausable on hover |
| Reduced motion | no Lenis, no ScrollTriggers, no SplitText; content in place, accordion still opens, nothing moves on scroll |

Animate only transform, opacity, filter and clip-path. Never hijack touch scroll.

### Section-by-section

**Nav.** Floating pill, 1120px, blur and a hairline shadow after 16px of scroll.
Left: mark + wordmark. **Centre (true optical centring):** Features · Privacy ·
Pricing · FAQ. Right: "Open Finlio" (ink pill). Mobile: wordmark, Open Finlio,
menu; a full-screen sheet with the four links and the same action. A 2px green progress line runs along the
top edge of the page. Anchor jumps glide with Lenis and land 88px below the nav.

Hero, principles strip, features, product, privacy, subscription, FAQ and
footer are written out in Part 2.

### Accessibility and performance

- One `h1`; every section heading is an `h2`; no heading levels skipped.
- Contrast ≥ 4.5:1 for every text colour on its ground, including the dark band.
- Visible focus ring on every interactive element; a "Skip to content" link;
  the mobile sheet traps nothing it cannot release (Escape closes it).
- Decorative artwork is `aria-hidden`; the marquee's duplicate copy is hidden
  from screen readers; the FAQ uses `aria-expanded` / `aria-controls`.
- Tap targets ≥ 44px; no horizontal overflow at 320–1440px.
- Copy is server-rendered and readable with JavaScript disabled.
- Only the islands are client components: nav, hero shot, privacy, pricing,
  FAQ, and the reveal wrappers. No layout shift from fonts or images
  (`next/font`, explicit image sizes).

### Accept, or fix

1. At 1440px, the eye lands on the headline, then the shot, then the green bar.
   Nothing competes.
2. At 390px, the shot becomes a compact single-column design (rail dropped,
   figure smaller), not a squeezed desktop.
3. The page is legible and complete with motion turned off.
4. No invented logo, stock photo, sparkle or purple anywhere.
5. Every claim on the page is true to the product: no database, no advice,
   read-only Gmail, India only, India FY quarters.

---

## Part 2 — The copy deck

### Navigation

`Finlio` · Features · Privacy · Pricing · FAQ · **Open Finlio**

### Hero

> **Private by design**
>
> # Know why your money moved.
>
> Your money, in one view. Understand what changed and why.
>
> **Get started** · Explore Finlio

Caption under the shot: *The Finlio dashboard, with a sample household. Figures
are examples.*

### Principles strip

No Finlio database · Your money stays in your browser · Chat sees totals, never
transactions · Explain, never advise · Built for India

### Features

> ## Everything you own. One quiet place.
>
> Your picture, your spending, your answers.

- **Your whole picture** — Net worth, quarter by quarter, in your financial
  year. Everything you own on one quiet screen.
- **Goals with a clear pace** — The monthly amount needed, and when you should
  get there.
- **Analytics over time** — Compare any period with the one before it.
- **Spending, without the spreadsheet** — Connect Gmail read-only. Bank and UPI
  alerts become categories you can read at a glance.
- **Everything you own, and owe** — Savings, FDs, EPF, PPF, NPS, gold and
  property. Every loan. One ledger.
- **Ask about your own money** — Press ⌘L. It answers from totals and
  percentages, never from your transactions or quantities.

Closing line: *And analytics that show where it sits, where it goes, and what
you are saving toward.*

### Product

> ## A little perspective. Every morning.
>
> Your net worth, spending and recent activity. A clear place to start.

*Sample data. Yours replaces it in a minute.*

### Privacy

> **Privacy**
>
> ## Your money stays on your device.
>
> That is the architecture, not a promise.
>
> **01 — What you keep.** Holdings, assets, spending, goals and history live in
> this browser, in local storage. That is the only copy, so download a backup
> before clearing your browser.
>
> **02 — What travels.** NSE codes, so prices can be fetched. Totals and
> percentages, so Insights and chat can answer. Company web addresses for logos,
> which you can turn off. Bank alert details, only if you connect Gmail.
>
> **03 — What AI never sees.** Share quantities and your transaction list. The
> one exception is reading bank alerts, which runs only if you connect Gmail.

Four facts, as four tinted tiles in a 2×2 bento (mint, butter, blush, sky):
**No database** — there is nothing on our side to breach, sell or hand over.
**Keys stay server-side** — API keys live only in route handlers, never in the
browser. **Revocable access** — read-only Gmail is a separate grant you can
revoke on its own. **Yours to take** — a JSON backup you download, and an Erase
option in Settings that really erases.

Each tile carries one small, tilted product object that proves the line above
it: a `finlio.db` record with a red rule through it and "not created"; a black
`.env.local` card showing keys as dots with a `server-only` chip; a Gmail row
with its own green switch and a red Disconnect; a `finlio-backup.json` file with
a download disc. Objects straighten and the tile lifts 2px on hover. They are
drawn from the product's own surfaces — no stock art, no mascots.

> ## Finlio explains. It never advises.

### Subscription

> **Pricing**
>
> ## Clarity starts free.
>
> Choose Pro for AI summaries and chat. Max adds your preferred AI.
>
> Monthly / Yearly

**Free · ₹0 forever** — Everything you need to see the whole picture.
Net worth and quarterly bars · Holdings, expenses, assets and loans · Analytics
and goals · Built for India: NSE, EPF, PPF and NPS · Local-only storage, JSON
backups.
**Start free**

**Pro · ₹199 a month (₹1,999 a year)** — AI summaries, chat and automatic
spending sync.
Everything in Free · Plain-language AI summaries in Insights · Finlio chat (⌘L),
answered from your totals · Read-only Gmail spending sync.
**Start 14 days free**

*Cancel any time. Your data is yours either way. Prices are examples while
Finlio is in early access.*

### FAQ

> ## A few things you might ask.
>
> Short answers, in the same plain English as the product. If something is
> missing, the Terms have the long version. **Read the Terms**

1. **Where does my data actually live?** In your browser. Holdings, assets,
   loans, spending, goals and history sit in local storage under `finlio:v1`.
   Finlio has no database to store them in.
2. **Does Finlio tell me what to buy?** No. Finlio explains. It never advises,
   and it never says buy, sell or hold. The words are kept out of the prompts as
   well as the writing.
3. **What leaves my device?** Only what each feature needs: NSE codes for prices,
   totals and percentages for Insights and chat, and company web addresses for
   logos, which you can turn off. If you connect Gmail, the sender, subject and
   preview of bank alerts are read to find your spending. The Terms list all of it.
4. **Why would I connect Gmail?** Only if you want spending tracked. It is a
   separate, optional, read-only grant that turns bank and UPI alerts into
   categories. You can disconnect it at any time in Settings.
5. **Who is Finlio for?** People in India. Finlio uses rupees, NSE stocks, the
   April to March financial year and Indian accounts like EPF, PPF and NPS.
6. **What if I clear my browser?** Clearing browser data erases your financial
   data on this device. Download a backup first.
7. **Can I trust the AI's answers?** It answers from your own totals and is told
   not to invent numbers, but AI can still make mistakes. Check anything important
   against the figures in your pages.
8. **Do I need an account?** No. Finlio has no accounts or passwords. It opens in
   your browser, and Google is used only if you choose to connect Gmail.

### Footer

> **Finlio** — Know why your money moved. A private, AI-assisted money dashboard
> for India. **Get started**
>
> Product: Features · Privacy · Pricing · FAQ
> The app: Dashboard · Holdings · Transactions · Analytics · Goals
> Legal: Terms · Your data · Cookies
> Elsewhere: GitHub · gokulakrishnan.dev
>
> © 2026 Gokulakrishnan · Finlio is not a financial adviser · MIT licensed
> Prices by Upstox · Cookie preferences

---

## Part 3 — Assets and notes

| Asset | Path | Notes |
|---|---|---|
| Mark | `public/finlio-mark.png` | 1024², ink on white; multiply onto cream |
| Favicon | `app/icon.png` | shipped by Next |
| Dashboard screenshot | `public/marketing/dashboard.webp` | 2779×1509, sample household, faded at its foot |
| Product shot | `components/landing/hero-shot.tsx` | drawn UI on the stageshow `Window` |
| Kit | `components/landing/stage-kit/` | stageshow kit, MIT, see its `NOTICE.md` |
| Background | `app/globals.css` | aurora, dots, grain |

Assumptions worth knowing:

- **Prices are placeholders.** Finlio has not published pricing; the numbers
  live in `lib/landing-pricing.ts`, the copy says they are examples, and they
  should be replaced before a real launch.
- **Open Finlio goes straight to `/dashboard`.** Finlio has no accounts. Add Log
  in and Sign up only once accounts exist.
- **Copy is English-only.** The app's six languages cover the product, not the
  marketing page.
- **No testimonials.** A privacy-first product with invented quotes would
  contradict the page's whole argument; the principles strip and the privacy
  story carry the same weight without lying.
