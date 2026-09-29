import random
from config import DIFFICULTIES


class Opponent:
    def __init__(self, difficulty="normal", seed=None):
        self.rules = DIFFICULTIES.get(difficulty, DIFFICULTIES["normal"])
        self.rng = random.Random(seed)
        self.wait = 0
        self.keys = []

    def choose(self, dt, fighter, target, bolts):
        self.wait -= dt
        if self.wait > 0:
            return self.keys
        self.wait = self.rules["reaction"] * self.rng.uniform(0.7, 1.3)
        distance = abs(target.x - fighter.x)
        toward = "right" if target.x > fighter.x else "left"
        self.keys = []
        threat = (
            target.action in ("punch", "kick", "xpower", "finisher") and distance < 190
        )
        threat |= any(
            b["owner"] != fighter.player and abs(b["x"] - fighter.x) < 250
            for b in bolts
        )
        if threat and self.rng.random() < self.rules["aggression"]:
            self.keys = ["block"]
        elif distance <= 185 and target.health <= 20 and fighter.energy >= 50:
            self.keys = ["finisher"]
        elif (
            distance <= 175
            and fighter.energy >= 100
            and self.rng.random() < self.rules["aggression"]
        ):
            self.keys = ["xpower"]
        elif distance > 125:
            self.keys = [toward]
            if fighter.energy >= 35 and self.rng.random() < 0.3:
                self.keys.append("special")
            elif self.rng.random() < 0.13:
                self.keys.append("jump")
        elif self.rng.random() < self.rules["aggression"]:
            self.keys = [self.rng.choice(["punch", "kick", "kick"])]
        return self.keys
