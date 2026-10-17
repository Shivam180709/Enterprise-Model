/**
 * Procedural Web Audio API sound effects for the USS Enterprise
 * 100% zero-dependency, generated dynamically with oscillators and filters.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private warpHumNode: OscillatorNode | null = null;
  private warpGainNode: GainNode | null = null;
  private impulseHumNode: OscillatorNode | null = null;
  private impulseGainNode: GainNode | null = null;
  private klaxonTimer: number | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.warpGainNode && this.ctx) {
      this.warpGainNode.gain.setTargetAtTime(muted ? 0 : 0.05, this.ctx.currentTime, 0.1);
    }
    if (this.impulseGainNode && this.ctx) {
      this.impulseGainNode.gain.setTargetAtTime(muted ? 0 : 0.04, this.ctx.currentTime, 0.1);
    }
    if (muted && this.klaxonTimer) {
      clearInterval(this.klaxonTimer);
      this.klaxonTimer = null;
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public startEngines() {
    if (this.warpHumNode) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      // Warp Core Low-Frequency Resonance Drone
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(54, this.ctx.currentTime); // Deep starship rumble

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(108, this.ctx.currentTime); // Harmonic overtone

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(160, this.ctx.currentTime);

      gain.gain.setValueAtTime(this.isMuted ? 0 : 0.04, this.ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start();
      osc2.start();

      this.warpHumNode = osc1;
      this.warpGainNode = gain;

      // Sub-light Impulse Engine Soft Purr
      const impOsc = this.ctx.createOscillator();
      const impFilter = this.ctx.createBiquadFilter();
      const impGain = this.ctx.createGain();

      impOsc.type = 'triangle';
      impOsc.frequency.setValueAtTime(80, this.ctx.currentTime);
      impFilter.type = 'bandpass';
      impFilter.frequency.setValueAtTime(120, this.ctx.currentTime);
      impFilter.Q.setValueAtTime(3, this.ctx.currentTime);

      impGain.gain.setValueAtTime(this.isMuted ? 0 : 0.03, this.ctx.currentTime);

      impOsc.connect(impFilter);
      impFilter.connect(impGain);
      impGain.connect(this.ctx.destination);

      impOsc.start();
      this.impulseHumNode = impOsc;
      this.impulseGainNode = impGain;
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public setWarpSpeed(isWarp: boolean) {
    if (!this.ctx || !this.warpHumNode || !this.warpGainNode) return;
    const now = this.ctx.currentTime;
    if (isWarp) {
      this.warpHumNode.frequency.exponentialRampToValueAtTime(180, now + 1.2);
      if (!this.isMuted) {
        this.warpGainNode.gain.linearRampToValueAtTime(0.09, now + 0.8);
      }
    } else {
      this.warpHumNode.frequency.exponentialRampToValueAtTime(54, now + 1.5);
      if (!this.isMuted) {
        this.warpGainNode.gain.linearRampToValueAtTime(0.04, now + 1.2);
      }
    }
  }

  public playChirp(tone: 'high' | 'mid' | 'low' = 'mid') {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      const freqs = { high: 1440, mid: 880, low: 520 };
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqs[tone], now);
      osc.frequency.exponentialRampToValueAtTime(freqs[tone] * 1.2, now + 0.06);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Audio context safety
    }
  }

  public playPhotonTorpedo() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // High-energy energetic burst
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.45);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.45);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // Audio safety
    }
  }

  public playPhaserPulse() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const mod = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      const mainGain = this.ctx.createGain();

      // FM synthesis for phaser discharge
      mod.frequency.setValueAtTime(75, now);
      modGain.gain.setValueAtTime(280, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1150, now);
      osc.frequency.linearRampToValueAtTime(820, now + 0.65);

      mod.connect(osc.frequency);

      mainGain.gain.setValueAtTime(0.09, now);
      mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(mainGain);
      mainGain.connect(this.ctx.destination);

      mod.start(now);
      osc.start(now);
      mod.stop(now + 0.7);
      osc.stop(now + 0.7);
    } catch {
      // Audio safety
    }
  }

  public setAlertKlaxon(active: boolean) {
    if (this.klaxonTimer) {
      clearInterval(this.klaxonTimer);
      this.klaxonTimer = null;
    }
    if (!active || this.isMuted) return;

    const playSirenBurst = () => {
      if (this.isMuted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        // Authentic 2-tone Starfleet Red Alert siren
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.linearRampToValueAtTime(840, now + 0.4);

        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.75);
      } catch {
        // Audio safety
      }
    };

    playSirenBurst();
    this.klaxonTimer = window.setInterval(playSirenBurst, 1200);
  }
}

export const spaceAudio = new SoundEngine();
