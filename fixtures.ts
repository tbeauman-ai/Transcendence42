// ============================================================
// TCG Dev Edition — Fixtures de test
// Données réutilisables pour tous les tests
// ============================================================

import {
  HeroDefinition,
  CreatureCard,
  SpellCard,
  GameState,
  PlayerState,
  CreatureOnBoard,
} from './types';

// ------------------------------------------------------------
// Cartes de test
// ------------------------------------------------------------

export const GRUNT: CreatureCard = {
  id: 'grunt',
  name: 'Grunt',
  cost: 2,
  type: 'creature',
  rarity: 'common',
  description: 'Une créature basique sans effet',
  attack: 2,
  defense: 2,
};

export const TANK_CREATURE: CreatureCard = {
  id: 'tank_creature',
  name: 'Tank Creature',
  cost: 4,
  type: 'creature',
  rarity: 'common',
  description: 'Grosse créature défensive',
  attack: 1,
  defense: 6,
};

export const GLASS_CANNON_CREATURE: CreatureCard = {
  id: 'glass_cannon_creature',
  name: 'Glass Cannon',
  cost: 3,
  type: 'creature',
  rarity: 'common',
  description: 'Forte attaque, faible défense',
  attack: 5,
  defense: 1,
};

export const FIREBALL: SpellCard = {
  id: 'fireball',
  name: 'Fireball',
  cost: 3,
  type: 'spell',
  rarity: 'common',
  description: 'Inflige 4 dégâts au joueur adverse',
  effects: [{ type: 'deal_damage', target: 'opponent', value: 4 }],
};

export const HEAL_SPELL: SpellCard = {
  id: 'heal_spell',
  name: 'Heal',
  cost: 2,
  type: 'spell',
  rarity: 'common',
  description: 'Soigne 3 PV',
  effects: [{ type: 'heal', target: 'self', value: 3 }],
};

export const ARMOR_SPELL: SpellCard = {
  id: 'armor_spell',
  name: 'Iron Shield',
  cost: 1,
  type: 'spell',
  rarity: 'common',
  description: 'Génère 3 points d\'armure',
  effects: [{ type: 'gain_armor', target: 'self', value: 3 }],
};

export const DESTROY_SPELL: SpellCard = {
  id: 'destroy_spell',
  name: 'Delete',
  cost: 4,
  type: 'spell',
  rarity: 'common',
  description: 'Détruit une créature ciblée',
  effects: [{ type: 'destroy_creature', target: 'target_creature', value: 0 }],
};

export const DRAW_SPELL: SpellCard = {
  id: 'draw_spell',
  name: 'Stack Overflow',
  cost: 2,
  type: 'spell',
  rarity: 'common',
  description: 'Pioche 2 cartes',
  effects: [{ type: 'draw_card', target: 'self', value: 2 }],
};

// Deck de 30 cartes pour les tests (répétitions volontaires)
const TEST_DECK = [
  ...Array(10).fill(GRUNT),
  ...Array(8).fill(FIREBALL),
  ...Array(6).fill(HEAL_SPELL),
  ...Array(6).fill(ARMOR_SPELL),
];

// ------------------------------------------------------------
// Héros de test
// ------------------------------------------------------------

export const HERO_STANDARD: HeroDefinition = {
  id: 'hero_standard',
  name: 'StandardDev',
  maxHp: 25,
  baseArmor: 0,
  passive: { type: 'bonus_card_draw', value: 0, description: 'Aucun bonus' },
  deck: TEST_DECK,
};

export const HERO_TANK: HeroDefinition = {
  id: 'hero_tank',
  name: 'TankDev',
  maxHp: 30,
  baseArmor: 2,
  passive: { type: 'bonus_armor_per_turn', value: 1, description: '+1 armure/tour' },
  deck: TEST_DECK,
};

export const HERO_GLASS_CANNON: HeroDefinition = {
  id: 'hero_glass_cannon',
  name: 'GlassCannonDev',
  maxHp: 20,
  baseArmor: 0,
  passive: { type: 'bonus_creature_attack', value: 1, description: 'Créatures +1 ATK' },
  deck: TEST_DECK,
};

// ------------------------------------------------------------
// Factory : GameState contrôlé pour les tests
// Évite le hasard de createGame() pour des tests déterministes
// ------------------------------------------------------------

export function makeGameState(overrides: Partial<GameState> = {}): GameState {
  const player1: PlayerState = {
    id: 'p1',
    hero: HERO_STANDARD,
    hp: 25,
    armor: 0,
    mana: 5,
    maxMana: 5,
    hand: [],
    deck: [...TEST_DECK],
    board: [],
    graveyard: [],
  };

  const player2: PlayerState = {
    id: 'p2',
    hero: HERO_STANDARD,
    hp: 25,
    armor: 0,
    mana: 5,
    maxMana: 5,
    hand: [],
    deck: [...TEST_DECK],
    board: [],
    graveyard: [],
  };

  const base: GameState = {
    players: [player1, player2],
    activePlayerIndex: 0,
    turnNumber: 1,
    phase: 'main',
    pendingCombat: [],
    winnerId: null,
    log: [],
  };

  return { ...base, ...overrides };
}

/** Crée une créature sur le terrain, éveillée par défaut */
export function makeCreature(
  overrides: Partial<CreatureOnBoard> = {}
): CreatureOnBoard {
  return {
    instanceId: `test_creature_${Math.random().toString(36).slice(2, 7)}`,
    card: GRUNT,
    ownerId: 'p1',
    currentAttack: 2,
    currentDefense: 2,
    baseDefense: 2,
    isSleeping: false,
    hasAttackedThisTurn: false,
    hasBlockedThisTurn: false,
    ...overrides,
  };
}
