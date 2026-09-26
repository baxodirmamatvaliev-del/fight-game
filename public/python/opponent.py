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
        self.wait = self.rules["reaction"] * self.rng.uniform(.7, 1.3)
        distance = abs(target.x - fighter.x)
        toward = "right" if target.x > fighter.x else "left"
        self.keys = []
        threat = target.action in ("punch", "kick") and distance < 160
        threat |= any(b["owner"] != fighter.player and abs(b["x"] - fighter.x) < 250 for b in bolts)
        if threat and self.rng.random() < self.rules["aggression"]:
            self.keys = ["block"]
        elif distance > 125:
            self.keys = [toward]
            if fighter.energy >= 35 and self.rng.random() < .3:
                self.keys.append("special")
            elif self.rng.random() < .13:
                self.keys.append("jump")
        elif self.rng.random() < self.rules["aggression"]:
            self.keys = [self.rng.choice(["punch", "kick", "kick"])]
        return self.keys
