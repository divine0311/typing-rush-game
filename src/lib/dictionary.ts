export const dictionary = {
  easy: [
    // 4 letter simple typing words
    'moon', 'star', 'ship', 'beam', 'code',
    'jump', 'dash', 'fire', 'wind', 'blue',
    'dark', 'hero', 'zero', 'time', 'void', 'null', 'data',
    'byte', 'play', 'game', 'rush', 'neon', 'core', 'glow',
    'dust', 'warp', 'grid', 'zone', 'node', 'link', 'flow', 'loop', 'base',
    'chat', 'ping', 'host', 'port', 'hack', 'sync', 'task', 'mode', 'live', 'mute',
    'bird', 'tree', 'rain', 'snow', 'cold', 'warm', 'fast', 'slow'
  ],
  medium: [
    // 5-6 letter spaced, balanced words
    'planet', 'galaxy', 'nebula', 'meteor', 'rocket', 'engine', 'shield', 'plasma',
    'proton', 'matrix', 'system', 'server', 'client', 'router', 'packet', 'stream',
    'buffer', 'memory', 'screen', 'mouse', 'sensor', 'radar', 'target', 'weapon',
    'attack', 'patrol', 'guard', 'scout', 'bomber', 'vector', 'signal', 'energy',
    'portal', 'cosmic', 'arcade', 'orbit', 'beacon', 'hybrid', 'vertex', 'binary',
    'module', 'kernel', 'cyber', 'secure', 'backup'
  ],
  hard: [
    // 7-8 letter words (max 8 letters)
    'starship', 'asteroid', 'universe', 'stardust', 'velocity', 'particle',
    'teleport', 'infinity', 'titanium', 'obsidian', 'starbase', 'synergy',
    'blaster', 'fortress', 'defender', 'invasion', 'alliance', 'vanguard',
    'tactical', 'strategy', 'protocol', 'network', 'storage', 'display',
    'defense', 'fighter', 'cruiser', 'quantum', 'neutron', 'stellar', 'gravity'
  ],
  expert: [
    // 8 letter words with complex typing patterns
    'zealotry', 'quixotic', 'mystique', 'zodiacal', 'symphony', 'rhythmic',
    'xylocarp', 'vocalize', 'schedule', 'maximize', 'jeopardy', 'frequent',
    'dynamite', 'cytology', 'buzzword', 'blizzard', 'aquarium', 'adjacent',
    'absolute', 'abducted', 'wildfire', 'monolith', 'sabotage', 'override'
  ]
};

class WordGenerator {
  private decks: Record<string, string[]> = {
    easy: [],
    medium: [],
    hard: [],
    expert: []
  };

  public getWord(difficulty: 'easy' | 'medium' | 'hard' | 'expert'): string {
    if (this.decks[difficulty].length === 0) {
      this.decks[difficulty] = [...dictionary[difficulty]].sort(() => Math.random() - 0.5);
    }
    return this.decks[difficulty].pop()!;
  }
}

export const wordGen = new WordGenerator();

export function getRandomWord(difficulty: 'easy' | 'medium' | 'hard' | 'expert'): string {
  return wordGen.getWord(difficulty);
}

export function getBossWord(): string {
  // Return an 8-character expert word
  return getRandomWord('expert').substring(0, 8);
}
