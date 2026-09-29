const actions = [
  ["A", "KeyA", "Chapga yurish"],
  ["D", "KeyD", "O‘ngga yurish"],
  ["W", "KeyW", "Sakrash"],
  ["↓", "ArrowDown", "Himoya · S ham"],
  ["←", "ArrowLeft", "Musht · J ham"],
  ["→", "ArrowRight", "Tepik · K ham"],
  ["↑", "ArrowUp", "Maxsus · L ham"],
  ["X", "KeyX", "X-kuch · 100 energiya"],
  ["V", "KeyV", "Yakun · 50 energiya, raqib ≤20 HP, yaqin"],
];
const second = [
  ["Num 4", "Numpad4", "Chapga yurish"],
  ["Num 6", "Numpad6", "O‘ngga yurish"],
  ["Num 8", "Numpad8", "Sakrash"],
  ["Num 5", "Numpad5", "Himoya"],
  ["1", "Digit1", "Musht"],
  ["2", "Digit2", "Tepik"],
  ["3", "Digit3", "Maxsus zarba"],
  ["4", "Digit4", "X-kuch · 100 energiya"],
  ["5", "Digit5", "Yakunlovchi zarba"],
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
      if (action) document.querySelector("#move-feedback").textContent = action[2];
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
    const practicing = options.mode === "practice";
    document.querySelector("#controls-tip").innerHTML = practicing
      ? "<strong>Mashq:</strong> vaqt cheklanmagan, energiya tiklanadi, raqib hujum qilmaydi. Har bir zarba uchun tugmani qayta bosing. <strong>P / Esc:</strong> pauza."
      : "<strong>G‘alaba:</strong> 2 raund yuting. <strong>Maxsus zarba:</strong> kamida 35 energiya. Har bir zarba uchun tugmani qayta bosing. <strong>P / Esc:</strong> pauza.";
    document.querySelector("#guide-rules").innerHTML = practicing
      ? "<span><b>VAQT CHEKLANMAGAN</b> shoshilmasdan o‘rganing</span><span><b>ENERGIYA TIKLANADI</b> maxsus zarbani sinang</span><span><b>RAQIB HUJUM QILMAYDI</b> xavfsiz mashq qiling</span>"
      : "<span><b>2 RAUND</b> yutgan jangchi g‘olib</span><span><b>35 ENERGIYA</b> maxsus zarba uchun</span><span><b>P / ESC</b> pauza qilish uchun</span>";
    document.querySelector("#guide-start").innerHTML =
      options.mode === "practice"
        ? "MASHQNI BOSHLASH <span>→</span>"
        : "TUSHUNDIM — JANGGA KIRISH <span>→</span>";
    document.querySelector("#guide-practice").hidden = options.mode === "practice";
    this.mode = options.mode;
    document.querySelector("#visible-controls").innerHTML = this.markup(options.mode);
    document.querySelector("#arena-controls").innerHTML = this.markup(options.mode);
    document.querySelector("#guide-controls").innerHTML = this.markup(options.mode);
    document.querySelector("#guide-mobile").hidden = !this.coarse;
  }
  guide(options) {
    this.render(options);
    document.querySelector("#guide-dialog").showModal();
  }
}
