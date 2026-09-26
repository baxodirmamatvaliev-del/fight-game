"""Shared rules for the original NEON CLASH fighters."""
WIDTH = 1200
FLOOR = 535
GRAVITY = 1900
ROUND_SECONDS = 60
FIGHTERS = {
    "volt": {"name": "VOLT", "title": "Muvozanatli jangchi", "color": "#c9aa63", "speed": 305, "power": 1.0, "special": "Thunder bolt"},
    "ember": {"name": "EMBER", "title": "Kuchli zarbalar", "color": "#c65942", "speed": 275, "power": 1.12, "special": "Solar flare"},
    "ghost": {"name": "GHOST", "title": "Tezkor harakat", "color": "#87a9bb", "speed": 330, "power": .9, "special": "Phantom pulse"},
}
ATTACKS = {
    "punch": {"duration": .32, "active": .10, "end": .21, "reach": 103, "damage": 7, "knock": 24},
    "kick": {"duration": .51, "active": .18, "end": .32, "reach": 151, "damage": 12, "knock": 48},
    "special": {"duration": .62, "active": .21, "end": .28, "reach": 0, "damage": 18, "knock": 65},
}
DIFFICULTIES = {"easy": {"reaction": .42, "aggression": .48}, "normal": {"reaction": .23, "aggression": .7}, "hard": {"reaction": .12, "aggression": .9}}
