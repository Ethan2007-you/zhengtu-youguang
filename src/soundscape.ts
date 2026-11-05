import {scores, type Cue, type Track} from './audioScore';
import type {SceneId} from './story';

type Voice = 'pluck' | 'reed' | 'bow' | 'brass' | 'ceramic';
type Playing = {source: AudioBufferSourceNode; gain: GainNode};
type Layer = {id: string | null; revision: number; playing?: Playing};
type Mix = {audio: boolean; music: number; effects: number; paused: boolean; hushed: boolean};
const sampleRate = 24_000;
const voices: Record<Voice, readonly number[]> = {
  pluck: [1, .32, .18, .13, .07, .04],
  reed: [1, .17, .23, .06, .08],
  bow: [1, .44, .24, .15, .10, .06],
  brass: [1, .49, .30, .16, .10, .07, .04],
  ceramic: [1, .29, .11],
};

function tone(
  ctx: BaseAudioContext, to: AudioNode, voice: Voice, pitch: number,
  start: number, length: number, level: number,
) {
  const frequency = 440 * 2 ** ((pitch - 69) / 12);
  const plucked = voice === 'pluck' || voice === 'ceramic';
  const end = start + length;
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(level, start + Math.min(length / 3, plucked ? .009 : .21));
  if (plucked) envelope.gain.exponentialRampToValueAtTime(.00003, end - .009);
  else envelope.gain.linearRampToValueAtTime(level * .86, start + length * .57);
  envelope.gain.linearRampToValueAtTime(0, end);
  envelope.connect(to);
  const vibrato = plucked ? null : ctx.createOscillator();
  const depth = vibrato && ctx.createGain();
  if (vibrato && depth) {
    vibrato.frequency.value = 4.4;
    depth.gain.setValueAtTime(0, start);
    depth.gain.linearRampToValueAtTime(voice === 'bow' ? 10 : 6, start + length / 2);
    vibrato.connect(depth);
    vibrato.start(start);
    vibrato.stop(end);
  }

  voices[voice].forEach((amplitude, i) => {
    const partial = ctx.createOscillator();
    const gain = ctx.createGain();
    const multiplier = voice === 'ceramic' ? [1, 2.51, 4.07][i] : i + 1;
    partial.frequency.value = frequency * multiplier;
    if (voice === 'brass') {
      partial.detune.setValueAtTime(-29, start);
      partial.detune.linearRampToValueAtTime(0, start + .13);
    }
    depth?.connect(partial.detune);
    gain.gain.setValueAtTime(amplitude, start);
    if (plucked && i > 0) gain.gain.exponentialRampToValueAtTime(amplitude * .05, start + length * .46);
    partial.connect(gain).connect(envelope);
    partial.start(start);
    partial.stop(end);
  });
}

function sealLoop(buffer: AudioBuffer, seconds = .075) {
  const samples = buffer.getChannelData(0);
  const edge = Math.floor(buffer.sampleRate * seconds);
  for (let i = 0; i < edge; i++) {
    const fade = Math.sin((Math.PI / 2) * i / edge);
    samples[i] *= fade;
    samples[samples.length - 1 - i] *= fade;
  }
  return buffer;
}

async function renderMusic(id: Track) {
  const score = scores[id];
  const beat = 60 / score.bpm;
  const ctx = new OfflineAudioContext(1, Math.ceil(score.bars.length * 4 * beat * sampleRate), sampleRate);
  const room = ctx.createGain();
  room.connect(ctx.destination);
  for (const [time, level] of [[.16, .15], [.32, .085]]) {
    const delay = ctx.createDelay();
    const damping = ctx.createBiquadFilter();
    const reflection = ctx.createGain();
    delay.delayTime.value = time;
    damping.frequency.value = 1250;
    reflection.gain.value = level;
    room.connect(delay).connect(damping).connect(reflection).connect(ctx.destination);
  }
  score.bars.forEach(({bass, chord, melody}, index) => {
    const start = index * 4 * beat + .04;
    tone(ctx, room, id === 'river' ? 'pluck' : 'bow', bass, start, 3.65 * beat, .075);
    if (id === 'river') tone(ctx, room, 'pluck', bass, start + beat * 2, beat * 1.1, .049);
    chord.forEach((pitch, i) => {
      const arpeggiate = id === 'valley' || id === 'dawn' || id === 'zunyi';
      const offset = arpeggiate ? .43 + i * .52 : .15 + i * .06;
      tone(ctx, room, arpeggiate ? 'pluck' : 'bow', pitch, start + beat * offset, beat * (3.78 - offset), .039);
    });
    melody.forEach(([offset, pitch, length]) => {
      tone(ctx, room, score.voice, pitch, start + offset * beat, length * beat, .103);
    });
  });
  return sealLoop(await ctx.startRendering());
}

function randomSequence(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return seed / 2147483648;
  };
}

function noise(
  ctx: BaseAudioContext, to: AudioNode, start: number, length: number,
  frequency: number, level: number, attack: number, seed: number,
) {
  const source = ctx.createBufferSource();
  const buffer = ctx.createBuffer(1, Math.ceil(length * sampleRate), sampleRate);
  const samples = buffer.getChannelData(0);
  const random = randomSequence(seed);
  for (let i = 0; i < samples.length; i++) samples[i] = random();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = frequency;
  filter.Q.value = .7;
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(level, start + attack);
  envelope.gain.exponentialRampToValueAtTime(.00004, start + length - .01);
  envelope.gain.linearRampToValueAtTime(0, start + length);
  source.connect(filter).connect(envelope).connect(to);
  source.start(start);
}

async function renderCue(cue: Cue) {
  const ctx = new OfflineAudioContext(1, Math.ceil((cue === 'horn' ? 2.7 : 1.3) * sampleRate), sampleRate);
  const out = ctx.destination;
  const burst = (time: number, length: number, frequency: number, level: number, attack = .012) =>
    noise(ctx, out, time, length, frequency, level, attack, 230 + Math.round(time * 1000 + frequency));
  switch (cue) {
    case 'straw':
      burst(.02, .32, 1920, .22, .037);
      burst(.22, .22, 2940, .14);
      break;
    case 'steps':
      for (const [i, time] of [.02, .33, .67].entries()) {
        burst(time, .25, 330 - i * 32, .39 - i * .045, .019);
        burst(time + .037, .23, 1470, .12);
      }
      break;
    case 'cloth':
      burst(.02, .48, 830, .27, .069);
      burst(.19, .28, 1590, .12, .045);
      break;
    case 'wood':
      burst(.025, .26, 250, .30);
      tone(ctx, out, 'pluck', 41, .025, .29, .10);
      burst(.18, .39, 640, .18, .06);
      break;
    case 'water':
      burst(.02, .68, 770, .28, .082);
      burst(.14, .48, 2290, .15, .056);
      break;
    case 'paper':
      burst(.025, .26, 3400, .19, .029);
      burst(.17, .36, 2160, .24, .045);
      break;
    case 'buckle':
      tone(ctx, out, 'ceramic', 81, .03, .29, .13);
      burst(.04, .15, 2260, .16);
      break;
    case 'bowl':
      tone(ctx, out, 'ceramic', 73, .04, .60, .15);
      tone(ctx, out, 'ceramic', 75, .22, .43, .093);
      break;
    case 'grain':
      burst(.05, .62, 2590, .20, .14);
      burst(.17, .42, 1240, .12, .08);
      break;
    case 'horn': {
      const distance = ctx.createBiquadFilter();
      distance.frequency.value = 1580;
      distance.connect(out);
      tone(ctx, distance, 'brass', 62, .18, .43, .10);
      tone(ctx, distance, 'brass', 69, .65, .84, .116);
      tone(ctx, distance, 'brass', 69, .97, 1.25, .028);
      break;
    }
  }
  return ctx.startRendering();
}

const weather: Record<SceneId, {cutoff: number; high: number; strength: number}> = {
  valley: {cutoff: 295, high: 4300, strength: .22},
  river: {cutoff: 750, high: 2310, strength: .74},
  zunyi: {cutoff: 1070, high: 4300, strength: .44},
  snow: {cutoff: 390, high: 2450, strength: .82},
  marsh: {cutoff: 920, high: 3850, strength: .60},
  dawn: {cutoff: 280, high: 2600, strength: .20},
};

function renderAmbience(ctx: AudioContext, scene: SceneId) {
  const buffer = ctx.createBuffer(1, sampleRate * 12, sampleRate);
  const samples = buffer.getChannelData(0);
  const {cutoff, high, strength} = weather[scene];
  const random = randomSequence(cutoff);
  const lowRate = 1 - Math.exp(-2 * Math.PI * cutoff / sampleRate);
  const highRate = 1 - Math.exp(-2 * Math.PI * high / sampleRate);
  let low = 0;
  let upper = 0;
  let droplets = 0;
  const wet = scene === 'zunyi' || scene === 'marsh';
  for (let i = 0; i < samples.length; i++) {
    const white = random();
    low += lowRate * (white - low);
    upper += highRate * (white - upper);
    const t = i / samples.length * 2 * Math.PI;
    const gust = .53 + .27 * Math.sin(t * 2) + .15 * Math.sin(t * 5 + 1);
    if (wet) {
      droplets *= .994;
      if (white > .997) droplets = scene === 'marsh' ? .53 : .73;
    }
    samples[i] = strength * (gust * low + (.12 + droplets) * (upper - low));
  }
  return sealLoop(buffer, .18);
}

export class Soundscape {
  private readonly context = new AudioContext();
  private readonly music = this.context.createGain();
  private readonly ambience = this.context.createGain();
  private readonly effects = this.context.createGain();
  private readonly musicLayer: Layer = {id: null, revision: 0};
  private readonly ambienceLayer: Layer = {id: null, revision: 0};
  private readonly tracks = new Map<Track, Promise<AudioBuffer>>();
  private readonly cueBuffers = new Map<Cue, Promise<AudioBuffer>>();
  private readonly ambientBuffers = new Map<SceneId, AudioBuffer>();
  private readonly activeCues = new Set<Playing>();
  private cueRevision = 0;
  private disposed = false;

  constructor() {
    const limiter = this.context.createDynamicsCompressor();
    limiter.threshold.value = -11;
    limiter.ratio.value = 6;
    limiter.connect(this.context.destination);
    for (const bus of [this.music, this.ambience, this.effects]) {
      bus.gain.value = 0;
      bus.connect(limiter);
    }
  }

  resume() {
    return this.context.resume();
  }

  setVisibility(hidden: boolean) {
    if (this.disposed) return;
    if (hidden) this.clearCues();
    void (hidden ? this.context.suspend() : this.context.resume()).catch(() => {});
  }

  mix({audio, music, effects, paused, hushed}: Mix) {
    const now = this.context.currentTime;
    const duck = paused ? .26 : hushed ? .10 : 1;
    this.music.gain.setTargetAtTime(audio ? music * duck : 0, now, .14);
    this.ambience.gain.setTargetAtTime(audio ? effects * .58 * duck : 0, now, .15);
    this.effects.gain.setTargetAtTime(audio && !paused ? effects : 0, now, .035);
    if (!audio || paused || !effects) this.clearCues();
  }

  setScene(track: Track | null, ambience: SceneId | null) {
    this.transition(this.musicLayer, track, this.music, 1.55, async id => {
      const key = id as Track;
      let buffer = this.tracks.get(key);
      if (!buffer) {
        buffer = renderMusic(key).catch(error => { this.tracks.delete(key); throw error; });
        this.tracks.set(key, buffer);
      }
      return buffer;
    });
    this.transition(this.ambienceLayer, ambience, this.ambience, .9, async id => {
      const key = id as SceneId;
      let buffer = this.ambientBuffers.get(key);
      if (!buffer) {
        buffer = renderAmbience(this.context, key);
        this.ambientBuffers.set(key, buffer);
      }
      return buffer;
    });
  }

  private transition(
    layer: Layer, id: string | null, to: GainNode, fade: number,
    load: (id: string) => Promise<AudioBuffer>,
  ) {
    if (layer.id === id) return;
    layer.id = id;
    const revision = ++layer.revision;
    if (!id) {
      if (layer.playing) this.retire(layer.playing, fade);
      layer.playing = undefined;
      return;
    }
    void load(id).then(buffer => {
      if (this.disposed || revision !== layer.revision) return;
      if (layer.playing) this.retire(layer.playing, fade);
      const now = this.context.currentTime;
      const layerSound = this.source(buffer, to);
      layerSound.source.loop = true;
      layerSound.gain.gain.setValueAtTime(0, now);
      layerSound.gain.gain.linearRampToValueAtTime(1, now + fade);
      layerSound.source.start(now);
      layer.playing = layerSound;
    }).catch(() => {
      if (revision === layer.revision) layer.id = null;
    });
  }

  private source(buffer: AudioBuffer, to: AudioNode): Playing {
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    source.connect(gain).connect(to);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };
    return {source, gain};
  }

  private retire({source, gain}: Playing, seconds: number) {
    const now = this.context.currentTime;
    if (typeof gain.gain.cancelAndHoldAtTime === 'function') {
      gain.gain.cancelAndHoldAtTime(now);
      gain.gain.linearRampToValueAtTime(0, now + seconds);
    } else {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(0, now, seconds / 5);
    }
    source.stop(now + seconds + .01);
  }

  clearCues() {
    this.cueRevision++;
    for (const cue of this.activeCues) this.retire(cue, .07);
    this.activeCues.clear();
  }

  playCues(cues: readonly Cue[]) {
    this.clearCues();
    if (document.hidden || !cues.length) return;
    const revision = this.cueRevision;
    void Promise.all(cues.map(cue => {
      let buffer = this.cueBuffers.get(cue);
      if (!buffer) {
        buffer = renderCue(cue).catch(error => { this.cueBuffers.delete(cue); throw error; });
        this.cueBuffers.set(cue, buffer);
      }
      return buffer;
    })).then(buffers => {
      if (this.disposed || revision !== this.cueRevision || document.hidden) return;
      buffers.forEach((buffer, i) => {
        const cue = this.source(buffer, this.effects);
        cue.source.addEventListener('ended', () => this.activeCues.delete(cue), {once: true});
        this.activeCues.add(cue);
        cue.source.start(this.context.currentTime + .09 + i * .12);
      });
    }).catch(() => {});
  }

  close() {
    this.disposed = true;
    void this.context.close().catch(() => {});
  }
}
