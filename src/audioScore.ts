import {nodes, selectedChoice} from './story';
import type {Save} from './storage';

type Note = readonly [beat: number, pitch: number, length: number];
type Bar = {bass: number; chord: readonly number[]; melody: readonly Note[]};
type Voice = 'pluck' | 'reed' | 'bow';
type Score = {bpm: number; voice: Voice; bars: readonly Bar[]};

const bar = (bass: number, chord: readonly number[], ...melody: Note[]): Bar => ({bass, chord, melody});

// The rising D–F–G figure is heard at home, stretched at the river, and answered in the north.
export const scores = {
  valley: {bpm: 74, voice: 'pluck', bars: [
    bar(50, [57, 62, 65], [0, 62, 1], [1.5, 65, .5], [2.5, 67, 1]),
    bar(46, [58, 62, 65], [0, 69, 1.5], [2.5, 65, .7]),
    bar(53, [57, 60, 65], [0, 67, .7], [1, 65, .8], [2.5, 62, 1]),
    bar(48, [55, 60, 64], [1, 60, 1.7]),
    bar(50, [57, 62, 65], [0, 62, 1.2], [2, 65, .7], [3, 69, .6]),
    bar(46, [57, 62, 65], [0, 74, 1.3], [2.5, 69, .8]),
    bar(55, [58, 62, 65], [0, 67, 1.3], [2.5, 65, .8]),
    bar(50, [57, 62, 64], [0, 62, 2]),
  ]},
  river: {bpm: 86, voice: 'bow', bars: [
    bar(38, [50, 57], [.5, 62, 1.2], [2.5, 65, .9]),
    bar(38, [50, 58], [0, 67, 2], [3, 65, .7]),
    bar(34, [46, 53], [1, 60, 1.5]),
    bar(36, [48, 55], [1, 62, .8], [2.5, 58, 1]),
    bar(38, [50, 57], [.5, 62, 1.3], [2.5, 65, 1]),
    bar(41, [53, 60], [0, 69, 1.5], [2, 67, 1.5]),
    bar(34, [46, 53], [1, 65, 1.2], [2.5, 60, .9]),
    bar(38, [50, 57], [0, 62, 2]),
  ]},
  elegy: {bpm: 58, voice: 'bow', bars: [
    bar(38, [50, 57], [1, 62, 2.4]),
    bar(46, [53, 58], [.5, 65, 1.7], [2.7, 67, .8]),
    bar(41, [53, 60], [0, 65, 2.6]),
    bar(36, [48, 55]),
    bar(43, [50, 58], [.5, 62, 1.7], [2.7, 60, .8]),
    bar(34, [46, 53], [0, 58, 2.5]),
    bar(36, [48, 55], [1, 60, 2]),
    bar(38, [50, 57], [0, 62, 2.8]),
  ]},
  zunyi: {bpm: 69, voice: 'reed', bars: [
    bar(50, [57, 62, 65], [0, 65, 1.3], [2, 62, 1.1]),
    bar(48, [55, 60, 64], [1, 64, 1.6]),
    bar(46, [53, 58, 62], [0, 65, 1.5], [2.4, 67, 1]),
    bar(45, [52, 57, 64], [0, 69, 2.5]),
    bar(50, [57, 62, 65], [.5, 65, 1.3], [2.4, 62, 1.2]),
    bar(53, [57, 60, 65], [0, 60, 1.3], [2, 65, 1.5]),
    bar(43, [50, 58, 62], [0, 67, 1.2], [2.2, 65, 1]),
    bar(50, [57, 62, 64], [.5, 62, 2.5]),
  ]},
  snow: {bpm: 62, voice: 'reed', bars: [
    bar(38, [50, 57], [1, 74, 2.3]),
    bar(38, [50, 55], [1, 72, 1.8]),
    bar(43, [50, 58], [0, 70, 2.7]),
    bar(38, [50, 57]),
    bar(34, [46, 53], [.5, 69, 2.6]),
    bar(36, [48, 55], [1, 67, 2.4]),
    bar(38, [50, 57], [0, 65, 1.6], [2.4, 67, 1.2]),
    bar(38, [50, 57], [1, 62, 2.1]),
  ]},
  marsh: {bpm: 64, voice: 'pluck', bars: [
    bar(43, [50, 58], [0, 62, 1.3], [2.5, 58, .7]),
    bar(41, [53, 60], [1, 60, 1.5]),
    bar(34, [46, 53], [0, 65, 1], [2, 62, 1]),
    bar(36, [48, 55], [1, 60, 1.6]),
    bar(43, [50, 58], [0, 62, 1.6]),
    bar(46, [53, 58], [1, 65, 1.3], [3, 67, .6]),
    bar(36, [48, 55], [0, 65, 1.1], [2, 60, 1]),
    bar(38, [50, 57], [1, 62, 1.5]),
  ]},
  dawn: {bpm: 70, voice: 'pluck', bars: [
    bar(50, [57, 62, 65], [0, 62, 1], [1.5, 65, .5], [2.5, 67, 1]),
    bar(46, [57, 62, 65], [0, 69, 2], [3, 65, .65]),
    bar(53, [57, 60, 65], [0, 67, 1.1], [2, 69, 1.5]),
    bar(48, [55, 60, 64], [0, 72, 2.5]),
    bar(50, [57, 62, 65], [0, 74, 1.8], [2.5, 72, 1]),
    bar(46, [57, 62, 65], [0, 69, 1.6], [2.5, 65, 1]),
    bar(48, [55, 60, 64], [0, 67, 1.2], [2, 60, 1.1]),
    bar(53, [57, 60, 65], [0, 65, 2.6]),
  ]},
} satisfies Record<string, Score>;
export type Track = keyof typeof scores;

export type Cue = 'straw' | 'steps' | 'cloth' | 'wood' | 'water' | 'paper' | 'buckle' | 'bowl' | 'horn' | 'grain';

const noCues: readonly Cue[] = [];

const sceneCues: Partial<Record<string, Record<number, readonly Cue[]>>> = {
  departure_shoes: {0: ['straw']},
  departure_role: {3: ['bowl']},
  xiang_bridge: {0: ['wood', 'water']},
  xiang_letter: {0: ['paper'], 2: ['buckle']},
  zunyi_letter: {0: ['paper']},
  snow_load: {0: ['steps']},
  grass_belt: {0: ['bowl']},
  north_trace: {0: ['horn']},
  north_names: {0: ['grain'], 3: ['paper']},
  north_delivery: {0: ['cloth', 'paper']},
};

const choiceCues: Partial<Record<string, Record<number, readonly Cue[]>>> = {
  'departure_shoes:wear': {0: ['straw', 'steps']},
  'departure_shoes:wrap': {0: ['cloth']},
  'departure_message:tell': {1: ['steps']},
  'departure_message:keep': {0: ['paper']},
  'departure_role:runner': {1: ['buckle']},
  'departure_role:cook': {0: ['wood']},
  'xiang_bridge:order': {0: ['steps']},
  'xiang_bridge:transfer': {0: ['buckle']},
  'xiang_wounded:lining': {0: ['cloth']},
  'xiang_wounded:staff': {0: ['wood']},
  'zunyi_message:repeat': {1: ['wood']},
  'zunyi_message:pair': {0: ['steps', 'water']},
  'zunyi_letter:read': {1: ['paper']},
  'zunyi_letter:seal': {0: ['cloth']},
  'snow_load:use': {0: ['straw']},
  'snow_load:save': {0: ['cloth']},
  'grass_salt:trade': {0: ['grain']},
  'grass_salt:repair': {0: ['wood', 'paper']},
  'north_trace:front': {0: ['steps']},
  'north_trace:rear': {0: ['paper']},
  'north_names:words': {0: ['paper']},
  'north_names:names': {0: ['paper']},
  'north_delivery:handoff': {0: ['straw', 'paper']},
  'north_delivery:carry': {0: ['paper']},
  'north_delivery:heal': {0: ['cloth']},
};

export function audioBeat(save: Save, ending?: string) {
  const node = nodes[save.node];
  const choice = save.phase === 'feedback' ? selectedChoice(node, save.state) : undefined;
  let track: Track = node.scene;
  if (node.id === 'xiang_letter' || ending === 'relay' || (node.id === 'grass_belt' && choice)) track = 'elegy';
  if (ending === 'lamplight') track = 'valley';
  const cues = choice ? choiceCues[node.id + ':' + choice.id]?.[save.line] : sceneCues[node.id]?.[save.line];
  return {
    track,
    ambience: node.ending ? null : node.scene,
    cues: cues ?? noCues,
    hushed: (node.id === 'xiang_letter' && !!choice && save.line > 0) || (node.id === 'grass_belt' && !!choice),
    key: [node.id, choice?.id ?? save.phase, save.line].join(':'),
  };
}
