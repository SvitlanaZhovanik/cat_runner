/**
 * Native Web Audio API sound synthesizer for charming, zero-dependency 8-bit sound effects.
 */
class AudioSynth {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazy initialized to respect browser autoplay policies
  }

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMutedState(): boolean {
    return this.isMuted;
  }

  /**
   * Cute retro sound for a cat jumping! (Rising pitch sweep)
   */
  public playJump() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle"; // Soft retro tone
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      // Sweep upwards quickly to simulate jumping
      osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
  }

  /**
   * Sound for ducking/sliding (descending whistle)
   */
  public playDuck() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.13);
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
  }

  /**
   * Sparkly sound when a fish treat is collected!
   */
  public playCollect() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      // Two rapid bright notes (arpeggio)
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.06); // A5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.setValueAtTime(0.12, now + 0.06);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(now + 0.22);
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
  }

  /**
   * Alarm/sad meow sound when hitting an obstacle!
   */
  public playMeowDamaged() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      
      // Main 'Meow' oscillator (triangle wave for classic voice)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "triangle";
      
      // Initial rise then sliding down
      osc.frequency.setValueAtTime(330, now); // E4
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.05); // A4 (rising onset)
      osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.3); // C4 (falling 'ow')

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.35);

      // Add a subtle frequency modulation (vibrato) for organic cat-like quality
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(14, now); // 14Hz purr/meow vibration
      lfoGain.gain.setValueAtTime(15, now); // frequency offset amount

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      lfo.start();
      osc.start();

      lfo.stop(now + 0.36);
      osc.stop(now + 0.36);
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
  }

  /**
   * Short, cute meow for happy selections!
   */
  public playMeowHappy() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.08); // D5
      osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.2); // C5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(now + 0.22);
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
  }

  /**
   * Sound when user unlocks a new skin!
   */
  public playUnlock() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(261.63, now); // C4
      osc.frequency.setValueAtTime(329.63, now + 0.07); // E4
      osc.frequency.setValueAtTime(392.00, now + 0.14); // G4
      osc.frequency.setValueAtTime(523.25, now + 0.21); // C5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(now + 0.42);
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
  }

  /**
   * Gentle button feedback sound
   */
  public playClick() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
  }
}

export const synth = new AudioSynth();
