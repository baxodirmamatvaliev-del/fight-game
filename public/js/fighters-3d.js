import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { fightingPose } from "./rig.js";

const colors = {
  subzero: 0x438ac9,
  scorpion: 0xd4a12b,
  volt: 0x959378,
  ember: 0xa23927,
  ghost: 0x797995,
};
const v = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
function aim(bone, child, target) {
  const from = bone.getWorldPosition(v());
  const current = child.getWorldPosition(v()).sub(from).normalize();
  const desired = target.clone().sub(from).normalize();
  const delta = new T.Quaternion().setFromUnitVectors(current, desired);
  const rotation = delta.multiply(bone.getWorldQuaternion(new T.Quaternion()));
  bone.quaternion.copy(
    bone.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(rotation),
  );
  bone.updateWorldMatrix(false, true);
}
function solve(upper, lower, end, target, pole) {
  if (!upper || !lower || !end) return;
  const origin = upper.getWorldPosition(v()),
    mid = lower.getWorldPosition(v()),
    tip = end.getWorldPosition(v());
  const a = origin.distanceTo(mid),
    b = mid.distanceTo(tip);
  const direction = target.clone().sub(origin),
    d = Math.max(0.1, Math.min(a + b - 0.01, direction.length()));
  direction.normalize();
  const side = pole.clone().sub(origin);
  side.addScaledVector(direction, -side.dot(direction)).normalize();
  const projection = (a * a - b * b + d * d) / (2 * d),
    height = Math.sqrt(Math.max(0, a * a - projection * projection));
  const knee = origin
    .clone()
    .addScaledVector(direction, projection)
    .addScaledVector(side, height);
  aim(upper, lower, knee);
  aim(lower, end, origin.clone().addScaledVector(direction, d));
}
export class Fighters3D {
  constructor() {
    this.ready = false;
    this.actors = [];
    this.time = 0;
    this.error = null;
  }
  async load() {
    try {
      this.renderer = new T.WebGLRenderer({
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
      });
      this.renderer.setSize(1200, 640, false);
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.outputColorSpace = T.SRGBColorSpace;
      this.renderer.toneMapping = T.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.3;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = T.PCFSoftShadowMap;
      this.scene = new T.Scene();
      this.camera = new T.OrthographicCamera(-600, 600, 320, -320, 1, 2500);
      this.camera.position.set(0, 215, 1000);
      this.camera.lookAt(0, 215, 0);
      this.scene.add(new T.HemisphereLight(0xdceeff, 0x352922, 2.5));
      const key = new T.DirectionalLight(0xffe4c3, 3.2);
      key.position.set(-250, 500, 450);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      Object.assign(key.shadow.camera, {
        left: -650,
        right: 650,
        top: 450,
        bottom: -450,
        far: 1500,
      });
      key.shadow.bias = -0.0002;
      this.scene.add(key);
      const rim = new T.DirectionalLight(0x7baaff, 3);
      rim.position.set(180, 280, -350);
      this.scene.add(rim);
      const ground = new T.Mesh(
        new T.PlaneGeometry(2000, 1400),
        new T.ShadowMaterial({ opacity: 0.35 }),
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      this.scene.add(ground);
      const gltf = await new GLTFLoader().loadAsync(
        new URL("../assets/models/fighter.glb", import.meta.url).href,
      );
      this.template = gltf.scene;
      this.clips = gltf.animations;
      this.ready = true;
    } catch (error) {
      this.error = error.message;
      console.warn("3D renderer unavailable", error);
    }
    return this;
  }
  actor(kind, index) {
    const old = this.actors[index];
    if (old?.kind === kind) return old;
    if (old) {
      this.scene.remove(old.root);
      old.mixer.stopAllAction();
      old.model.traverse((n) => {
        if (n.isMesh) n.material.dispose();
      });
    }
    const model = clone(this.template),
      root = new T.Group();
    root.rotation.order = "YXZ";
    // The embedded asset is 1.8322 metres tall (glTF POSITION bounds).
    // An unrendered SkinnedMesh bounding box contains uninitialised bone matrices;
    // using it here magnifies the model thousands of times.
    model.scale.setScalar(282 / 1.8322);
    model.rotation.y = Math.PI; // Asset faces -Z; combat faces local +Z.
    root.add(model);
    this.scene.add(root);
    const bones = {};
    model.traverse((node) => {
      if (node.isBone)
        bones[node.name.replace("mixamorig:", "").replace("mixamorig", "")] = node;
      if (node.isMesh) {
        node.frustumCulled = false;
        node.castShadow = true;
        node.receiveShadow = true;
        node.material = node.material.clone();
        node.material.roughness = 0.65;
        node.material.metalness = 0.25;
        node.material.color.setHex(colors[kind]);
        if (node.name.includes("visor")) {
          node.material.emissive = new T.Color(colors[kind]);
          node.material.emissiveIntensity = 0.2;
        }
      }
    });
    const mixer = new T.AnimationMixer(model),
      idle = mixer.clipAction(this.clips.find((c) => c.name === "Idle")),
      walk = mixer.clipAction(this.clips.find((c) => c.name === "Walk"));
    idle.play();
    walk.play();
    walk.setEffectiveWeight(0);
    mixer.update(0);
    const actor = {
      kind,
      root,
      model,
      bones,
      mixer,
      idle,
      walk,
      weight: 0,
      lastX: null,
    };
    this.actors[index] = actor;
    return actor;
  }
  render(ctx, fighters, time) {
    if (!this.ready) return false;
    const dt = Math.max(0, Math.min(0.05, time - this.time));
    this.time = time;
    fighters.forEach((f, index) => {
      const a = this.actor(f.kind, index),
        p = fightingPose({ ...f, player: `3d-${index}` }, time),
        b = a.bones;
      a.weight = T.MathUtils.damp(a.weight, f.action === "walk" ? 1 : 0, 16, dt);
      a.idle.setEffectiveWeight(1 - a.weight);
      a.walk.setEffectiveWeight(a.weight);
      a.walk.timeScale = 1.65;
      a.mixer.update(dt);
      a.model.position.y = -10 * (1 - a.weight);
      a.root.position.set(f.x - 600, 535 - f.y, 0);
      a.root.rotation.y = (f.facing || 1) * 1.05;
      a.root.rotation.x = f.action === "ko" ? -p.fall * 1.45 : 0;
      a.root.position.y += f.action === "ko" ? p.fall * 16 : 0;
      if (b.Spine) b.Spine.rotateX(p.lean * 0.003);
      if (b.Spine2) b.Spine2.rotateY(p.tilt * 1.5);
      a.root.updateMatrixWorld(true);
      const footRotations = [b.RightFoot, b.LeftFoot].map((foot) =>
        foot.getWorldQuaternion(new T.Quaternion()),
      );
      const point = (side, xy) => a.root.localToWorld(v(side, -xy[1], xy[0]));
      solve(
        b.RightArm,
        b.RightForeArm,
        b.RightHand,
        point(23, p.hand),
        point(45, p.elbow),
      );
      solve(
        b.LeftArm,
        b.LeftForeArm,
        b.LeftHand,
        point(-23, p.rearHand),
        point(-40, p.rearElbow),
      );
      if (a.weight < 0.9 || f.y < 534) {
        solve(
          b.RightUpLeg,
          b.RightLeg,
          b.RightFoot,
          point(16, [p.foot[0], p.foot[1] - 12]),
          point(18, [80, -75]),
        );
        solve(
          b.LeftUpLeg,
          b.LeftLeg,
          b.LeftFoot,
          point(-16, [p.rearFoot[0], p.rearFoot[1] - 12]),
          point(-18, [80, -75]),
        );
        [b.RightFoot, b.LeftFoot].forEach((foot, i) => {
          foot.quaternion.copy(
            foot.parent
              .getWorldQuaternion(new T.Quaternion())
              .invert()
              .multiply(footRotations[i]),
          );
          foot.updateWorldMatrix(false, true);
        });
      }
      for (const side of ["Left", "Right"])
        for (const finger of ["Index", "Middle", "Ring", "Pinky"])
          for (const joint of [1, 2, 3]) {
            const bone = b[`${side}Hand${finger}${joint}`];
            if (bone) bone.rotateX(0.8);
          }
      a.root.updateMatrixWorld(true);
    });
    this.renderer.render(this.scene, this.camera);
    ctx.drawImage(this.renderer.domElement, 0, 0);
    return true;
  }
  inspect() {
    return {
      calls: this.renderer?.info.render.calls,
      triangles: this.renderer?.info.render.triangles,
      actors: this.actors.map((a) => ({
        position: a.root.position.toArray(),
        scale: a.model.scale.toArray(),
        bounds: new T.Box3().setFromObject(a.root).getSize(v()).toArray(),
        hips: a.bones.Hips?.getWorldPosition(v()).toArray(),
        bones: Object.keys(a.bones).slice(0, 6),
      })),
    };
  }
}
