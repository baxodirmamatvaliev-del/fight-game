# 1.0.0 release checks

## Landscape forest revision

- Original living forest background, gold health bars, portrait badges and central timer.
- Full-viewport landscape mobile combat with an overlaid left joystick and right action buttons.
- Portrait gate freezes gameplay, supports manual rotation and returns safely to selection.
- Multi-touch test covers simultaneous movement and kick, pointer release, all actions and rotation recovery.
- Browser orientation lock/fullscreen are optional; real iOS/Android hardware and in-app browser restrictions still require physical-device verification.

## Selection-site revision

- Five playable fighters, including generated Sub-Zero and Scorpion fan art. The full Mortal Kombat roster is not implemented.
- Immediate lightweight startup, with optional Python loading in the background and no backend switching during a match.
- 22 Python tests plus lightweight engine checks cover gameplay and ice hit stun.
- Dedicated browser checks block Python downloads and verify selection, all four arrow attacks and real mobile punch/jump taps.
- Share button uses the native share sheet or clipboard. Public anonymous access is checked after publication.
- Character selection precedes combat; oversized mobile buttons support multiple simultaneous touches.

- 21 Python gameplay tests cover movement, jumping, arena bounds, hit windows, one-hit attacks, frontal/back blocking, airborne evasion, energy cost, projectiles, action edges, countdown, best-of-three, draws, frame clamps, JSON bridge, a CPU-vs-CPU match, practice safety/progress/reset and buffered attacks/jumps.

- Attack and jump presses are remembered for 180 ms, allowing late follow-ups and jumps just before landing without automatic repeated attacks.
- Real Chrome browser verification covers the Python/WebAssembly startup, gameplay damage, menus, all three arenas, sound activation, pause/time freeze, full local match, rematch, saved settings and emulated mobile touch controls.
- JavaScript modules are syntax-checked with Node.
- `npm ci` pins dependency versions; bundled Pyodide avoids runtime CDN dependencies.
- Artwork combines generated realistic fighter atlases and foundry backgrounds with a procedural fallback; fonts are self-hosted with licenses.
- The control guide is shown before the first fight. Keyboard mappings remain visible below the arena, with live pressed-key feedback, and inside desktop combat. Mobile controls have explicit direction labels.
- Access was changed to public at the user's request; anonymous production startup is checked after publication.
- Practice browser tests verify all seven accepted actions, safe dummy, untimed session, hit counter, progress reset, statistics exclusion, transition to a CPU fight and mobile layout. Normal combat remains covered by the existing complete-match browser suite.

Hardware testing of physical gamepads and real iOS/Android devices is not automated. Local multiplayer is same-device only; online multiplayer is not included. Modern browsers with WebAssembly and Web Audio are required.
