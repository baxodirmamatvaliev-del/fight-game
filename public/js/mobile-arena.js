// Browser orientation locking is optional; manual rotation always works.
export class MobileArena {
  constructor(onBlocked) {
    this.onBlocked = onBlocked;
    this.active = false;
    this.blocked = false;
    this.coarse = matchMedia("(pointer: coarse)");
    this.portrait = matchMedia("(orientation: portrait)");
    this.overlay = document.querySelector("#rotate-prompt");
    document.querySelector("#arena").append(this.overlay);
    this.coarse.addEventListener("change", () => this.refresh());
    this.portrait.addEventListener("change", () => this.refresh());
    window.addEventListener("resize", () => this.refresh());
  }
  setActive(active) {
    this.active = active;
    this.refresh();
    if (!active) {
      if (document.fullscreenElement === document.querySelector("#arena"))
        document.exitFullscreen().catch(() => {});
      try {
        screen.orientation?.unlock?.();
      } catch {}
    }
  }
  refresh() {
    const mobile = this.active && (this.coarse.matches || navigator.maxTouchPoints > 0);
    const blocked = mobile && this.portrait.matches;
    document.body.classList.toggle("mobile-battle", mobile);
    this.overlay.hidden = !blocked;
    if (this.blocked !== blocked) {
      this.blocked = blocked;
      this.onBlocked(blocked);
    }
  }
  async lockLandscape() {
    try {
      if (
        !document.fullscreenElement &&
        document.querySelector("#arena").requestFullscreen
      )
        await document.querySelector("#arena").requestFullscreen();
      if (screen.orientation?.lock) await screen.orientation.lock("landscape");
    } catch {
      // In-app browsers and Safari may require the user to rotate manually.
    }
  }
}
