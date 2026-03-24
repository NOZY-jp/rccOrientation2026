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
