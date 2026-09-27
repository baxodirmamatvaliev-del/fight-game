export function setupTouch(input) {
  const active = new Map();
  const stick = document.querySelector("#move-stick");
  const stickKeys = new Set();
  let stickPointer = null;
  window.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType === "touch") {
        document.documentElement.classList.add("touch-device");
        if (input.enabled) document.querySelector("#touch-controls").hidden = false;
      }
    },
    { passive: true },
  );
  function sync() {
    input.touch.clear();
    if (input.enabled) active.forEach((action) => input.touch.add(action));
    if (input.enabled) stickKeys.forEach((action) => input.touch.add(action));
  }
  function moveStick(event) {
    const rect = stick.getBoundingClientRect();
    let x = event.clientX - rect.left - rect.width / 2;
    let y = event.clientY - rect.top - rect.height / 2;
    const radius = rect.width * 0.3,
      length = Math.hypot(x, y);
    if (length > radius) {
      x *= radius / length;
      y *= radius / length;
    }
    stick.style.setProperty("--stick-x", `${x}px`);
    stick.style.setProperty("--stick-y", `${y}px`);
    stickKeys.clear();
    if (x < -radius * 0.25) stickKeys.add("left");
    if (x > radius * 0.25) stickKeys.add("right");
    if (y < -radius * 0.65) stickKeys.add("jump");
    sync();
  }
  function releaseStick(event) {
    if (event && event.pointerId !== stickPointer) return;
    stickPointer = null;
    stickKeys.clear();
    stick.style.setProperty("--stick-x", "0px");
    stick.style.setProperty("--stick-y", "0px");
    stick.classList.remove("pressed");
    sync();
  }
  stick.addEventListener("pointerdown", (event) => {
    if (!input.enabled || stickPointer !== null) return;
    event.preventDefault();
    stickPointer = event.pointerId;
    stick.setPointerCapture(event.pointerId);
    stick.classList.add("pressed");
    moveStick(event);
  });
  stick.addEventListener("pointermove", (event) => {
    if (event.pointerId === stickPointer) {
      event.preventDefault();
      moveStick(event);
    }
  });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
    stick.addEventListener(name, releaseStick);
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      if (!input.enabled) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      active.set(event.pointerId, button.dataset.action);
      input.pending[0].add(button.dataset.action);
      button.classList.add("pressed");
      sync();
    });
    const release = (event) => {
      active.delete(event.pointerId);
      if (![...active.values()].includes(button.dataset.action))
        button.classList.remove("pressed");
      sync();
    };
    for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
      button.addEventListener(name, release);
    button.addEventListener("contextmenu", (event) => event.preventDefault());
  });
  function reset() {
    active.clear();
    releaseStick();
    sync();
    document
      .querySelectorAll("[data-action]")
      .forEach((b) => b.classList.remove("pressed"));
  }
  window.addEventListener("blur", reset);
  window.addEventListener("combat-input-reset", reset);
}
