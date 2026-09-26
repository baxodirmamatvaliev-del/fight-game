import { fighters } from "./fighters.js";
const $ = (s) => document.querySelector(s);
export class Screens {
  constructor(callbacks) {
    this.callbacks = callbacks;
    $("#pause-button").addEventListener("click", callbacks.pause);
    $("#resume-button").addEventListener("click", callbacks.pause);
    $("#quit-button").addEventListener("click", callbacks.menu);
    $("#menu-button").addEventListener("click", callbacks.menu);
    $("#rematch-button").addEventListener("click", callbacks.start);
  }
  start() {
    this.hideOverlays();
    $("#lobby").hidden = true;
    $("#pause-button").hidden = false;
    $("#touch-controls").hidden = !(
      matchMedia("(pointer:coarse)").matches ||
      navigator.maxTouchPoints > 0 ||
      document.documentElement.classList.contains("touch-device")
    );
    document
      .querySelectorAll(".arena-corner")
      .forEach((el) => (el.hidden = true));
  }
  hideOverlays() {
    $("#pause-screen").hidden = true;
    $("#result-screen").hidden = true;
  }
  pause(value) {
    $("#pause-screen").hidden = !value;
    if (value) $("#resume-button").focus({ preventScroll: true });
  }
  menu() {
    this.hideOverlays();
    $("#lobby").hidden = false;
    $("#pause-button").hidden = true;
    $("#touch-controls").hidden = true;
    document
      .querySelectorAll(".arena-corner")
      .forEach((el) => (el.hidden = false));
  }
  result(state, options) {
    const winner = fighters[state.fighters[state.winner].kind];
    $("#result-screen").hidden = false;
    $("#pause-button").hidden = true;
    $("#touch-controls").hidden = true;
    $("#result-kicker").textContent =
      state.winner === 0
        ? "THE NIGHT IS YOURS"
        : "ANOTHER FIGHT. ANOTHER CHANCE.";
    $("#result-title").textContent =
      options.mode === "local"
        ? winner.name + " YUTDI!"
        : state.winner === 0
          ? "G‘ALABA!"
          : "MAG‘LUBIYAT";
    $("#result-detail").textContent =
      `${winner.name} · ${state.wins[0]} : ${state.wins[1]} · ${state.round} raund`;
    $("#rematch-button").focus({ preventScroll: true });
  }
}
