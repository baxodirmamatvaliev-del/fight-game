# 1.0.0 release checks

- 15 Python gameplay tests cover movement, jumping, arena bounds, hit windows, one-hit attacks, frontal/back blocking, airborne evasion, energy cost, projectiles, action edges, countdown, best-of-three, draws, frame clamps, JSON bridge and a CPU-vs-CPU match.
- Real Chrome browser verification covers the Python/WebAssembly startup, gameplay damage, menus, all three arenas, sound activation, pause/time freeze, full local match, rematch, saved settings and emulated mobile touch controls.
- JavaScript modules are syntax-checked with Node.
- `npm ci` pins dependency versions; bundled Pyodide avoids runtime CDN dependencies.
- Artwork is procedural; fonts are self-hosted with licenses.

Hardware testing of physical gamepads and real iOS/Android devices is not automated. Local multiplayer is same-device only; online multiplayer is not included. Modern browsers with WebAssembly and Web Audio are required.
