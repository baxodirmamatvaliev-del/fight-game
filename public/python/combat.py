from config import ATTACKS, WIDTH


def damage(attacker, defender, amount, knock, events, special=False):
    blocked = defender.action == "block" and (attacker.x - defender.x) * defender.facing > 0
    dealt = amount * attacker.stats["power"] * (.12 if blocked else 1)
    actual_damage = min(defender.health, dealt)
    defender.health = max(0, defender.health - dealt)
    direction = 1 if defender.x >= attacker.x else -1
    defender.x = max(65, min(WIDTH - 65, defender.x + knock * direction * (.35 if blocked else 1)))
    defender.energy = min(100, defender.energy + (7 if blocked else 5))
    attacker.energy = min(100, attacker.energy + (3 if blocked else 8))
    if not blocked:
        defender.stun = .7 if special and attacker.stats.get("element") == "ice" else .23 if special else .17
        defender.action = "hurt"
        attacker.combo += 1
        attacker.combo_time = 1.25
    events.append({"type": "block" if blocked else "hit", "x": defender.x, "y": defender.y - 155,
                   "color": attacker.stats["color"], "special": special, "combo": attacker.combo,
                   "damage": round(actual_damage, 2), "player": attacker.player,
                   "element": attacker.stats.get("element", "energy")})


def melee(attacker, defender, events):
    attack = ATTACKS.get(attacker.action)
    if not attack or attacker.action == "special" or attacker.hit_done:
        return
    if attack["active"] <= attacker.action_time <= attack["end"]:
        dx = (defender.x - attacker.x) * attacker.facing
        if 0 <= dx <= attack["reach"] and abs(attacker.y - defender.y) < 95:
            attacker.hit_done = True
            damage(attacker, defender, attack["damage"], attack["knock"], events)


def separate(a, b):
    if abs(a.y - b.y) < 130 and abs(a.x - b.x) < 74:
        direction = 1 if b.x >= a.x else -1
        overlap = (74 - abs(a.x - b.x)) / 2
        a.x = max(65, min(WIDTH - 65, a.x - overlap * direction))
        b.x = max(65, min(WIDTH - 65, b.x + overlap * direction))
