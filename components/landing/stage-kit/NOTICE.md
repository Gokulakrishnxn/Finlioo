# Stageshow kit

This folder is a copy of the `kit/` from **stageshow** by Benji Taylor
(https://github.com/benjitaylor/skills, MIT — see `LICENSE`).

It draws the marketing page's hero product shot: the window chrome and its
tokens. `components/landing/hero-shot.tsx` imports `window.tsx` directly and
maps `--ss-*` tokens onto Finlio's palette; nothing else from the kit is used,
and the rest is kept as shipped so the copy can be updated in one go.

The skill was installed with `npx skills add benjitaylor/skills --skill stageshow`
and lives in `.agents/skills/stageshow`.
