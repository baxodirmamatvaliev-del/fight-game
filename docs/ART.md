# Serious arena revision

Generated using the built-in imagegen tool, not the API/CLI fallback.

## Saved assets

- `public/assets/foundry-arena.png`: original cinematic foundry environment.
- `public/assets/volt-poses.png`: eight realistic Volt poses.
- `public/assets/ember-poses.png`: eight realistic Ember poses.
- `public/assets/ghost-poses.png`: eight realistic Ghost poses.

## Arena prompt

Use case: stylized-concept. Asset type: background art for an adult-oriented 2D martial arts fighting game. Create a photorealistic cinematic industrial underground fighting arena, abandoned steel foundry at midnight, weathered concrete, pipes, industrial lamps, subtle fog, amber furnace glow on the right and cold cyan light on the left. Wide 2:1 composition, camera perfectly front-facing for side-view combat, no tilted camera. The background wall takes the upper 82 percent of the image. Flat unobstructed horizontal floor starts at exactly 83 percent image height and fills the bottom 17 percent. Spacious clear central foreground for two fighters added by code. Beautiful high-detail environmental texture, dramatic light, gritty serious tone, AAA game environment concept art. No people, no fighters, no cartoon, no anime, no text, no logos, no UI, no watermark.

## Fighter prompt template

Use case: stylized-concept. Asset type: one transparent sprite atlas for a serious adult 2D martial arts game. Create a photorealistic high-detail adult fighter sprite sheet, cinematic realistic pre-rendered 3D game art, natural adult anatomical proportions, realistic skin, rugged face, fabric and leather texture. Exactly FOUR columns and TWO rows, eight equally sized rectangular cells, perfectly regular grid, no cell borders, no labels, no text. Entire canvas 2048x1024. Every cell contains one full-body view of the SAME fighter facing RIGHT in side-view three-quarter profile, boots entirely visible, no cropped limbs. Every fighter is the same scale and the boot baseline is the same at 92 percent cell height. Transparent RGBA background, nothing except the fighter. Row1 columns1-4: idle boxing guard, walking forward left leg step, walking forward right leg step, straight right punch extended to the right. Row2 columns1-4: high right kick extended to the right, defensive forearm block, jumping with both knees raised, energy attack with both palms thrust right (no large energy orbs). All poses fit entirely inside their own cell, use negative space around each silhouette. No cartoon, no chibi, no anime, no outlined vector style, no logos, no copyrighted characters.

Character variants appended to that template:

- Volt: a 32-year-old athletic muscular male underground fighter, olive sleeveless martial arts jacket, dark charcoal cargo combat trousers, black boots, brown hand wraps, short black hair, subtle gold headband. No helmet, no mask, no glowing eyes. Cool steel-blue rim light and warm amber key light.
- Ember: a 38-year-old rugged muscular male martial artist, weathered dark red sleeveless open martial arts vest, dark pants, black boots, black hand wraps, very short dark hair and stubble beard, tan skin. No helmet, no mask, no glowing eyes. Warm amber rim light and neutral key light.
- Ghost: a 30-year-old lean athletic male tactical martial artist, slate-blue fitted sleeveless tactical jacket, dark grey combat pants, black boots and gloves, short ash-grey hair, subtle cloth mask over the lower face only. No helmet, no glowing eyes. Desaturated cool rim light and neutral key light.

The three arena options now use the same foundry architecture with distinct color grades. A procedural anatomical fighter renderer remains as a fallback if an atlas cannot load. These generated poses are not motion-captured or commercial game assets.
