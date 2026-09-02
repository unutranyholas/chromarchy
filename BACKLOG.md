# Backlog

- Try stretching the chroma gradient to the full track (`0…maximumChroma`)
  instead of showing the transparent out-of-sRGB tail. Compare gamut clarity,
  pointer behavior, and control precision on the desktop before deciding.
- If the worker's measured 38–48 ms warm generation remains noticeable, profile
  before switching Color.js to its functional/tree-shakable entry point. The
  worker already removes repeated 88–103 ms process launches and caches the
  immutable Radix reference scales; `open`, `apply`, and `undo` remain
  short-lived commands.
- Support multiple Chromarchy themes when there is a concrete switching UX.
  The filesystem layer already accepts `targetSlug` and stores recipes per
  slug; the missing pieces are theme creation/naming, selection, and per-theme
  undo instead of the current single managed `chromarchy` theme.
