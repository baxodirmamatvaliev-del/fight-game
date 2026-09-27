// Presentation-only interpolation: collision and damage stay at fixed 60 Hz.
export function interpolateFighters(previous, current, alpha) {
  return current.map((fighter, index) => {
    const old = previous?.[index];
    if (!old || Math.abs(old.x - fighter.x) > 120 || old.kind !== fighter.kind)
      return fighter;
    return {
      ...fighter,
      x: old.x + (fighter.x - old.x) * alpha,
      y: old.y + (fighter.y - old.y) * alpha,
    };
  });
}
export const ease = (value) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};
