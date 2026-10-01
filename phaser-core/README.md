# Fight engine core

## Menu flow

Animated title → main menu → P1/P2 character selection → VS intro → battle.
Arcade is a single CPU exhibition; Versus is local shared-keyboard play; Training
has an untimed dummy, full player meter and dummy health reset after KO.
The six original placeholder roster entries use palette variants and the same
core moveset, not six finished characters. Hover/focus previews a fighter; tap
selects it and the explicit confirmation button locks it in.

Escape or the pause button opens Resume, Move List, Settings, Restart and Main Menu.
Settings persist master volume, mute and reduced motion. P2 uses arrows, N punch,
M kick, / block and . super. Keyboard focus, touch feedback and narrow/landscape
layouts are supported; mobile menus do not add touch controls to combat.

Run `npm run test:menus` with the dev server running. The old combat regression
test uses the development-only `?arena=1` shortcut; production always shows menus.
`src/ui/MenuUI.ts`, `menus.css` and `roster.ts` own navigation, styling and roster.

## Audio

`src/AudioManager.ts` supplies synthesized impacts, whooshes, special/super cues,
distinct player/dummy grunts and looping stage music. The announcer uses device
text-to-speech with visible captions unless replacement recordings are supplied.
Tap/click or press a key to unlock audio; the SOUND control toggles mute.
All 12 optional replacement filenames and licensing notes are listed in
[the audio replacement guide](src/assets/audio/README.md).
Audio tests verify desktop output and mobile-emulated first-tap unlock; physical
iOS/Android speech playback still needs testing on the target devices.

Independent Phaser 3 + TypeScript + Vite project with cinematic menus and animated placeholder fighters. The previous game remains unchanged.

## Animation and combat additions

The generated sprite sheet has 14 rows, eight 192×160 frames per row: idle, walk,
jump, crouch, block, punch, kick, hit, knockdown, get-up, victory, death, special,
super. Frames are baked once; gameplay displays discrete atlas frames rather than
rotating limbs. Animation follows combat frames, including hitstop. Final KO slows
the death/victory animation and sparks for 900 ms; gameplay is already round-locked.

**Special:** press S (down), then forward + J within 18 simulation frames (~300 ms).
Forward is D when facing right, A when facing left. **Super:** L at 100 meter.
Confirmed hits earn 16 meter; blocked attacks earn 4. A landed punch can cancel
into kick; connected normals can cancel into special or super. The combo counter
counts uninterrupted hitstun, not merely hits close together. Specials/supers knock
down; 36-frame knockdown leads to 24-frame invulnerable get-up. R clears all effects.

TODO(ART): replace `createPlaceholderSheet` in `src/SpriteFighter.ts` with a PNG
loaded by Phaser's spritesheet loader. Keep the 192×160 cells, eight columns,
listed row order and feet pivot (96,144), or update that module's metadata.
Placeholder silhouettes are intentionally simple; replace with authored frames,
then tune per-animation frame timing. Shadows and sparks are code-native effects.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173. Run `npm test`, `npm run build` and, while the dev server runs, `npm run test:browser`. Browser tests use Chrome on macOS; elsewhere install Playwright Chromium (`npx playwright install chromium`) or set `CHROME_PATH`.

Controls: A/D move, W jump, S crouch, Space block, J punch, K kick. R resets the round; B toggles dummy guard; T triggers a dummy punch to test defense. F2 toggles debug boxes (green hurtbox, red active hitbox). No auto-repeat attacks. Ground attacks only; crouch ducks high punches, not kicks. Block is frontal and prevents damage. Timer pauses during hitstop; KO or timeout freezes combat until reset.

Architecture:

- `config.ts`: dimensions, movement, health, frame-based attack data.
- `StateMachine.ts`: explicit states, elapsed frames and action locks.
- `Fighter.ts`: movement, state transitions, boxes, damage and stun.
- `FightWorld.ts`: pure simulation, separation, attack resolution, trades, hitstop and rounds.
- `InputManager.ts`: held controls and one-shot edges, focus cleanup.
- `main.ts`: Phaser presentation and fixed 60 Hz accumulator. Rendering targets 60 FPS; actual display rate depends on hardware. No Arcade Physics dependency: combat uses deterministic fixed-step AABB logic, independently testable without Phaser or a browser.

The Vite dev build exposes `window.fightCore` for diagnostics. This hook is excluded from production. Long frames are capped at 100 ms; unfocused time is discarded rather than fast-forwarding the round.

Tool references: [Phaser documentation](https://docs.phaser.io/) and [Vite guide](https://vite.dev/guide/).
