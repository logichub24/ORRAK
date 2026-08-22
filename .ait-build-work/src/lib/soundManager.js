export const SoundManager = {
  ctx: null,

  init() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  },

  playTone(freq, type, duration, vol = 0.05) {
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio is optional.
    }
  },

  playClick() {
    this.playTone(600, "sine", 0.1, 0.03);
  },

  playTab() {
    this.playTone(800, "triangle", 0.05, 0.02);
  },

  playAI() {
    this.playTone(880, "sine", 0.1, 0.05);
    window.setTimeout(() => this.playTone(1760, "sine", 0.2, 0.05), 100);
  },

  playJump() {
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {
      // Audio is optional.
    }
  },

  playScore() {
    this.playTone(1200, "square", 0.1, 0.02);
    window.setTimeout(() => this.playTone(1600, "square", 0.15, 0.02), 80);
  },

  playFall() {
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch {
      // Audio is optional.
    }
  },

  playSuccess() {
    this.playTone(523.25, "sine", 0.1, 0.05);
    window.setTimeout(() => this.playTone(659.25, "sine", 0.1, 0.05), 100);
    window.setTimeout(() => this.playTone(783.99, "sine", 0.2, 0.05), 200);
    window.setTimeout(() => this.playTone(1046.5, "sine", 0.4, 0.05), 300);
  },
};
