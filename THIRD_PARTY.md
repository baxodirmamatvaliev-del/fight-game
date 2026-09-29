# Third-party components

- **Three.js 0.180.0** — https://github.com/mrdoob/three.js/tree/r180 — MIT. Bundled locally; license is copied to `vendor/three/LICENSE` during build.
- **Soldier / Vanguard skinned model and Idle/Walk motion** — https://github.com/mrdoob/three.js/blob/r180/examples/models/gltf/Soldier.glb . Three.js credits the model to Mixamo: https://threejs.org/examples/webgl_animation_skinning_blending.html . Adobe permits embedding Mixamo characters and animations in games: https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html . Used here as an embedded game character with original combat posing and colour variants, not as a standalone model product. This is not a Mortal Kombat model.
- **Male Grunt/Yelling sounds**, HaelDB — https://opengameart.org/content/male-gruntyelling-sounds — CC0 option. Six original WAV recordings (`1yell1`, `1yell2`, `1yell6`, `2yell1`, `2yell3`, `2yell10`) are embedded under `public/assets/audio/`. These are not Mortal Kombat recordings.

- **Pyodide 0.27.7** — https://github.com/pyodide/pyodide — MPL-2.0 and upstream dependency licenses. The runtime packages CPython and WebAssembly components; see the upstream distribution for component-specific notices. A copy of the upstream Pyodide license is included in every build.
- **Barlow Condensed** — https://github.com/google/fonts/tree/main/ofl/barlowcondensed — SIL Open Font License 1.1. Included notice: `public/fonts/BARLOW-LICENSE.txt`.
- **DM Sans** — https://github.com/google/fonts/tree/main/ofl/dmsans — SIL Open Font License 1.1. Included notice: `public/fonts/DM-SANS-LICENSE.txt`.
- **Playwright** — https://github.com/microsoft/playwright — Apache-2.0. Development and testing only; not shipped in the game.

NEON CLASH's environments and character-selection portraits were generated for this project with the built-in imagegen tool. The procedural fallback, music patterns and impact synthesis are original code. Asset paths and generation prompts are recorded in `docs/ART.md`. Sub-Zero and Scorpion names/portraits are fan interpretations; this is an unofficial fan project. No original Mortal Kombat model, sound recording or music is included.
