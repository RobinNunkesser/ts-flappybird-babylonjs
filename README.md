# ts-flappybird-babylonjs

> **Babylon.js Flappy Bird Clone & Asset-Integration Proof of Concept (PoC)**  
> Entwickelt für das Lehrgebiet Interaktive Grafikanwendungen (IGA) und zur Evaluation von agentenbasierten Asset-Pipelines in Babylon.js.  
>  
> 🌐 **Live Demo (GitHub Pages)**: [https://robinnunkesser.github.io/ts-flappybird-babylonjs/](https://robinnunkesser.github.io/ts-flappybird-babylonjs/)

---

## 🎯 Ziele des PoC

1. **Ein gut spielbarer Flappy Bird Klon**:
   - Reaktiv ansprechende Steuerung (Leertaste, Mausklick, Pfeiltaste/W, Touch/Tap für mobile Endgeräte).
   - Authentische Flug- und Fallphysik: Sprungimpuls, konfigurierbare Gravitation, geschmeidige Nick-Neigung (*Pitch Rotation*: Aufbäumen beim Schlag, Abtauchen beim Fall).
   - Prozedurale Hindernis-Röhren mit fairen Abständen und Durchflughöhen.
   - Bonus-Münzen (*Collectibles*) zwischen den Röhren zur Erhöhung des Spielspaßes.
   - Highscore-Persistenz im `localStorage` und Medaillenvergabe (Bronze, Silber, Gold, Trophäe).
   - Kamera-Shake und Partikelexplosion beim Aufprall.

2. **Evaluation von Asset-Integration & Asset-Erstellung in Babylon.js**:
   - **Externe 2D-Sprite-Charaktere**: Integration der Pixel-Art-Charaktere aus `FlyingBambam` (Alien, Drache, Wespe) sowie dem Unity 2D Side-Scroller Art Kit (Blauer Vogel) als animierte Billboard-Meshes mit Frame-Zyklen.
   - **Multi-Layer Parallax Scrolling**: Tiefenstaffelung auf der 3D Z-Achse (Himmel bei Z=40, ferne Berge bei Z=28, Wolken bei Z=22, vordere Hügel bei Z=15, Spielgeschehen & Boden bei Z=0) mit UV-Offset-Scrolling in der Render-Loop.
   - **3D vs. 2D Hybrid-Rendering**: Umschaltbar zwischen prozedural modellierten 3D-Röhren (Cylinder mit Lippen-Kragen, metallischem Glanzlicht und PBR/StandardMaterial) und klassischen 2D-Textur-Röhren.
   - **Partikelsysteme**: Dynamische Partikeleffekte für Flügelschlag-Auren in der jeweiligen Signaturfarbe des Charakters, goldene Sternenexplosionen bei Münzaufnahme und Trümmerpartikel bei Kollision.
   - **Audio-Pipeline**: Integration externer Soundeffekte (Münze, Aufprall, Klicks) und BGM aus `flappy-fly-bird`, kombiniert mit prozedural synthetisierten Flügelschlag-Sounds.

---

## 🕹️ Spielbare Charaktere

| Charakter | Herkunft | Art / Pipeline | Frames | Besonderheit | Signatur-Partikel |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **Classic Bird** | 2D Sidescroller Art Kit | 2D Sprite Plane | 3 | Agiler Flieger, klassisches Arcade-Gefühl | Cyan / Blau |
| **HSHL 3D-Logo** | **IGA HSHL-3D-Demo** | **3D CI-Mesh** | ∞ | 6-Quader-CI-Mesh (Blau/Gelb) mit Akkordeon-Flug & 3D-Schwebung | HSHL Blau (#009FE3) |
| **Steampunk-Kauz** | **Weg B: KI-Prompt** | **2D KI-Spritesheet** | 4 | Diffusions-Modell via Prompt generiert, per Python segmentiert | Goldenes Bernstein / Messing |
| **Cyber-Drohne** | **Weg A: Code-Prompt** | **3D Prozedural-Mesh** | ∞ | Vollwertiges Babylon.js 3D-Modell mit Gelenkschwingen & Plasmajet | Neon-Cyan Plasma |
| **Dragon** | `FlyingBambam` | 2D Sprite Plane | 4 | Mächtiger Gleiter mit hoher visueller Präsenz | Flammendes Orange |
| **Alien** | `FlyingBambam` | 2D Sprite Plane | 4 | Kosmischer Springer, crispe Pixel-Art | Neon-Grün |
| **Wasp** | `FlyingBambam` | 2D Sprite Plane | 4 | Schnelle Flügelschlag-Frequenz | Goldenes Gelb |

---

## 🛠️ Architektur & Asset-Pipeline

```
ts-flappybird-babylonjs/
├── index.html              # Modernes Arcade-Overlay (HUD, Character Picker, Game Over)
├── public/
│   └── assets/
│       ├── audio/          # Sound-Effekte (Coin.wav, Hit_Hurt.wav, flap.wav, BGM)
│       ├── characters/     # Frame-Sequenzen & Spritesheets (Alien, Dragon, Wasp, Bird)
│       └── environment/    # Parallax-Layer (Sky, Clouds, Mountains, Ground, Obstacle)
├── src/
│   ├── audio.ts            # SoundController (Web Audio API Buffer & Synthesizer Fallback)
│   ├── background.ts       # BackgroundController (Multi-Layer Parallax Z-Depth & UV-Scroll)
│   ├── characters.ts       # CharacterController (Mesh-Billboard, Textur-Swapping & Hitboxen)
│   ├── game.ts             # FlappyGame Coordinator (Babylon Engine, Scene, Physics, Loop)
│   ├── main.ts             # DOM UI Binding, Input-Listener (Space, Click, Touch)
│   ├── particles.ts        # ParticleController (Flap trail, Coin burst, Crash burst)
│   ├── pipes.ts            # PipeManager (3D Mesh vs 2D Sprite, Recycling, Bounding-Box Checks)
│   ├── style.css           # Modernes Glassmorphism-Designsystem (Outfit & Press Start 2P)
│   └── types.ts            # TypeScript Schnittstellen und Konfigurationen
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Babylon.js Asset-Integrationsmuster

1. **Sprite-Animation via Textured Billboard Planes**:
   Statt des älteren `SpriteManager`s nutzt dieser PoC dynamische Ebenen (`MeshBuilder.CreatePlane`) mit `StandardMaterial`, Alphamaske und schnellem Texturtausch auf Basis von `Texture.NEAREST_SAMPLINGMODE`. Dies ermöglicht pixelgenaue Schärfe, freie 3D-Rotation (Pitch beim Steigen/Fallen) sowie die nahtlose Einbindung von Licht und Schatten.

2. **Parallax ohne Mesh-Vervielfachung**:
   Durch Setzen von `tex.wrapU = Texture.WRAP_ADDRESSMODE` scrollt der Hintergrund performant über die Verschiebung von `uOffset` in der Render-Schleife. Das spart Garbage Collection und Draw-Calls ein.

3. **Hybrid-Pipeline (2D Assets in 3D-Raum)**:
   Externe 2D-Assets (Unitypackage, PNG-Folgen) werden harmonisch mit prozeduralen 3D-Meshes (Röhren mit Zylindern und Rändern, rotierende 3D-Münzen) kombiniert.

---

## 🚀 Lokale Ausführung

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Produktions-Build erstellen
npm run build
```

---

## 📜 Lizenz & Assets

- Spielcode: MIT (Robin Nunkesser)
- Charaktere: FlyingBambam Assets (Robin Nunkesser)
- Umgebung: Basic 2D Side Scroller Art Kit
- Audio: FlappyFlyBird Open Assets
