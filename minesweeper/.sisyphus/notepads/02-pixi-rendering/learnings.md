## 2026-03-24 D2 Start
- D1 complete: 46 tests, all core logic working
- Core functions are mutation-based; UI must use structuredClone
- No Pixi code exists yet in codebase
- @pixi/react uses `<pixiGraphics draw={g => ...} />` pattern (v7+)
- pixi-viewport provides drag/zoom/clamp plugins for camera control
- nipplejs provides virtual joystick via `create()` API
- React 19 compatibility with @pixi/react needs verification
## 2026-03-24 T2-1 completion notes
- Installed D2 dependencies with Bun: pixi.js, @pixi/react, nipplejs, and @types/nipplejs alias.
- npm no longer publishes a standalone `@types/nipplejs`; using `@types/nipplejs: npm:nipplejs@1.0.1` works because nipplejs bundles `dist/index.d.ts`.
- React 19 in this repo is incompatible with `@pixi/react@7` Stage runtime (ReactCurrentOwner/ReactCurrentBatchConfig errors).
- Switched to `@pixi/react@8` + `pixi.js@8` for browser compatibility and wrapped `Application` as a local Stage alias in `PixiCanvas.tsx` to keep the requested wrapper shape.
- Pixi canvas mount was verified in browser automation (`canvas` present at 320x320), and evidence saved to `.sisyphus/evidence/d2-pixi-setup.png`.

## 2026-03-24 T2-2 completion notes
- `@pixi/react` v8 requires explicit `extend({ Graphics, Text })` before using `<pixiGraphics>`/`<pixiText>` JSX nodes; without extend, canvas remains blank even though Stage mounts.
- For strict palette literals (`as const`), mutable rendering variables (e.g. `fillColor`) should be widened to `number` in branching code to avoid TypeScript literal assignment errors.
- In jsdom tests, `<pixiGraphics>` and `<pixiText>` behave as custom elements, so assertions are most reliable via rendered attributes (`text`) or direct tag queries, not widget runtime behavior.

## 2026-03-24 T2-4 completion notes
- Camera transforms are simplest when isolated: keep zoom/pan state in `useCamera` and apply only through a dedicated `<pixiContainer position scale>` wrapper so grid interaction code stays unchanged.
- DOM-level pointer/wheel handling in `PixiCanvas` avoids intercepting left-click Pixi cell events while still enabling right/middle drag pan and wheel/touch-pinch zoom.
- Touch pinch can be implemented with Pointer Events by tracking two active touch pointers and converting distance delta to the existing wheel-based zoom pathway for shared clamp logic.

## 2026-03-24 T2-5 completion notes
- `nipplejs` module mocking in Vitest requires `vi.hoisted(...)` for factory-owned mocks; plain top-level references inside `vi.mock()` can fail due hoist order (`Cannot access ... before initialization`).
- For strict TypeScript compatibility in joystick wrappers, using a small local manager interface (`on('move' | 'end')`, `destroy`) avoids relying on incomplete/fragile upstream ambient typings while preserving runtime behavior.
- Mobile control wiring can stay D2-safe by rendering controls only when touch/mobile is detected and connecting Dig/Flag callbacks to existing game action handlers; Detonate can remain a no-op placeholder until D5.

## 2026-03-24 T2-6 completion notes
- Keep keyboard input isolated in a hook that only dispatches callbacks from `event.code`, and guard with `event.repeat` to avoid long-press replay bugs.
- For temporary PC cursor UX, pass `{x,y}` from App through `GridInteraction` → `GridRenderer` → `CellGraphics` and draw a dedicated highlight stroke, instead of coupling cursor state to cell data.
- Mobile ActionButtons can be aligned with keyboard cursor behavior without prop changes by wiring Dig/Flag callbacks to shared `handle*AtCursor` functions in `App.tsx`.

## 2026-03-24 Mobile Layout Fix
- Conditionally hiding DOM sections (like the D1 grid and desktop headers) via `isMobile` ensures both space reclamation and DOM event clarity on mobile.
- To prevent landscape overflow issues in fixed mobile UI overlays, use CSS media queries combining `(max-height: ...)` and `(orientation: landscape)`. This allows scaling down buttons and adjusting their coordinates gracefully.
- Re-measuring the viewport in a hook using `window.addEventListener("resize")` enables dynamic PixiJS canvas sizes (`window.innerWidth` and `window.innerHeight - X`) which ensures the stage perfectly fits available mobile real estate without clipping.
- Setting `document.documentElement.style.overflow = "hidden"` while `isMobile` is true effectively stops bounce-scroll and off-canvas panning on mobile browsers.
