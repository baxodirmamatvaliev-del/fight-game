export type AttackName = "punch" | "kick" | "special" | "super";
export interface AttackData {
  startup: number;
  active: number;
  recovery: number;
  damage: number;
  reach: number;
  height: number;
  offsetY: number;
  knockback: number;
  stun: number;
  hitstop: number;
  knockdown?: boolean;
}
export const config = {
  width: 960,
  height: 540,
  floor: 430,
  fps: 60,
  roundFrames: 60 * 60,
  fighter: {
    width: 48,
    height: 112,
    crouchHeight: 66,
    speed: 240,
    jump: 660,
    gravity: 1800,
    health: 100,
  },
  attacks: {
    special: {
      startup: 10,
      active: 5,
      recovery: 24,
      damage: 18,
      reach: 130,
      height: 60,
      offsetY: 85,
      knockback: 400,
      stun: 32,
      hitstop: 10,
      knockdown: true,
    },
    super: {
      startup: 15,
      active: 8,
      recovery: 35,
      damage: 32,
      reach: 180,
      height: 100,
      offsetY: 110,
      knockback: 520,
      stun: 40,
      hitstop: 14,
      knockdown: true,
    },
    punch: {
      startup: 6,
      active: 3,
      recovery: 12,
      damage: 8,
      reach: 58,
      height: 28,
      offsetY: 100,
      knockback: 210,
      stun: 18,
      hitstop: 6,
    },
    kick: {
      startup: 12,
      active: 4,
      recovery: 20,
      damage: 14,
      reach: 88,
      height: 32,
      offsetY: 48,
      knockback: 350,
      stun: 26,
      hitstop: 9,
    },
  } as Record<AttackName, AttackData>,
};
