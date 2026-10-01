# Deploy the Phaser game

Only deploy **phaser-core**, not the older game at the repository root.
No backend, secrets or environment variables are required.

## Vercel

1. Commit/push the project to your Git provider, then import the repository in Vercel.
2. Set **Root Directory** to `phaser-core` (leave empty if this folder is its own repository).
3. Choose **Vite**, install command `npm ci`, build command `npm run build`, output `dist`.
4. Deploy. Open the production HTTPS URL, tap for audio, rotate to landscape and test Arcade/Training.
5. Share that production URL. Check deployment protection settings if visitors are asked to sign in.

Reference: https://vercel.com/docs/frameworks/frontend/vite

## Netlify

1. Import the repository from your Git provider.
2. Set **Base directory** to `phaser-core` (empty for a standalone repository).
3. Build command: `npm run build`. Publish directory: `dist` (relative to the base).
4. Deploy and share the HTTPS production URL.

Or build locally with `cd phaser-core`, `npm ci`, `npm run build`, then upload the
resulting **phaser-core/dist** folder through Netlify's manual deploy UI.

Reference: https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/

## Mobile verification

Arcade and Training are touch-playable. Versus remains local two-player keyboard
play (external keyboard required for P2); there is no online multiplayer.
Joystick: horizontal movement, up to jump, down to crouch. Attack buttons are
one-shot per press, block is held, special is a direct equivalent of the keyboard
motion command, super requires 100 meter. Rotate/pause/focus loss clears touches.

The canvas remains 16:9 and letterboxes instead of stretching. Touch controls
respect safe areas. Combat disables page pan/pinch/double-tap zoom; menu panels
retain vertical scrolling for small screens and accessibility. Browser/OS-level
accessibility zoom cannot be forcibly disabled in all browsers.

Performance: one shared 1920×1920 sprite atlas, 24 reusable spark objects, 10 Hz
menu preview redraws, fixed 960×540 render resolution. Rendering targets 60 FPS,
but physical-device performance is hardware-dependent. Verify Safari on iPhone
and Chrome on Android before calling a release device-certified.
