// TODO(ART): replace placeholder palette portraits and sprite sheets with original art.
// This prototype roster shares the core moveset; names below label its specials.
export const roster = [
  {
    id: "ember",
    name: "EMBER",
    title: "The exiled flame",
    color: "#ee9763",
    special: "Cinder Strike",
    super: "Inferno",
    lore: "From the ashes, a challenger rises.",
  },
  {
    id: "frost",
    name: "FROST",
    title: "The silent winter",
    color: "#8cd5e9",
    special: "Glacial Strike",
    super: "Deep Freeze",
    lore: "Every breath brings the silence closer.",
  },
  {
    id: "wraith",
    name: "WRAITH",
    title: "Beyond the veil",
    color: "#b1a0e6",
    special: "Shadow Strike",
    super: "Nightfall",
    lore: "A forgotten name. An unfinished battle.",
  },
  {
    id: "jade",
    name: "VERDANT",
    title: "Keeper of the wild",
    color: "#93c49c",
    special: "Thorn Strike",
    super: "Overgrowth",
    lore: "The roots remember every trespass.",
  },
  {
    id: "volt",
    name: "VOLT",
    title: "Voice of the storm",
    color: "#e6c774",
    special: "Thunder Strike",
    super: "Tempest",
    lore: "The calm ends when the gates open.",
  },
  {
    id: "iron",
    name: "IRON",
    title: "The unbroken oath",
    color: "#a9b2bc",
    special: "Steel Strike",
    super: "Judgment",
    lore: "No crown. No mercy. Only the oath.",
  },
] as const;
export type Mode = "arcade" | "versus" | "training";
