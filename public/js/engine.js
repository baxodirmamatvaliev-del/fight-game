const modules = [
  "config",
  "fighter",
  "combat",
  "projectiles",
  "match",
  "opponent",
  "bridge",
];
export class PythonEngine {
  async load(onProgress) {
    onProgress("Python dvigateli yuklanmoqda…");
    const sources = await Promise.all(
      modules.map(async (name) => {
        const response = await fetch(
          new URL(`../python/${name}.py`, import.meta.url),
        );
        if (!response.ok)
          throw new Error(`Python module ${name}: ${response.status}`);
        return [name, await response.text()];
      }),
    );
    for (let i = 0; !globalThis.loadPyodide && i < 200; i++)
      await new Promise((r) => setTimeout(r, 50));
    if (!globalThis.loadPyodide) throw new Error("Python runtime did not load");
    this.runtime = await globalThis.loadPyodide({
      indexURL: new URL("../vendor/pyodide/", import.meta.url).href,
    });
    onProgress("Jang tizimi ishga tushmoqda…");
    this.runtime.FS.mkdirTree("/game");
    for (const [name, source] of sources)
      this.runtime.FS.writeFile(`/game/${name}.py`, source);
    this.runtime.runPython(
      "import sys\nsys.path.insert(0, '/game')\nfrom bridge import start_game, tick_game",
    );
    this.startFn = this.runtime.globals.get("start_game");
    this.tickFn = this.runtime.globals.get("tick_game");
    return this;
  }
  start(options) {
    return JSON.parse(this.startFn(JSON.stringify(options)));
  }
  tick(dt, inputs) {
    return JSON.parse(this.tickFn(dt, JSON.stringify(inputs)));
  }
}
