const lessons = [
  {
    id: "left",
    key: "A",
    label: "Chapga yuring",
    hint: "A tugmasini biroz ushlab turing. Telefonda ← tugmasini bosing.",
  },
  {
    id: "right",
    key: "D",
    label: "O‘ngga yuring",
    hint: "D tugmasini ushlab turing. Raqibga yaqinlashib ko‘ring.",
  },
  {
    id: "jump",
    key: "W",
    label: "Sakrang",
    hint: "W tugmasini bir marta bosing. Telefonda ↑ tugmasi sakratadi.",
  },
  {
    id: "block",
    key: "↓ / S",
    label: "Himoyalaning",
    hint: "Yerda turganingizda S yoki HIMOYA tugmasini ushlab turing.",
  },
  {
    id: "punch",
    key: "← / J",
    label: "Musht bilan uring",
    hint: "J yoki MUSHT tugmasini bosing. Har bir yangi zarba uchun qayta bosing.",
  },
  {
    id: "kick",
    key: "→ / K",
    label: "Tepik bering",
    hint: "K yoki TEPIK tugmasini bosing. Tepik mushtdan uzoqroqqa yetadi.",
  },
  {
    id: "special",
    key: "↑ / L",
    label: "Maxsus zarbani sinang",
    hint: "L yoki MAXSUS tugmasini bosing. Mashqda energiya cheklanmagan; jangda 35 energiya kerak.",
  },
];
export class Training {
  constructor() {
    this.panel = document.querySelector("#training-panel");
    this.last = "";
  }
  update(state) {
    const training = state?.training;
    this.panel.hidden = !training;
    document.querySelector("#training-cue").hidden = !training;
    if (!training) {
      this.last = "";
      return;
    }
    const completed = new Set(training.completed),
      next = lessons.find((l) => !completed.has(l.id));
    const signature = training.completed.join(",") + ":" + training.hits;
    if (signature === this.last) return;
    this.last = signature;
    document.querySelector("#training-progress").textContent =
      `${completed.size} / 7 HARAKAT · ${training.hits} ZARBA TEGDI`;
    document.querySelector("#training-goal").textContent = next
      ? `${next.key} — ${next.label}`
      : "BARCHA HARAKATLAR BAJARILDI";
    document.querySelector("#training-cue-goal").textContent = next
      ? `${next.key} — ${next.label}`
      : "7 / 7 — TAYYORSIZ!";
    document.querySelector("#training-hint").textContent = next
      ? next.hint
      : "Tayyor! Raqib ustida mashqni davom ettiring yoki kompyuterga qarshi jangga o‘ting.";
    document.querySelector("#training-checklist").innerHTML = lessons
      .map(
        (l) =>
          `<span class="training-step ${completed.has(l.id) ? "done" : ""}">${completed.has(l.id) ? "✓" : "○"} ${l.label}</span>`,
      )
      .join("");
    document.querySelector("#training-fight").classList.toggle("ready", !next);
  }
}
