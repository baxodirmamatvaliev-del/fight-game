from config import ATTACKS, FIGHTERS, FLOOR, GRAVITY, WIDTH


class Fighter:
    def __init__(self, kind, player):
        self.kind = kind
        self.player = player
        self.stats = FIGHTERS[kind]
        self.x = 350 if player == 0 else 850
        self.y = FLOOR
        self.vy = 0
        self.facing = 1 if player == 0 else -1
        self.health = 100
        self.energy = 35
        self.action = "idle"
        self.action_time = 0
        self.stun = 0
        self.hit_done = False
        self.combo = 0
        self.combo_time = 0
        self.previous = set()

    def update(self, dt, keys, opponent):
        pressed = keys - self.previous
        self.previous = set(keys)
        self.energy = min(100, self.energy + dt * 4)
        self.stun = max(0, self.stun - dt)
        self.combo_time = max(0, self.combo_time - dt)
        if not self.combo_time:
            self.combo = 0
        if self.action in ATTACKS:
            self.action_time += dt
            if self.action_time >= ATTACKS[self.action]["duration"]:
                self.action = "idle"
        else:
            self.facing = 1 if opponent.x >= self.x else -1
        grounded = self.y >= FLOOR
        if self.health <= 0:
            self.action = "ko"
        elif self.stun:
            self.action = "hurt"
        elif self.action not in ATTACKS:
            self.action = "block" if "block" in keys and grounded else "idle"
            if self.action != "block":
                direction = int("right" in keys) - int("left" in keys)
                self.x += direction * self.stats["speed"] * dt
                if direction:
                    self.action = "walk"
                if "jump" in pressed and grounded:
                    self.vy = -780
                for action in ("special", "kick", "punch"):
                    if action in pressed and (action != "special" or self.energy >= 35):
                        self.action = action
                        self.action_time = 0
                        self.hit_done = False
                        if action == "special":
                            self.energy -= 35
                        break
        self.vy += GRAVITY * dt
        self.y = min(FLOOR, self.y + self.vy * dt)
        if self.y >= FLOOR:
            self.vy = 0
        self.x = max(65, min(WIDTH - 65, self.x))

    def snapshot(self):
        return {key: getattr(self, key) for key in ("kind", "player", "x", "y", "facing", "health", "energy", "action", "action_time", "combo", "stun")}
