from config import ATTACKS, WIDTH
from combat import damage


def spawn(fighter, projectiles, events):
    if fighter.action == "special" and not fighter.hit_done and fighter.action_time >= ATTACKS["special"]["active"]:
        fighter.hit_done = True
        projectiles.append({"x": fighter.x + fighter.facing * 70, "y": fighter.y - 100,
                            "direction": fighter.facing, "owner": fighter.player, "color": fighter.stats["color"]})
        events.append({"type": "special", "x": fighter.x, "y": fighter.y - 100, "color": fighter.stats["color"]})


def update(projectiles, fighters, dt, events):
    alive = []
    for bolt in projectiles:
        previous_x = bolt["x"]
        bolt["x"] += bolt["direction"] * 740 * dt
        defender = fighters[1 - bolt["owner"]]
        lo, hi = sorted((previous_x, bolt["x"]))
        if lo - 35 <= defender.x <= hi + 35 and defender.y - 170 <= bolt["y"] <= defender.y - 20:
            damage(fighters[bolt["owner"]], defender, 18, 65, events, special=True)
        elif -60 <= bolt["x"] <= WIDTH + 60:
            alive.append(bolt)
    projectiles[:] = alive
