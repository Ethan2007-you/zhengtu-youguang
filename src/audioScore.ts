import {nodes, selectedChoice} from './story';
import type {Save} from './storage';

export const musicTracks = {
  home: {title: 'Guzheng City', isrc: 'USUAN2100001'},
  river: {title: 'Long Road Ahead B', isrc: 'USUAN1100589'},
  zunyi: {title: 'Eastern Thought', isrc: 'USUAN1100682'},
  heights: {title: 'Peaceful Desolation', isrc: 'USUAN1200017'},
  north: {title: 'Meditation Impromptu 02', isrc: 'USUAN1100162'},
} as const;
export type Track = keyof typeof musicTracks;
export const musicLicense = 'https://creativecommons.org/licenses/by/4.0/';
export const musicSource = (isrc: string) =>
  'https://incompetech.com/music/royalty-free/index.html?isrc=' + isrc;

const chapterTracks: readonly Track[] = ['home', 'river', 'zunyi', 'heights', 'north'];

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
  const quiet = node.id === 'xiang_letter' || ending === 'relay' || (node.id === 'grass_belt' && !!choice);
  const cues = choice ? choiceCues[node.id + ':' + choice.id]?.[save.line] : sceneCues[node.id]?.[save.line];
  return {
    track: quiet ? null : chapterTracks[node.chapter - 1],
    cues: cues ?? noCues,
    hushed: cues?.includes('horn') ?? false,
    key: [node.id, choice?.id ?? save.phase, save.line].join(':'),
  };
}
