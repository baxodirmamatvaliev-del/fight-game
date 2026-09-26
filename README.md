# NEON CLASH

A Python-powered 2D arcade fighting game. Original neon arenas, three animated fighters, synthesized sound effects and adaptive synthwave music. Play against the CPU or a friend on the same device.

## Play locally

Install Python 3.10+ and Node.js 20+, then:

```bash
npm ci
python3 serve.py
```

Open **http://localhost:8000**. The first load starts a bundled Python WebAssembly runtime. No Python packages, external runtime CDN, account or game download is required. JavaScript and WebAssembly must be enabled.

## Controls

| Action | Player 1 | Player 2 |
| --- | --- | --- |
| Move | A / D | Left / Right arrows |
| Jump | W | Up arrow |
| Block | S | Down arrow |
| Punch | J | 1 |
| Kick | K | 2 |
| Special | L | 3 |
| Pause | P / Escape | P / Escape |
| Fullscreen | F | F |

Each attack needs a new press. Win two rounds to win the match. Rounds last 60 seconds. A special costs 35 energy; energy recharges slowly and builds through hits and blocks. Blocking reduces frontal damage but does not protect the back. Jump over projectiles to avoid them.

On touch devices, on-screen controls support simultaneous movement and attacks. Local two-player mode needs a keyboard or two gamepads; the mobile controls operate player 1. Standard gamepad: left stick/D-pad move, A jump, X punch, Y kick, B special, LB block, Start pause. Chrome, Edge, Firefox and Safari with WebAssembly are the intended browsers; automated verification uses Chrome desktop and an emulated iPhone viewport.

## Fighters and arenas

- **Volt:** balanced fighter, electric green Thunder Bolt.
- **Ember:** heavier damage, slower movement, orange Solar Flare.
- **Ghost:** fastest movement, lighter damage, violet Phantom Pulse.
- **Midnight District:** rainy neon skyline.
- **Crimson Shrine:** moonlit temple and floating embers.
- **Zero Gravity:** orbital station and a planet backdrop.

CPU has easy, normal and hard difficulty. Preferences and CPU match statistics save locally in the browser. No data is uploaded. Audio starts after your first interaction, following browser autoplay rules. Music, volume and screen shake can be adjusted; reduced-motion preferences are respected.

## Architecture

`public/python/` owns movement, collision, damage, blocking, energy, CPU decisions and rounds. This exact Python source runs in the browser using **Pyodide 0.27.7**. JavaScript handles Canvas graphics, keyboard/touch/gamepad input, Web Audio and menus. `serve.py` is a Python development server, not an online multiplayer backend.

The deployed game is static: its Python runtime, fonts and all game assets are bundled locally. Original artwork is drawn procedurally; combat effects and music are synthesized in the browser. There are no Mortal Kombat assets.

```text
public/
  python/       Python gameplay modules
  js/           Browser rendering, audio and UI
  fonts/        Bundled open-license fonts
  *.css         Arcade UI styles
scripts/        Build and deployment packaging
tests/          Python and real-browser checks
serve.py        Local Python HTTP server
```

## Verify and build

```bash
npm test
npm run build
# With the development server running:
npm run test:browser
```

Browser tests use installed Google Chrome on macOS. On other platforms run `npx playwright install chromium`, or set `CHROME_PATH` to your browser executable. Screenshots go to ignored `test-results/`. The browser suite verifies startup, real Python combat, audio activation, fighter/arena selection, dialogs, pause, a complete match, rematch, persistence, mobile layout and touch movement.

Deploy the generated `dist/` directory to any static host that serves `.wasm` as `application/wasm`. Paths are relative, so subdirectory hosting also works. An optional, manually triggered GitHub Pages workflow is included; enable Pages with GitHub Actions as its source and run it on `develop`. OpenAI Sites hosting metadata is in `.openai/hosting.json`. After committing, `npm run package` builds a deployment archive from the clean committed source.

## Development history

The implementation is organized into **30 new commits on `develop`**. See [docs/COMMITS.md](docs/COMMITS.md). The original `master` history and unrelated local changes are preserved.

## Asset licenses

Art, music and sound effects were created for this project. Barlow Condensed and DM Sans are distributed under the SIL Open Font License; license files are included in `public/fonts/`. Pyodide is an upstream open-source runtime and remains under its upstream license. See [THIRD_PARTY.md](THIRD_PARTY.md).
