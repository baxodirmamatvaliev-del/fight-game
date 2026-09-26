import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "public/python"))
from fighter import Fighter
from match import Match
from combat import melee
import projectiles
import bridge
from opponent import Opponent
from config import FLOOR


class GameplayTests(unittest.TestCase):
    def pair(self):
        return Fighter("volt", 0), Fighter("ember", 1)

    def test_movement_and_arena_bounds(self):
        a, b = self.pair()
        for _ in range(600):
            a.update(1/60, {"left"}, b)
        self.assertEqual(a.x, 65)
        for _ in range(600):
            a.update(1/60, {"right"}, b)
        self.assertEqual(a.x, 1135)

    def test_jump_returns_to_floor(self):
        a, b = self.pair()
        a.update(1/60, {"jump"}, b)
        self.assertLess(a.y, FLOOR)
        for _ in range(100):
            a.update(1/60, set(), b)
        self.assertEqual(a.y, FLOOR)
        self.assertEqual(a.vy, 0)

    def test_melee_hits_once_and_builds_combo(self):
        a, b = self.pair()
        b.x = a.x + 90
        a.action = "punch"
        a.action_time = .15
        events = []
        melee(a, b, events)
        self.assertEqual(b.health, 93)
        melee(a, b, events)
        self.assertEqual(b.health, 93)
        self.assertEqual(a.combo, 1)
        self.assertEqual(len(events), 1)

    def test_block_reduces_front_damage(self):
        a, b = self.pair()
        b.x = a.x + 85
        b.action = "block"
        a.action = "punch"
        a.action_time = .15
        events = []
        melee(a, b, events)
        self.assertAlmostEqual(b.health, 99.16)
        self.assertEqual(events[0]["type"], "block")
        self.assertEqual(b.stun, 0)

    def test_block_does_not_protect_back(self):
        a, b = self.pair()
        b.x = a.x + 85
        b.action = "block"
        b.facing = 1
        a.action = "punch"
        a.action_time = .15
        melee(a, b, [])
        self.assertEqual(b.health, 93)

    def test_airborne_target_can_evade(self):
        a, b = self.pair()
        b.x = a.x + 85
        b.y -= 180
        a.action = "kick"
        a.action_time = .23
        melee(a, b, [])
        self.assertEqual(b.health, 100)

    def test_special_requires_energy_and_only_spawns_once(self):
        a, b = self.pair()
        a.energy = 20
        a.update(1/60, {"special"}, b)
        self.assertNotEqual(a.action, "special")
        a.update(1/60, set(), b)
        a.energy = 35
        a.update(1/60, {"special"}, b)
        self.assertEqual(a.action, "special")
        self.assertLess(a.energy, 1)
        a.action_time = .25
        bolts = []
        projectiles.spawn(a, bolts, [])
        projectiles.spawn(a, bolts, [])
        self.assertEqual(len(bolts), 1)

    def test_projectile_hit_and_removal(self):
        a, b = self.pair()
        bolts = [{"x": b.x - 40, "y": b.y - 100, "direction": 1, "owner": 0, "color": "#fff"}]
        events = []
        projectiles.update(bolts, [a, b], 1/30, events)
        self.assertEqual(b.health, 82)
        self.assertFalse(bolts)
        self.assertTrue(events[0]["special"])

    def test_attack_requires_a_new_press(self):
        a, b = self.pair()
        for _ in range(100):
            a.update(1/60, {"punch"}, b)
        self.assertNotEqual(a.action, "punch")
        a.update(1/60, set(), b)
        a.update(1/60, {"punch"}, b)
        self.assertEqual(a.action, "punch")

    def test_countdown_freezes_round_timer(self):
        match = Match()
        for _ in range(60):
            match.tick(1/60, [[], []])
        self.assertEqual(match.remaining, 60)
        self.assertEqual(match.phase, "countdown")

    def test_best_of_three_and_rematch_round_reset(self):
        match = Match()
        for n in range(2):
            match.phase = "fight"
            match.fighters[1].health = 0
            match.tick(1/60, [[], []])
            self.assertEqual(match.wins[0], n + 1)
            for _ in range(180):
                match.tick(1/60, [[], []])
        self.assertEqual(match.phase, "match_over")
        self.assertEqual(match.winner, 0)

    def test_timeout_and_draw_do_not_award_wrong_winner(self):
        match = Match()
        match.phase = "fight"
        match.remaining = 0
        match.tick(1/60, [[], []])
        self.assertEqual(match.wins, [0, 0])
        self.assertIsNone(match.round_winner)

    def test_delta_is_clamped(self):
        match = Match()
        match.phase = "fight"
        match.tick(100, [[], []])
        self.assertGreater(match.remaining, 59.9)

    def test_bridge_uses_python_and_valid_json(self):
        state = json.loads(bridge.start_game(json.dumps({"p1":"ghost","mode":"local"})))
        self.assertEqual(state["fighters"][0]["kind"], "ghost")
        state = json.loads(bridge.tick_game(1/60, "[[], []]"))
        self.assertEqual(state["phase"], "countdown")

    def test_cpu_can_complete_a_match(self):
        match = Match()
        cpus = [Opponent("hard", 1), Opponent("hard", 2)]
        for _ in range(60 * 240):
            commands = [cpus[i].choose(1/60, match.fighters[i], match.fighters[1-i], match.projectiles) for i in range(2)]
            match.tick(1/60, commands)
            if match.phase == "match_over":
                break
        self.assertEqual(match.phase, "match_over")
        self.assertIn(match.winner, (0, 1))


if __name__ == "__main__":
    unittest.main()
