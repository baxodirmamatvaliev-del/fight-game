# Loyiha tuzilishi

## Papkalar

```text
fight-game/
├── public/
│   ├── index.html         Sahifa tuzilishi va dialoglar
│   ├── css/               Barcha sahifa uslublari
│   ├── js/                Brauzer modullari
│   ├── python/            Python jang qoidalari
│   ├── assets/            Jangchi va arena tasvirlari
│   └── fonts/             Shriftlar va litsenziyalar
├── scripts/               Build, paketlash va formatlash
├── tests/                 Python va brauzer testlari
├── docs/                  Tuzilish, tasvirlar va nashr yo‘riqnomalari
├── serve.py               Mahalliy server
├── package.json           JavaScript buyruqlari va paketlar
└── pyproject.toml         Python formatlash qoidalari
```

`dist/`, `node_modules/`, `.venv/` va `test-results/` — yaratiladigan papkalar.
Ulardagi fayllarni qo‘lda tahrirlash kerak emas.

## JavaScript modullari

| Fayl                                    | Vazifasi                                               |
| --------------------------------------- | ------------------------------------------------------ |
| `app.js`                                | Modullarni ulash, jangni boshlash, asosiy render sikli |
| `engine.js`                             | Python yuklash va zaxira dvigatelni tanlash            |
| `fallback-engine.js`                    | Python mavjud bo‘lmagandagi jang qoidalari             |
| `fighters.js`, `sprites.js`, `arena.js` | Qahramon, animatsiya va arena tasvirlari               |
| `input.js`, `touch.js`                  | Klaviatura, gamepad va telefon boshqaruvi              |
| `audio.js`, `music.js`, `particles.js`  | Ovoz, musiqa va vizual effektlar                       |
| `menu.js`, `controls.js`, `training.js` | Tanlov, tugmalar yo‘riqnomasi va mashq                 |
| `hud.js`, `screens.js`                  | Jon/energiya ko‘rsatkichlari, pauza va natija          |
| `storage.js`                            | Brauzerdagi sozlamalar va statistika                   |

## Python modullari

- `config.py`: jangchilar, zarbalar va qiyinlik sozlamalari.
- `fighter.py`: bitta jangchining harakati va holati.
- `combat.py`, `projectiles.py`: yaqin zarba va maxsus zarba.
- `match.py`: raundlar, g‘olib va mashq rejimi.
- `opponent.py`: kompyuter raqibi.
- `bridge.py`: brauzer bilan JSON almashinuvi.

## CSS tartibi

`index.html` uslublarni quyidagi qatlamlar bilan ulaydi:

1. `styles.css`: asosiy ranglar, shriftlar va komponentlar.
2. `hud.css`, `responsive.css`, `touch.css`, `screens.css`: ko‘rsatkichlar, ekran o‘lchamlari va boshqaruv.
3. `refinement.css`, `training.css`: komponentlarni aniqlashtirish va mashq rejimi.
4. `combat-theme.css`, `tournament.css`: yakuniy jang mavzusi va qahramon tanlash sayti.

Qatlamlar tartibi o‘yinning mavjud ko‘rinishini saqlaydi. CSS ichidagi rasm va
shrift yo‘llari `../assets/` va `../fonts/` orqali ochiladi.

## Yagona kod formati

JavaScript, HTML, CSS, JSON va Markdown uchun Prettier ishlatiladi. Python uchun
Black ishlatiladi. Ikkalasi ham 88 belgili qator uzunligiga sozlangan.

Bir marta tayyorlash (macOS/Linux):

```bash
npm ci
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
```

Windows’da `.venv/bin/python` o‘rniga `.venv\Scripts\python.exe` ishlating.

```bash
npm run format        # Kod formatini tuzatish
npm run format:check  # O‘zgartirmasdan formatni tekshirish
npm run check         # Format + unit testlar + build
```

Brauzer sinovlari uchun boshqa terminalda `npm run dev` ishga tushiring:

```bash
npm run test:browser
npm run test:practice
npm run test:redesign
```

Nashr uchun o‘zgarishlarni commit qilgandan keyin `npm run package` ishlating.
