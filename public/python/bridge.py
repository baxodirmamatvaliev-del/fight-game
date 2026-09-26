"""Small JSON boundary: Python owns all gameplay, JS owns presentation."""
import json
from match import Match
from opponent import Opponent

current = None
cpu = None


def start_game(options_json):
    global current, cpu
    options = json.loads(options_json)
    current = Match(options.get("p1", "volt"), options.get("p2", "ember"),
                    options.get("mode", "cpu"), options.get("difficulty", "normal"))
    cpu = Opponent(current.difficulty)
    return json.dumps(current.snapshot())


def tick_game(dt, inputs_json):
    inputs = json.loads(inputs_json)
    if current.mode == "cpu" and current.phase == "fight":
        inputs[1] = cpu.choose(dt, current.fighters[1], current.fighters[0], current.projectiles)
    current.tick(dt, inputs)
    return json.dumps(current.snapshot())
