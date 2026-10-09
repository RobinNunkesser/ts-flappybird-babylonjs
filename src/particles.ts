import {
  Scene,
  ParticleSystem,
  Texture,
  Vector3,
  Color4,
  DynamicTexture
} from "@babylonjs/core";

export class ParticleController {
  private scene: Scene;
  private particleTexture: Texture;

  constructor(scene: Scene) {
    this.scene = scene;
    this.particleTexture = this.createGlowParticleTexture();
  }

  private createGlowParticleTexture(): Texture {
    const size = 64;
    const dt = new DynamicTexture("sparkleTex", { width: size, height: size }, this.scene, false);
    const ctx = dt.getContext();

    // Soft glowing radial circle
    const grad = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
    grad.addColorStop(0, "rgba(255, 255, 255, 1)");
    grad.addColorStop(0.35, "rgba(255, 255, 255, 0.8)");
    grad.addColorStop(0.7, "rgba(200, 240, 255, 0.3)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    dt.update();
    return dt;
  }

  public emitFlapPuff(pos: Vector3, baseColor: [number, number, number]) {
    const ps = new ParticleSystem("flapPuff", 15, this.scene);
    ps.particleTexture = this.particleTexture;
    ps.emitter = new Vector3(pos.x - 0.4, pos.y - 0.1, pos.z);
    ps.minEmitBox = new Vector3(-0.1, -0.1, 0);
    ps.maxEmitBox = new Vector3(0.1, 0.1, 0);

    const [r, g, b] = baseColor;
    ps.color1 = new Color4(r, g, b, 0.9);
    ps.color2 = new Color4(r * 0.7, g * 0.7, b * 0.7, 0.5);
    ps.colorDead = new Color4(r * 0.4, g * 0.4, b * 0.4, 0.0);

    ps.minSize = 0.12;
    ps.maxSize = 0.28;
    ps.minLifeTime = 0.25;
    ps.maxLifeTime = 0.45;
    ps.emitRate = 40;
    ps.direction1 = new Vector3(-2.5, -0.8, 0);
    ps.direction2 = new Vector3(-1.0, 0.4, 0);
    ps.minEmitPower = 0.8;
    ps.maxEmitPower = 1.6;
    ps.targetStopDuration = 0.08;
    ps.disposeOnStop = true;
    ps.start();
  }

  public emitCoinBurst(pos: Vector3) {
    const ps = new ParticleSystem("coinBurst", 40, this.scene);
    ps.particleTexture = this.particleTexture;
    ps.emitter = pos;
    ps.minEmitBox = new Vector3(-0.1, -0.1, 0);
    ps.maxEmitBox = new Vector3(0.1, 0.1, 0);

    // Brilliant golden sparkles
    ps.color1 = new Color4(1.0, 0.9, 0.2, 1.0);
    ps.color2 = new Color4(1.0, 0.6, 0.1, 0.8);
    ps.colorDead = new Color4(1.0, 0.3, 0.0, 0.0);

    ps.minSize = 0.15;
    ps.maxSize = 0.35;
    ps.minLifeTime = 0.3;
    ps.maxLifeTime = 0.6;
    ps.emitRate = 200;
    ps.direction1 = new Vector3(-2, -2, 0);
    ps.direction2 = new Vector3(2, 2, 0);
    ps.minEmitPower = 2.0;
    ps.maxEmitPower = 4.5;
    ps.gravity = new Vector3(0, -6.0, 0);
    ps.targetStopDuration = 0.1;
    ps.disposeOnStop = true;
    ps.start();
  }

  public emitCrashBurst(pos: Vector3) {
    const ps = new ParticleSystem("crashBurst", 50, this.scene);
    ps.particleTexture = this.particleTexture;
    ps.emitter = pos;
    ps.minEmitBox = new Vector3(-0.2, -0.2, 0);
    ps.maxEmitBox = new Vector3(0.2, 0.2, 0);

    // Danger orange/red explosion
    ps.color1 = new Color4(1.0, 0.3, 0.2, 1.0);
    ps.color2 = new Color4(1.0, 0.7, 0.1, 0.8);
    ps.colorDead = new Color4(0.3, 0.3, 0.3, 0.0);

    ps.minSize = 0.2;
    ps.maxSize = 0.5;
    ps.minLifeTime = 0.4;
    ps.maxLifeTime = 0.8;
    ps.emitRate = 300;
    ps.direction1 = new Vector3(-3, -2, 0);
    ps.direction2 = new Vector3(3, 4, 0);
    ps.minEmitPower = 2.5;
    ps.maxEmitPower = 5.5;
    ps.gravity = new Vector3(0, -9.8, 0);
    ps.targetStopDuration = 0.12;
    ps.disposeOnStop = true;
    ps.start();
  }
}
