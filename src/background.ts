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
  private baseSpeed: number = 0.22; // Base UV scroll speed

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
    // In Babylon.js, invertY MUST be true so that images render right side up!
    const tex = new Texture(url, this.scene, true, true);
    tex.wrapU = Texture.WRAP_ADDRESSMODE;
    tex.wrapV = Texture.CLAMP_ADDRESSMODE;
    tex.uScale = uScale;
    tex.hasAlpha = hasAlpha;

    const mat = new StandardMaterial(`${name}Mat`, this.scene);
    mat.diffuseTexture = tex;
    mat.useAlphaFromDiffuseTexture = hasAlpha;
    mat.diffuseColor = new Color3(1, 1, 1);
    mat.emissiveColor = new Color3(0.65, 0.65, 0.65);
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
    // Camera is at (0, 0, -13.5) with FOV 0.72 rad (~41°).
    // Viewport height at Z=0 is ~10.2, width is ~18.1 (16:9) to ~24 (ultrawide).

    // 1. Sky Background (Deepest layer, fills entire screen at all resolutions)
    // At Z=5.0, camera distance is 18.5 -> Frustum is ~14h x ~25w (16:9).
    // Mesh 52x28 ensures zero black bars or voids anywhere.
    this.layers.push(
      this.createLayer(
        "bg_sky",
        "./assets/environment/Sky_Background.png",
        52,
        28,
        5.0,
        0.0,
        0.015,
        1.2,
        false
      )
    );

    // 2. Far Mountains (Mountain_2.png, aspect 1920:382 ~ 5:1)
    // Mountain peaks pointing UP, base anchored behind ground
    this.layers.push(
      this.createLayer(
        "bg_mountains_far",
        "./assets/environment/Mountain_2.png",
        44,
        7.5,
        3.8,
        -0.8,
        0.05,
        1.0,
        true
      )
    );

    // 3. Clouds (Clouds_1.png, drifting across upper sky)
    this.layers.push(
      this.createLayer(
        "bg_clouds",
        "./assets/environment/Clouds_1.png",
        42,
        8.0,
        2.8,
        2.2,
        0.10,
        1.0,
        true
      )
    );

    // 4. Near Green Hills (Moutains_1.png, aspect 1920:268 ~ 7.1:1)
    // Rolling hills sitting right behind the foreground ground
    this.layers.push(
      this.createLayer(
        "bg_mountains_near",
        "./assets/environment/Moutains_1.png",
        38,
        5.2,
        1.6,
        -1.8,
        0.18,
        1.0,
        true
      )
    );

    // 5. Foreground Ground (Ground.png, 1920x210)
    // Top has green grass at Y = -4.1, brown dirt fills down to bottom of screen.
    // Height 2.8, Center Y = -5.5 -> Top edge is exactly -4.10!
    this.layers.push(
      this.createLayer(
        "bg_ground",
        "./assets/environment/Ground.png",
        36,
        2.8,
        0.0, // Aligned with pipes and player plane
        -5.5,
        1.0, // Matches 100% pipe obstacle travel speed
        1.6, // Aspect ratio correction so texture is not stretched
        true
      )
    );
  }

  public update(deltaSec: number, isPlaying: boolean = true) {
    const factor = isPlaying ? 1.0 : 0.25; // Gentle idle drift when on menu
    for (const layer of this.layers) {
      layer.texture.uOffset += this.baseSpeed * layer.scrollSpeedMultiplier * deltaSec * factor;
      if (layer.texture.uOffset > 1000) {
        layer.texture.uOffset -= 1000;
      }
    }
  }

  public getGroundY(): number {
    return -4.1; // Top boundary of ground for collision
  }

  public getCeilingY(): number {
    return 5.4; // Top boundary of sky
  }
}
