export class SoundController {
  private enabled: boolean = true;
  private audioCtx: AudioContext | null = null;
  private bgmAudio: HTMLAudioElement | null = null;
  private sfxBuffers: Map<string, AudioBuffer> = new Map();
  private initialized: boolean = false;

  constructor() {
    // Lazy audio context initialization on first interaction
  }

  public init() {
    if (this.initialized) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
      this.preloadSounds();
      this.initBgm();
      this.initialized = true;
    } catch (e) {
      console.warn("AudioContext initialization error:", e);
    }
  }

  private async loadBuffer(url: string, name: string) {
    if (!this.audioCtx) return;
    try {
      const resp = await fetch(url);
      const arrayBuffer = await resp.arrayBuffer();
      const decoded = await this.audioCtx.decodeAudioData(arrayBuffer);
      this.sfxBuffers.set(name, decoded);
    } catch (err) {
      console.warn(`Could not load audio file ${url}:`, err);
    }
  }

  private preloadSounds() {
    this.loadBuffer("./assets/audio/flap.wav", "flap");
    this.loadBuffer("./assets/audio/Coin.wav", "coin");
    this.loadBuffer("./assets/audio/Hit_Hurt.wav", "hit");
    this.loadBuffer("./assets/audio/click1.mp3", "click");
  }

  private initBgm() {
    try {
      this.bgmAudio = new Audio("./assets/audio/POL-flight-master-short.wav");
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = 0.25;
    } catch (e) {
      console.warn("Could not setup background music:", e);
    }
  }

  public resumeContext() {
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  public playSound(name: string, pitchVariance: number = 0.05) {
    if (!this.enabled) return;
    this.init();
    this.resumeContext();

    const buffer = this.sfxBuffers.get(name);
    if (buffer && this.audioCtx) {
      try {
        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        const detune = (Math.random() * 2 - 1) * pitchVariance * 1200;
        source.detune.value = detune;

        const gainNode = this.audioCtx.createGain();
        gainNode.gain.value = name === "hit" ? 0.7 : 0.5;

        source.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        source.start(0);
        return;
      } catch (e) {
        console.warn("WebAudio playback error, falling back to synthesizer:", e);
      }
    }

    // Synthesizer fallback if buffer not ready
    this.playSynthFallback(name);
  }

  private playSynthFallback(name: string) {
    if (!this.audioCtx || !this.enabled) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const now = this.audioCtx.currentTime;

      if (name === "flap") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (name === "coin") {
        osc.type = "square";
        osc.frequency.setValueAtTime(987, now);
        osc.frequency.setValueAtTime(1318, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (name === "hit") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch {}
  }

  public playBgm() {
    if (!this.enabled || !this.bgmAudio) return;
    this.bgmAudio.play().catch(() => {});
  }

  public pauseBgm() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.pauseBgm();
    } else {
      this.playBgm();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }
}
