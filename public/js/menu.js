import { fighters, drawPortrait } from "./fighters.js";
const $ = (selector) => document.querySelector(selector);
export function setupMenu({
  options,
  prefs,
  onChange,
  onSelect,
  onSettings,
  onDialog,
}) {
  const container = $("#fighter-options");
  $("#opponent").innerHTML = Object.entries(fighters)
    .map(([kind, f]) => `<option value="${kind}">${f.name}</option>`)
    .join("");
  for (const [kind, f] of Object.entries(fighters)) {
    const button = document.createElement("button");
    button.className = "fighter-card";
    button.dataset.fighter = kind;
    button.setAttribute("aria-label", `${f.name}: ${f.title}`);
    button.innerHTML = `<canvas aria-hidden="true"></canvas><span class="chosen"></span><span class="fighter-label"><strong>${f.name}</strong><small>${f.title}</small></span>`;
    container.append(button);
    drawPortrait(button.querySelector("canvas"), kind);
    button.addEventListener("click", () => {
      options.p1 = kind;
      render();
      onChange();
      onSelect();
    });
    window.addEventListener("fighter-art-ready", (event) => {
      if (event.detail === kind) drawPortrait(button.querySelector("canvas"), kind);
    });
  }
  function render() {
    const selected = fighters[options.p1];
    $("#selected-fighter-name").textContent = selected.name;
    $("#selected-fighter-detail").textContent =
      `${selected.title} · ${selected.special || "Energiya zarbasi"}`;
    $("#selection-speed").value = selected.speed;
    $("#selection-power").value = selected.power;
    drawPortrait($("#selected-portrait"), options.p1);
    for (const button of container.children) {
      const chosen = button.dataset.fighter === options.p1;
      button.classList.toggle("selected", chosen);
      button.setAttribute("aria-pressed", String(chosen));
      button.querySelector(".chosen").textContent = chosen ? "✓" : "";
    }
    document.querySelectorAll("[data-mode]").forEach((button) => {
      const chosen = button.dataset.mode === options.mode;
      button.classList.toggle("selected", chosen);
      button.setAttribute("aria-pressed", String(chosen));
    });
    document.querySelectorAll("[data-arena]").forEach((button) => {
      const chosen = button.dataset.arena === options.arena;
      button.classList.toggle("selected", chosen);
      button.setAttribute("aria-pressed", String(chosen));
    });
    $("#difficulty").disabled = options.mode !== "cpu";
    $("#difficulty").value = options.difficulty;
    $("#opponent").value = options.p2;
  }
  document.querySelectorAll("[data-mode]").forEach((button) =>
    button.addEventListener("click", () => {
      options.mode = button.dataset.mode;
      render();
      onChange();
      onSelect();
    }),
  );
  document.querySelectorAll("[data-arena]").forEach((button) =>
    button.addEventListener("click", () => {
      options.arena = button.dataset.arena;
      render();
      onChange();
      onSelect();
    }),
  );
  $("#difficulty").addEventListener("change", (event) => {
    options.difficulty = event.target.value;
    onChange();
  });
  $("#opponent").addEventListener("change", (event) => {
    options.p2 = event.target.value;
    render();
    onChange();
  });
  $("#volume").value = Math.round(prefs.volume * 100);
  $("#music").checked = prefs.music;
  $("#effects").checked = prefs.effects;
  $("#volume").addEventListener("input", onSettings);
  $("#music").addEventListener("change", onSettings);
  $("#effects").addEventListener("change", onSettings);
  for (const [id, dialogId] of [
    ["help-button", "help-dialog"],
    ["controls-button", "help-dialog"],
    ["settings-button", "settings-dialog"],
  ])
    $("#" + id).addEventListener("click", () => {
      onDialog();
      $("#" + dialogId).showModal();
    });
  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog
      .querySelector(".close-dialog")
      .addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      )
        dialog.close();
    });
  });
  render();
  window.addEventListener("fighter-art-ready", () =>
    drawPortrait($("#selected-portrait"), options.p1),
  );
  onChange();
}
