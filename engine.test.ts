// ============================================================
// TCG Dev Edition — Tests unitaires du moteur
// ============================================================

import {
  createGame,
  startTurn,
  playCard,
  declareAttackers,
  declareBlockers,
  endTurn,
  applyAction,
} from './engine';

import {
  makeGameState,
  makeCreature,
  HERO_STANDARD,
  HERO_TANK,
  HERO_GLASS_CANNON,
  GRUNT,
  FIREBALL,
  HEAL_SPELL,
  ARMOR_SPELL,
  DESTROY_SPELL,
  DRAW_SPELL,
  TANK_CREATURE,
  GLASS_CANNON_CREATURE,
} from './fixtures';

// ============================================================
// INITIALISATION
// ============================================================

describe('createGame', () => {
  test('crée une partie avec deux joueurs', () => {
    const state = createGame('p1', HERO_STANDARD, 'p2', HERO_TANK);
    expect(state.players).toHaveLength(2);
    expect(state.players[0].id).toBe('p1');
    expect(state.players[1].id).toBe('p2');
  });

  test('chaque joueur a 6 cartes en main', () => {
    const state = createGame('p1', HERO_STANDARD, 'p2', HERO_STANDARD);
    expect(state.players[0].hand).toHaveLength(6);
    expect(state.players[1].hand).toHaveLength(6);
  });

  test('chaque joueur a 24 cartes restantes dans le deck (30 - 6)', () => {
    const state = createGame('p1', HERO_STANDARD, 'p2', HERO_STANDARD);
    expect(state.players[0].deck).toHaveLength(24);
    expect(state.players[1].deck).toHaveLength(24);
  });

  test('les PV sont initialisés selon le héros', () => {
    const state = createGame('p1', HERO_STANDARD, 'p2', HERO_TANK);
    expect(state.players[0].hp).toBe(HERO_STANDARD.maxHp); // 25
    expect(state.players[1].hp).toBe(HERO_TANK.maxHp);     // 30
  });

  test('le second joueur commence avec 2 mana (compensation)', () => {
    // On joue 100 parties pour couvrir les deux cas du tirage aléatoire
    let secondPlayerMana2Count = 0;
    for (let i = 0; i < 100; i++) {
      const state = createGame('p1', HERO_STANDARD, 'p2', HERO_STANDARD);
      const secondIdx = state.activePlayerIndex === 0 ? 1 : 0;
      if (state.players[secondIdx].maxMana === 2) secondPlayerMana2Count++;
    }
    expect(secondPlayerMana2Count).toBe(100);
  });

  test('la partie commence en phase start_of_turn', () => {
    const state = createGame('p1', HERO_STANDARD, 'p2', HERO_STANDARD);
    expect(state.phase).toBe('start_of_turn');
  });
});

// ============================================================
// DÉBUT DE TOUR
// ============================================================

describe('startTurn', () => {
  test('passe en phase main', () => {
    const state = makeGameState({ phase: 'start_of_turn' });
    const next = startTurn(state);
    expect(next.phase).toBe('main');
  });

  test('augmente le mana max de 1', () => {
    const state = makeGameState({ phase: 'start_of_turn' });
    const next = startTurn(state);
    expect(next.players[0].maxMana).toBe(6); // était 5
  });

  test('régénère le mana au maximum', () => {
    const state = makeGameState({
      phase: 'start_of_turn',
      players: [
        { ...makeGameState().players[0], mana: 1, maxMana: 5 },
        makeGameState().players[1],
      ],
    });
    const next = startTurn(state);
    expect(next.players[0].mana).toBe(6); // maxMana + 1
  });

  test('reset l\'armure à la valeur de base du héros', () => {
    const state = makeGameState({
      phase: 'start_of_turn',
      players: [
        { ...makeGameState().players[0], hero: HERO_TANK, armor: 10 },
        makeGameState().players[1],
      ],
    });
    const next = startTurn(state);
    expect(next.players[0].armor).toBe(HERO_TANK.baseArmor); // 2
  });

  test('pioche 1 carte', () => {
    const state = makeGameState({ phase: 'start_of_turn' });
    const handSizeBefore = state.players[0].hand.length; // 0
    const next = startTurn(state);
    expect(next.players[0].hand).toHaveLength(handSizeBefore + 1);
  });

  test('réveille les créatures endormies', () => {
    const sleepingCreature = makeCreature({ isSleeping: true, ownerId: 'p1' });
    const state = makeGameState({
      phase: 'start_of_turn',
      players: [
        { ...makeGameState().players[0], board: [sleepingCreature] },
        makeGameState().players[1],
      ],
    });
    const next = startTurn(state);
    expect(next.players[0].board[0].isSleeping).toBe(false);
  });

  test('régénère les PV des créatures à leur baseDefense', () => {
    const damagedCreature = makeCreature({
      currentDefense: 1,
      baseDefense: 4,
      ownerId: 'p1',
    });
    const state = makeGameState({
      phase: 'start_of_turn',
      players: [
        { ...makeGameState().players[0], board: [damagedCreature] },
        makeGameState().players[1],
      ],
    });
    const next = startTurn(state);
    expect(next.players[0].board[0].currentDefense).toBe(4);
  });

  test('défaite si deck vide au moment de piocher', () => {
    const state = makeGameState({
      phase: 'start_of_turn',
      players: [
        { ...makeGameState().players[0], deck: [] },
        makeGameState().players[1],
      ],
    });
    const next = startTurn(state);
    expect(next.phase).toBe('game_over');
    expect(next.winnerId).toBe('p2');
  });
});

// ============================================================
// JOUER UNE CARTE
// ============================================================

describe('playCard — créature', () => {
  test('retire la carte de la main', () => {
    const state = makeGameState({
      players: [
        { ...makeGameState().players[0], hand: [GRUNT], mana: 5 },
        makeGameState().players[1],
      ],
    });
    const next = playCard(state, { type: 'play_card', cardInstanceId: 'grunt' });
    expect(next.players[0].hand).toHaveLength(0);
  });

  test('pose la créature sur le terrain', () => {
    const state = makeGameState({
      players: [
        { ...makeGameState().players[0], hand: [GRUNT], mana: 5 },
        makeGameState().players[1],
      ],
    });
    const next = playCard(state, { type: 'play_card', cardInstanceId: 'grunt' });
    expect(next.players[0].board).toHaveLength(1);
    expect(next.players[0].board[0].card.id).toBe('grunt');
  });

  test('la créature arrive en sommeil', () => {
    const state = makeGameState({
      players: [
        { ...makeGameState().players[0], hand: [GRUNT], mana: 5 },
        makeGameState().players[1],
      ],
    });
    const next = playCard(state, { type: 'play_card', cardInstanceId: 'grunt' });
    expect(next.players[0].board[0].isSleeping).toBe(true);
  });

  test('dépense le mana correct', () => {
    const state = makeGameState({
      players: [
        { ...makeGameState().players[0], hand: [GRUNT], mana: 5 },
        makeGameState().players[1],
      ],
    });
    const next = playCard(state, { type: 'play_card', cardInstanceId: 'grunt' });
    expect(next.players[0].mana).toBe(3); // 5 - 2
  });

  test('refuse si mana insuffisant', () => {
    const state = makeGameState({
      players: [
        { ...makeGameState().players[0], hand: [GRUNT], mana: 1 },
        makeGameState().players[1],
      ],
    });
    expect(() =>
      playCard(state, { type: 'play_card', cardInstanceId: 'grunt' })
    ).toThrow('Mana insuffisant');
  });

  test('refuse si carte absente de la main', () => {
    const state = makeGameState({
      players: [
        { ...makeGameState().players[0], hand: [], mana: 5 },
        makeGameState().players[1],
      ],
    });
    expect(() =>
      playCard(state, { type: 'play_card', cardInstanceId: 'grunt' })
    ).toThrow('introuvable');
  });

  test('le passif bonus_creature_attack s\'applique', () => {
    const state = makeGameState({
      players: [
        {
          ...makeGameState().players[0],
          hero: HERO_GLASS_CANNON, // +1 ATK
          hand: [GRUNT],
          mana: 5,
        },
        makeGameState().players[1],
      ],
    });
    const next = playCard(state, { type: 'play_card', cardInstanceId: 'grunt' });
    expect(next.players[0].board[0].currentAttack).toBe(3); // 2 + 1
  });
});

describe('playCard — sort', () => {
  test('inflige des dégâts au joueur adverse', () => {
    const state = makeGameState({
      players: [
        { ...makeGameState().players[0], hand: [FIREBALL], mana: 5 },
        makeGameState().players[1],
      ],
    });
    const next = playCard(state, { type: 'play_card', cardInstanceId: 'fireball' });
    expect(next.players[1].hp).toBe(21); // 25 - 4
  });

  test('l\'armure absorbe les dégâts d\'un sort', () => {
    const state = makeGameState({
      players: [
        { ...makeGameState().players[0], hand: [FIREBALL], mana: 5 },
        { ...makeGameState().players[1], armor: 2 },
      ],
    });
    const next = playCard(state, { type: 'play_card', cardInstanceId: 'fireball' });
    expect(next.players[1].armor).toBe(0);  // 2 absorbés
    expect(next.players[1].hp).toBe(23);    // 25 - (4 - 2)
  });

  test('soigne sans dépasser les PV max', () => {
    const state = makeGameState({
      players: [
        { ...makeGameState().players[0], hand: [HEAL_SPELL], mana: 5, hp: 24 },
        makeGameState().players[1],
      ],
    });
    const next = playCard(state, { type: 'play_card', cardInstanceId: 'heal_spell' });
    expect(next.players[0].hp).toBe(25); // 24 + 3 = 27, plafonné à 25
  });

  test('génère de l\'armure', () => {
    const state = makeGameState({
      players: [
        { ...makeGameState().players[0], hand: [ARMOR_SPELL], mana: 5, armor: 0 },
        makeGameState().players[1],
      ],
    });
    const next = playCard(state, { type: 'play_card', cardInstanceId: 'armor_spell' });
    expect(next.players[0].armor).toBe(3);
  });

  test('détruit une créature ciblée', () => {
    const target = makeCreature({ instanceId: 'target_001', ownerId: 'p2' });
    const state = makeGameState({
      players: [
        { ...makeGameState().players[0], hand: [DESTROY_SPELL], mana: 5 },
        { ...makeGameState().players[1], board: [target] },
      ],
    });
    const next = playCard(state, {
      type: 'play_card',
      cardInstanceId: 'destroy_spell',
      targetId: 'target_001',
    });
    expect(next.players[1].board).toHaveLength(0);
    expect(next.players[1].graveyard).toHaveLength(1);
  });

  test('pioche des cartes', () => {
    const state = makeGameState({
      players: [
        { ...makeGameState().players[0], hand: [DRAW_SPELL], mana: 5 },
        makeGameState().players[1],
      ],
    });
    const next = playCard(state, { type: 'play_card', cardInstanceId: 'draw_spell' });
    expect(next.players[0].hand).toHaveLength(2); // 0 - 1 (sort joué) + 2 (pioches)
  });

  test('victoire si sort réduit les PV adverses à 0', () => {
    const state = makeGameState({
      players: [
        { ...makeGameState().players[0], hand: [FIREBALL], mana: 5 },
        { ...makeGameState().players[1], hp: 3 },
      ],
    });
    const next = playCard(state, { type: 'play_card', cardInstanceId: 'fireball' });
    expect(next.phase).toBe('game_over');
    expect(next.winnerId).toBe('p1');
  });
});

// ============================================================
// COMBAT
// ============================================================

describe('combat — attaque directe', () => {
  test('une créature éveillée peut attaquer', () => {
    const attacker = makeCreature({ instanceId: 'att_001', ownerId: 'p1' }); // 2/2
    const state = makeGameState({
      players: [
        { ...makeGameState().players[0], board: [attacker] },
        makeGameState().players[1],
      ],
    });
    const s1 = declareAttackers(state, {
      type: 'declare_attackers',
      attackerInstanceIds: ['att_001'],
    });
    const s2 = declareBlockers(s1, { type: 'declare_blockers', assignments: [] });
    expect(s2.players[1].hp).toBe(23); // 25 - 2
  });

  test('une créature endormie ne peut pas attaquer', () => {
    const sleeping = makeCreature({ instanceId: 'sl_001', ownerId: 'p1', isSleeping: true });
    const state = makeGameState({
      players: [
        { ...makeGameState().players[0], board: [sleeping] },
        makeGameState().players[1],
      ],
    });
    expect(() =>
      declareAttackers(state, {
        type: 'declare_attackers',
        attackerInstanceIds: ['sl_001'],
      })
    ).toThrow('endormie');
  });

  test('une créature ne peut attaquer qu\'une fois par tour', () => {
    const attacker = makeCreature({
      instanceId: 'att_001',
      ownerId: 'p1',
      hasAttackedThisTurn: true,
    });
    const state = makeGameState({
      players: [
        { ...makeGameState().players[0], board: [attacker] },
        makeGameState().players[1],
      ],
    });
    expect(() =>
      declareAttackers(state, {
        type: 'declare_attackers',
        attackerInstanceIds: ['att_001'],
      })
    ).toThrow('déjà attaqué');
  });
});

describe('combat — blocage', () => {
  test('une créature éveillée peut bloquer', () => {
    const attacker = makeCreature({ instanceId: 'att_001', ownerId: 'p1' }); // 2/2
    const blocker = makeCreature({ instanceId: 'blk_001', ownerId: 'p2' });  // 2/2
    const state = makeGameState({
      players: [
        { ...makeGameState().players[0], board: [attacker] },
        { ...makeGameState().players[1], board: [blocker] },
      ],
    });
    const s1 = declareAttackers(state, {
      type: 'declare_attackers',
      attackerInstanceIds: ['att_001'],
    });
    const s2 = declareBlockers(s1, {
      type: 'declare_blockers',
      assignments: [{ attackerInstanceId: 'att_001', blockerInstanceIds: ['blk_001'] }],
    });
    // Les deux 2/2 meurent
    expect(s2.players[0].board).toHaveLength(0);
    expect(s2.players[1].board).toHaveLength(0);
    // Aucun dégât au joueur
    expect(s2.players[1].hp).toBe(25);
  });

  test('une créature ENDORMIE peut bloquer (règle clé !)', () => {
    const attacker = makeCreature({ instanceId: 'att_001', ownerId: 'p1' }); // 2/2
    const sleepingBlocker = makeCreature({
      instanceId: 'blk_001',
      ownerId: 'p2',
      isSleeping: true, // endormie mais peut bloquer
    });
    const state = makeGameState({
      players: [
        { ...makeGameState().players[0], board: [attacker] },
        { ...makeGameState().players[1], board: [sleepingBlocker] },
      ],
    });
    const s1 = declareAttackers(state, {
      type: 'declare_attackers',
      attackerInstanceIds: ['att_001'],
    });
    // Ne doit pas throw
    expect(() =>
      declareBlockers(s1, {
        type: 'declare_blockers',
        assignments: [{ attackerInstanceId: 'att_001', blockerInstanceIds: ['blk_001'] }],
      })
    ).not.toThrow();
    // Le joueur ne prend pas de dégâts directs
    const s2 = declareBlockers(s1, {
      type: 'declare_blockers',
      assignments: [{ attackerInstanceId: 'att_001', blockerInstanceIds: ['blk_001'] }],
    });
    expect(s2.players[1].hp).toBe(25);
  });

  test('plusieurs bloqueurs sur un même attaquant', () => {
    // Attaquant 4/4 bloqué par deux 2/2 → les deux bloqueurs meurent, l'attaquant perd 4 DEF
    const attacker = makeCreature({
      instanceId: 'att_001',
      ownerId: 'p1',
      currentAttack: 4,
      currentDefense: 4,
      baseDefense: 4,
    });
    const blocker1 = makeCreature({ instanceId: 'blk_001', ownerId: 'p2' }); // 2/2
    const blocker2 = makeCreature({ instanceId: 'blk_002', ownerId: 'p2' }); // 2/2
    const state = makeGameState({
      players: [
        { ...makeGameState().players[0], board: [attacker] },
        { ...makeGameState().players[1], board: [blocker1, blocker2] },
      ],
    });
    const s1 = declareAttackers(state, {
      type: 'declare_attackers',
      attackerInstanceIds: ['att_001'],
    });
    const s2 = declareBlockers(s1, {
      type: 'declare_blockers',
      assignments: [{
        attackerInstanceId: 'att_001',
        blockerInstanceIds: ['blk_001', 'blk_002'],
      }],
    });
    // Les deux bloqueurs meurent (2 + 2 = 4 dégâts reçus par l'attaquant)
    expect(s2.players[1].board).toHaveLength(0);
    // L'attaquant a reçu 2 + 2 = 4 dégâts → mort aussi
    expect(s2.players[0].board).toHaveLength(0);
    // Pas de dégâts directs
    expect(s2.players[1].hp).toBe(25);
  });

  test('attaque létale si PV adverses tombent à 0', () => {
    const bigAttacker = makeCreature({
      instanceId: 'att_001',
      ownerId: 'p1',
      currentAttack: 30,
    });
    const state = makeGameState({
      players: [
        { ...makeGameState().players[0], board: [bigAttacker] },
        makeGameState().players[1],
      ],
    });
    const s1 = declareAttackers(state, {
      type: 'declare_attackers',
      attackerInstanceIds: ['att_001'],
    });
    const s2 = declareBlockers(s1, { type: 'declare_blockers', assignments: [] });
    expect(s2.phase).toBe('game_over');
    expect(s2.winnerId).toBe('p1');
  });

  test('l\'armure absorbe les dégâts de combat', () => {
    const attacker = makeCreature({ instanceId: 'att_001', ownerId: 'p1' }); // 2/2
    const state = makeGameState({
      players: [
        { ...makeGameState().players[0], board: [attacker] },
        { ...makeGameState().players[1], armor: 2 },
      ],
    });
    const s1 = declareAttackers(state, {
      type: 'declare_attackers',
      attackerInstanceIds: ['att_001'],
    });
    const s2 = declareBlockers(s1, { type: 'declare_blockers', assignments: [] });
    expect(s2.players[1].armor).toBe(0);  // 2 absorbés
    expect(s2.players[1].hp).toBe(25);    // aucun dégât en PV
  });
});

// ============================================================
// FIN DE TOUR
// ============================================================

describe('endTurn', () => {
  test('change le joueur actif', () => {
    const state = makeGameState({ activePlayerIndex: 0 });
    const next = endTurn(state);
    expect(next.activePlayerIndex).toBe(1);
  });

  test('incrémente le numéro de tour', () => {
    const state = makeGameState({ turnNumber: 3 });
    const next = endTurn(state);
    expect(next.turnNumber).toBe(4);
  });

  test('le nouveau joueur actif commence en phase main (après startTurn)', () => {
    const state = makeGameState({
      players: [
        makeGameState().players[0],
        { ...makeGameState().players[1], deck: [...Array(10).fill(GRUNT)] },
      ],
    });
    const next = endTurn(state);
    expect(next.phase).toBe('main');
  });

  test('refuse hors de la phase main', () => {
    const state = makeGameState({ phase: 'declare_blockers' });
    expect(() => endTurn(state)).toThrow();
  });
});

// ============================================================
// PIOCHE — CAS LIMITES
// ============================================================

describe('pioche — cas limites', () => {
  test('main pleine : la carte pioché va au cimetière', () => {
    const fullHand = Array(10).fill(GRUNT);
    const state = makeGameState({
      phase: 'start_of_turn',
      players: [
        { ...makeGameState().players[0], hand: fullHand, deck: [FIREBALL, ...Array(5).fill(GRUNT)] },
        makeGameState().players[1],
      ],
    });
    const next = startTurn(state);
    expect(next.players[0].hand).toHaveLength(10); // toujours 10
    expect(next.players[0].graveyard).toHaveLength(1); // Fireball défaussée
  });
});

// ============================================================
// ARMURE — CAS LIMITES
// ============================================================

describe('armure — cas limites', () => {
  test('armure absorbe exactement les dégâts (0 PV perdus)', () => {
    const state = makeGameState({
      players: [
        { ...makeGameState().players[0], hand: [FIREBALL], mana: 5 },
        { ...makeGameState().players[1], armor: 4, hp: 25 },
      ],
    });
    const next = playCard(state, { type: 'play_card', cardInstanceId: 'fireball' });
    expect(next.players[1].armor).toBe(0);
    expect(next.players[1].hp).toBe(25); // aucun PV perdu
  });

  test('armure reset au début du tour suivant', () => {
    // On génère 3 armures, puis on vérifie le reset au tour suivant
    const state = makeGameState({
      phase: 'start_of_turn',
      players: [
        {
          ...makeGameState().players[0],
          hero: HERO_TANK, // baseArmor = 2
          armor: 99,       // valeur élevée avant reset
          deck: [...Array(10).fill(GRUNT)],
        },
        makeGameState().players[1],
      ],
    });
    const next = startTurn(state);
    expect(next.players[0].armor).toBe(HERO_TANK.baseArmor); // reset à 2
  });
});

// ============================================================
// applyAction — POINT D'ENTRÉE PRINCIPAL
// ============================================================

describe('applyAction', () => {
  test('refuse toute action si la partie est terminée', () => {
    const state = makeGameState({ phase: 'game_over', winnerId: 'p1' });
    expect(() =>
      applyAction(state, { type: 'end_turn' })
    ).toThrow('terminée');
  });

  test('délègue correctement end_turn', () => {
    const state = makeGameState({ phase: 'main' });
    const next = applyAction(state, { type: 'end_turn' });
    expect(next.activePlayerIndex).toBe(1);
  });

  test('délègue correctement play_card', () => {
    const state = makeGameState({
      players: [
        { ...makeGameState().players[0], hand: [GRUNT], mana: 5 },
        makeGameState().players[1],
      ],
    });
    const next = applyAction(state, { type: 'play_card', cardInstanceId: 'grunt' });
    expect(next.players[0].board).toHaveLength(1);
  });
});