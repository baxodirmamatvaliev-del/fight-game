"""Shared rules for the original NEON CLASH fighters."""

WIDTH = 1200
FLOOR = 535
GRAVITY = 1900
ROUND_SECONDS = 60
FIGHTERS = {
    "subzero": {
        "name": "SUB-ZERO",
        "title": "Muz jangchisi",
        "color": "#83daff",
        "speed": 300,
        "power": 1.0,
        "special": "Muz zarbasi",
        "element": "ice",
    },
    "scorpion": {
        "name": "SCORPION",
        "title": "Olov ninjasi",
        "color": "#ffb443",
        "speed": 285,
        "power": 1.1,
        "special": "Olov zarbasi",
        "element": "fire",
    },
    "volt": {
        "name": "VOLT",
        "title": "Muvozanatli jangchi",
        "color": "#c9aa63",
        "speed": 305,
        "power": 1.0,
        "special": "Thunder bolt",
    },
    "ember": {
        "name": "EMBER",
        "title": "Kuchli zarbalar",
        "color": "#c65942",
        "speed": 275,
        "power": 1.12,
        "special": "Solar flare",
    },
    "ghost": {
        "name": "GHOST",
        "title": "Tezkor harakat",
        "color": "#87a9bb",
        "speed": 330,
        "power": 0.9,
        "special": "Phantom pulse",
    },
}
ATTACKS = {
    "punch": {
        "duration": 0.32,
        "active": 0.10,
        "end": 0.21,
        "reach": 103,
        "damage": 7,
        "knock": 24,
    },
    "kick": {
        "duration": 0.51,
        "active": 0.18,
        "end": 0.32,
        "reach": 151,
        "damage": 12,
        "knock": 48,
    },
    "special": {
        "duration": 0.62,
        "active": 0.21,
        "end": 0.28,
        "reach": 0,
        "damage": 18,
        "knock": 65,
    },
}
DIFFICULTIES = {
    "easy": {"reaction": 0.42, "aggression": 0.48},
    "normal": {"reaction": 0.23, "aggression": 0.7},
    "hard": {"reaction": 0.12, "aggression": 0.9},
}
