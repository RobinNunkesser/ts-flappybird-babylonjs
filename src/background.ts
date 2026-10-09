import {
  Scene,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Texture,
  Color3
} from "@babylonjs/core";

interface ParallaxLayer {
  mesh: Mesh;
  texture: Texture;
  scrollSpeedMultiplier: number;
}

export class BackgroundController {
  private scene: Scene;
  private layers: ParallaxLayer[] = [];
  private baseSpeed: number = 0.22; // UV scroll speed base

  constructor(scene: Scene) {
    this.scene = scene;
    this.buildLayers();
  }

  private createLayer(
    name: string,
    url: string,
    width: number,
    height: number,
    posZ: number,
    posY: number,
    scrollSpeedMultiplier: number,
    uScale: number = 1.0,
    hasAlpha: boolean = true
  ): ParallaxLayer {
    const tex = new Texture(url, this.scene, true, false);
    tex.wrapU = Texture.WRAP_ADDRESSMODE;
    tex.wrapV = Texture.CLAMP_ADDRESSMODE;
    tex.uScale = uScale;
    tex.hasAlpha = hasAlpha;

    const mat = new StandardMaterial(`${name}Mat`, this.scene);
    mat.diffuseTexture = tex;
    mat.useAlphaFromDiffuseTexture = hasAlpha;
    mat.diffuseColor = new Color3(1, 1, 1);
    mat.emissiveColor = new Color3(0.5, 0.5, 0.5);
    mat.specularColor = new Color3(0, 0, 0);
    mat.backFaceCulling = false;

    const plane = MeshBuilder.CreatePlane(
      name,
      { width, height },
      this.scene
    );
    plane.material = mat;
    plane.position.set(0, posY, posZ);

    return {
      mesh: plane,
      texture: tex,
      scrollSpeedMultiplier
    };
  }

  private buildLayers() {
    // 1. Sky Background (Deep back, very slow drift)
    this.layers.push(
      this.createLayer(
        "bg_sky",
        "./assets/environment/Sky_Background.png",
        42,
        24,
        40,
        2,
        0.02,
        1.0,
        false
      )
    );

    // 2. Far Mountains (Z = 28)
    this.layers.push(
      this.createLayer(
        "bg_mountains_far",
        "./assets/environment/Mountain_2.png",
        36,
        8,
        28,
        -1.5,
        0.08,
        1.0,
        true
      )
    );

    // 3. Clouds (Z = 22)
    this.layers.push(
      this.createLayer(
        "bg_clouds",
        "./assets/environment/Clouds_1.png",
        34,
        10,
        22,
        2.5,
        0.12,
        1.0,
        true
      )
    );

    // 4. Near Mountains / Hills (Z = 15)
    this.layers.push(
      this.createLayer(
        "bg_mountains_near",
        "./assets/environment/Moutains_1.png",
        30,
        6,
        15,
        -2.5,
        0.22,
        1.0,
        true
      )
    );

    // 5. Ground (Z = 0, directly aligned with gameplay plane)
    // Gameplay runs between Y = -5.0 to Y = +6.0
    // Ground plane sits at Y = -5.8, height 2.5
    this.layers.push(
      this.createLayer(
        "bg_ground",
        "./assets/environment/Ground.png",
        24,
        2.6,
        0,
        -5.6,
        1.0, // Matches 100% pipe obstacle travel speed
        1.4,
        true
      )
    );
  }

  public update(deltaSec: number, isPlaying: boolean = true) {
    const factor = isPlaying ? 1.0 : 0.2; // Gentle idle drift when on menu
    for (const layer of this.layers) {
      layer.texture.uOffset += this.baseSpeed * layer.scrollSpeedMultiplier * deltaSec * factor;
      if (layer.texture.uOffset > 1000) {
        layer.texture.uOffset -= 1000;
      }
    }
  }

  public getGroundY(): number {
    return -4.4; // Top boundary of ground for collision
  }

  public getCeilingY(): number {
    return 6.0; // Top boundary of sky
  }
}
