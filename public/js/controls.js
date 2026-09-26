const actions = [
  ["A", "KeyA", "Chapga yurish"],
  ["D", "KeyD", "O‘ngga yurish"],
  ["W", "KeyW", "Sakrash"],
  ["S", "KeyS", "Himoya"],
  ["J", "KeyJ", "Musht"],
  ["K", "KeyK", "Tepik"],
  ["L", "KeyL", "Maxsus zarba"],
];
const second = [
  ["←", "ArrowLeft", "Chapga yurish"],
  ["→", "ArrowRight", "O‘ngga yurish"],
  ["↑", "ArrowUp", "Sakrash"],
  ["↓", "ArrowDown", "Himoya"],
  ["1", "Digit1", "Musht"],
  ["2", "Digit2", "Tepik"],
  ["3", "Digit3", "Maxsus zarba"],
];
function row(keys, title) {
  return `<div class="control-player"><h3>${title}</h3><div class="control-keys">${keys.map(([key, code, label]) => `<div class="control-item" data-key-code="${code}"><kbd>${key}</kbd><span>${label}</span></div>`).join("")}</div></div>`;
}
export class Controls {
  constructor() {
    this.mode = "cpu";
    this.coarse =
      matchMedia("(pointer:coarse)").matches || navigator.maxTouchPoints > 0;
    window.addEventListener("keydown", (e) => {
      if (e.repeat || document.querySelector("dialog[open]")) return;
      document
        .querySelectorAll(`[data-key-code="${e.code}"]`)
        .forEach((el) => el.classList.add("active"));
      const action = actions.concat(second).find((a) => a[1] === e.code);
      if (action)
        document.querySelector("#move-feedback").textContent = action[2];
    });
    window.addEventListener("keyup", (e) =>
      document
        .querySelectorAll(`[data-key-code="${e.code}"]`)
        .forEach((el) => el.classList.remove("active")),
    );
    window.addEventListener("blur", () =>
      document
        .querySelectorAll(".control-item.active")
        .forEach((el) => el.classList.remove("active")),
    );
  }
  markup(mode) {
    return (
      row(
        actions,
        mode === "local" ? "1-O‘YINCHI · KLAVIATURA" : "SIZNING TUGMALARINGIZ",
      ) + (mode === "local" ? row(second, "2-O‘YINCHI · KLAVIATURA") : "")
    );
  }
  render(options) {
    this.mode = options.mode;
    document.querySelector("#visible-controls").innerHTML = this.markup(
      options.mode,
    );
    document.querySelector("#guide-controls").innerHTML = this.markup(
      options.mode,
    );
    document.querySelector("#guide-mobile").hidden = !this.coarse;
  }
  guide(options) {
    this.render(options);
    document.querySelector("#guide-dialog").showModal();
  }
}
