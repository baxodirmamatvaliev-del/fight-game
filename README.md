# NEON CLASH

A browser fighting-game fan prototype with five playable fighters, including newly generated Sub-Zero and Scorpion art. Select a hero before entering the arena; share the public URL using the Share button. This is not an official Mortal Kombat game and does not contain the full Mortal Kombat roster or commercial animations.

Python powers combat when its bundled WebAssembly runtime is available. A lightweight JavaScript equivalent makes the game immediately playable when downloads are slow, blocked or unsupported; the backend never changes mid-match. Large mobile buttons support simultaneous movement and attacks.

## Play locally

Install Python 3.10+ and Node.js 20+, then:

```bash
npm ci
python3 serve.py
```

Open **http://localhost:8000**. The first load starts a bundled Python WebAssembly runtime. No Python packages, external runtime CDN, account or game download is required. JavaScript and WebAssembly must be enabled.

## Controls

On phones, fights use landscape orientation: rotate the device sideways. A portrait
gate freezes the match while you rotate. The left virtual joystick moves the fighter;
the right circular buttons punch, kick, block, jump and launch a special. Controls
overlay the arena instead of taking a separate section below it. Fullscreen and
orientation lock are best-effort; Safari and in-app browsers may require manual
rotation or opening the link in the system browser.

The default arena is **Tirik o‘rmon**, an original generated living forest with
sunbeams, mist, ancient tree faces and a clear fighting ground.

| Action     | Player 1        | Player 2     |
| ---------- | --------------- | ------------ |
| Move       | A / D           | Numpad 4 / 6 |
| Jump       | W               | Numpad 8     |
| Block      | Down arrow / S  | Numpad 5     |
| Punch      | Left arrow / J  | 1            |
| Kick       | Right arrow / K | 2            |
| Special    | Up arrow / L    | 3            |
| Pause      | P / Escape      | P / Escape   |
| Fullscreen | F               | F            |

Each attack needs a new press. Win two rounds to win the match. Rounds last 60 seconds. A special costs 35 energy; energy recharges slowly and builds through hits and blocks. Blocking reduces frontal damage but does not protect the back. Jump over projectiles to avoid them.

On touch devices, on-screen controls support simultaneous movement and attacks. Local two-player mode needs a keyboard or two gamepads; the mobile controls operate player 1. Standard gamepad: left stick/D-pad move, A jump, X punch, Y kick, B special, LB block, Start pause. Chrome, Edge, Firefox and Safari with WebAssembly are the intended browsers; automated verification uses Chrome desktop and an emulated iPhone viewport.

## Fighters and arenas

- **Volt:** balanced fighter, electric green Thunder Bolt.
- **Ember:** heavier damage, slower movement, orange Solar Flare.
- **Ghost:** fastest movement, lighter damage, violet Phantom Pulse.
- **Tungi zavod:** industrial foundry with warm furnace and cool overhead lights.
- **Qizil pech:** warmer color grade of the foundry environment.
- **Sovuq sektor:** cool color grade of the foundry environment.

CPU has easy, normal and hard difficulty. Preferences and CPU match statistics save locally in the browser. No data is uploaded. Audio starts after your first interaction, following browser autoplay rules. Music, volume and screen shake can be adjusted; reduced-motion preferences are respected.

**Mashq rejimi** teaches seven actions with live progress. Choose it in the mode panel or select **Avval mashq qilish** in the initial control guide. The dummy does not attack, time is unlimited, energy refills and the dummy recovers health. The guide in the arena suggests the next action; the checklist below the arena marks actions that the Python game has actually accepted. You can reset the practice or move directly to a CPU match. Practice is excluded from match statistics.

Successful hits briefly freeze the fighters to emphasize impact; idle fighters have subtle breathing motion. Disabling effects or requesting reduced motion disables the impact freeze.

## Architecture

`public/python/` implements movement, collision, damage, blocking, energy, CPU decisions and rounds through **Pyodide 0.27.7**. `public/js/fallback-engine.js` implements the same rules for immediate startup without WebAssembly. JavaScript also handles Canvas graphics, input, Web Audio and menus. `serve.py` is a Python development server, not an online multiplayer backend.

The deployed game is static: its Python runtime, fonts and all game assets are bundled locally. The foundry environment and eight-pose fighter atlases were generated with the built-in imagegen tool; Canvas selects and anchors the appropriate pose. A procedural fighter renderer provides a fallback. Combat effects and music are synthesized in the browser. Sub-Zero and Scorpion are generated fan-art interpretations, not ripped commercial game assets. See [docs/ART.md](docs/ART.md) for asset paths and prompts.

```text
public/
  python/       Python gameplay modules
  js/           Browser rendering, audio and UI
  fonts/        Bundled open-license fonts
  css/          UI styles and theme layers
  assets/       Generated fighter and arena images
scripts/        Build and deployment packaging
tests/          Python and real-browser checks
serve.py        Local Python HTTP server
```

## Verify and build

See [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for module responsibilities,
stylesheet order and formatting setup. Run `npm run format` to format all maintained
source files, or `npm run check` for formatting, gameplay tests and a fresh build.

```bash
npm test
npm run build
# With the development server running:
npm run test:browser
npm run test:practice
```

Browser tests use installed Google Chrome on macOS. On other platforms run `npx playwright install chromium`, or set `CHROME_PATH` to your browser executable. Screenshots go to ignored `test-results/`. The browser suite verifies startup, real Python combat, audio activation, fighter/arena selection, dialogs, pause, a complete match, rematch, persistence, mobile layout and touch movement.

Deploy the generated `dist/` directory to any static host that serves `.wasm` as `application/wasm`. Paths are relative, so subdirectory hosting also works. An optional, manually triggered GitHub Pages workflow is included; enable Pages with GitHub Actions as its source and run it on `develop`. OpenAI Sites hosting metadata is in `.openai/hosting.json`. After committing, `npm run package` builds a deployment archive from the clean committed source.

## Development history

The implementation is organized into **30 new commits on `develop`**. See [docs/COMMITS.md](docs/COMMITS.md). The original `master` history and unrelated local changes are preserved.

## Asset licenses

Art, music and sound effects were created for this project, including generated fighter and arena artwork. Barlow Condensed and DM Sans are distributed under the SIL Open Font License; license files are included in `public/fonts/`. Pyodide is an upstream open-source runtime and remains under its upstream license. See [THIRD_PARTY.md](THIRD_PARTY.md).
