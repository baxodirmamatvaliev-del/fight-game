from config import ROUND_SECONDS, FIGHTERS, FLOOR
from fighter import Fighter
from combat import melee, separate
import projectiles


class Match:
    def __init__(self, p1="volt", p2="ember", mode="cpu", difficulty="normal"):
        self.kinds = [p1 if p1 in FIGHTERS else "volt", p2 if p2 in FIGHTERS else "ember"]
        self.mode = mode if mode in ("cpu", "local", "practice") else "cpu"
        self.completed = set()
        self.training_hits = 0
        self.difficulty = difficulty
        self.wins = [0, 0]
        self.round = 0
        self.events = []
        self.winner = None
        self.new_round()

    def new_round(self):
        self.round += 1
        self.fighters = [Fighter(kind, i) for i, kind in enumerate(self.kinds)]
        self.projectiles = []
        self.remaining = ROUND_SECONDS
        self.phase = "fight" if self.mode == "practice" else "countdown"
        self.phase_time = 2.5
        self.round_winner = None
        if self.mode == "practice":
            for fighter in self.fighters:
                fighter.energy = 100

    def tick(self, dt, inputs):
        dt = max(0, min(float(dt), 1 / 30))
        self.events = []
        if self.phase == "match_over":
            return
        if self.phase != "fight":
            self.phase_time -= dt
            if self.phase_time <= 0:
                if self.phase == "countdown":
                    self.phase = "fight"
                    self.events.append({"type": "fight"})
                elif max(self.wins) >= 2:
                    self.phase = "match_over"
                    self.winner = 0 if self.wins[0] >= 2 else 1
                    self.events.append({"type": "victory", "player": self.winner})
                else:
                    self.new_round()
            return
        if self.mode != "practice":
            self.remaining = max(0, self.remaining - dt)
        a, b = self.fighters
        if self.mode == "practice":
            inputs = [inputs[0], []]
            a.energy = 100
            if b.health <= 0:
                b.health = 100
                b.action = "idle"
                b.stun = 0
            else:
                b.health = min(100, b.health + dt * 18)
        for i, fighter in enumerate(self.fighters):
            fighter.update(dt, set(inputs[i]), self.fighters[1 - i])
        separate(a, b)
        for attacker, defender in ((a, b), (b, a)):
            melee(attacker, defender, self.events)
            projectiles.spawn(attacker, self.projectiles, self.events)
        projectiles.update(self.projectiles, self.fighters, dt, self.events)
        if self.mode == "practice":
            if a.x < 338:
                self.completed.add("left")
            if a.x > 362:
                self.completed.add("right")
            if a.y < FLOOR - 15:
                self.completed.add("jump")
            if a.action in ("block", "punch", "kick", "special"):
                self.completed.add(a.action)
            self.training_hits += sum(e["type"] == "hit" and e["player"] == 0 for e in self.events)
            return
        if min(a.health, b.health) <= 0 or self.remaining <= 0:
            if abs(a.health - b.health) > .001:
                self.round_winner = 0 if a.health > b.health else 1
                self.wins[self.round_winner] += 1
            self.phase = "round_over"
            self.phase_time = 2.8
            for f in self.fighters:
                if f.health <= 0:
                    f.action = "ko"
            self.events.append({"type": "ko", "player": self.round_winner})

    def snapshot(self):
        return {"fighters": [f.snapshot() for f in self.fighters], "projectiles": self.projectiles,
                "phase": self.phase, "phase_time": self.phase_time, "round": self.round,
                "remaining": self.remaining, "wins": self.wins, "winner": self.winner,
                "round_winner": self.round_winner, "events": self.events,
                "training": {"completed": sorted(self.completed), "hits": self.training_hits}
                if self.mode == "practice" else None}
