// ============================================================
// TCG Dev Edition — Moteur de jeu
// ============================================================
// Principe fondamental : toutes les fonctions sont PURES.
// Elles reçoivent un GameState, retournent un nouveau GameState.
// Elles ne modifient jamais l'état original (immutabilité).
// Le serveur est la seule source de vérité.
// ============================================================

import {
  GameState,
  PlayerState,
  CreatureOnBoard,
  CombatPairing,
  CardEffect,
  Card,
  CreatureCard,
  PlayerAction,
  PlayCardAction,
  DeclareAttackersAction,
  DeclareBlockersAction,
  GameLogEntry,
  LogActionType,
} from './types';

// ------------------------------------------------------------
// Utilitaires internes
// ------------------------------------------------------------

/** Copie profonde d'un état (évite les mutations accidentelles) */
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/** Ajoute une entrée dans le log de la partie */
function addLog(
  state: GameState,
  action: LogActionType,
  description: string
): GameState {
  const entry: GameLogEntry = {
    turn: state.turnNumber,
    playerId: state.players[state.activePlayerIndex].id,
    action,
    description,
  };
  return { ...state, log: [...state.log, entry] };
}

/** Retourne le joueur actif et son adversaire */
function getPlayers(state: GameState): {
  active: PlayerState;
  opponent: PlayerState;
  activeIndex: 0 | 1;
  opponentIndex: 0 | 1;
} {
  const activeIndex = state.activePlayerIndex;
  const opponentIndex: 0 | 1 = activeIndex === 0 ? 1 : 0;
  return {
    active: state.players[activeIndex],
    opponent: state.players[opponentIndex],
    activeIndex,
    opponentIndex,
  };
}

/** Génère un ID d'instance unique pour une créature sur le terrain */
function generateInstanceId(): string {
  return `creature_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ------------------------------------------------------------
// Initialisation de la partie
// ------------------------------------------------------------

/**
 * Mélange un tableau (algorithme Fisher-Yates)
 * Retourne un nouveau tableau mélangé sans modifier l'original
 */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Initialise l'état d'un joueur au début de la partie.
 * Mélange le deck, distribue la main de départ, applique le passif de mana.
 */
function initPlayerState(
  playerId: string,
  hero: PlayerState['hero'],
  isFirstPlayer: boolean
): PlayerState {
  const shuffledDeck = shuffle([...hero.deck]);

  // Le passif bonus_starting_mana donne du mana max supplémentaire dès le départ
  const bonusMana =
    hero.passive.type === 'bonus_starting_mana' ? hero.passive.value : 0;

  // Le premier joueur commence avec 1 mana, le second avec 2 (avantage compensatoire)
  const startingMaxMana = (isFirstPlayer ? 1 : 2) + bonusMana;

  // Distribution de la main de départ (6 cartes)
  const hand = shuffledDeck.slice(0, 6);
  const deck = shuffledDeck.slice(6);

  return {
    id: playerId,
    hero,
    hp: hero.maxHp,
    armor: hero.baseArmor,
    mana: startingMaxMana,
    maxMana: startingMaxMana,
    hand,
    deck,
    board: [],
    graveyard: [],
  };
}

/**
 * Crée un GameState initial à partir des deux héros choisis.
 * Le premier joueur est tiré au sort.
 */
export function createGame(
  player1Id: string,
  player1Hero: PlayerState['hero'],
  player2Id: string,
  player2Hero: PlayerState['hero']
): GameState {
  const firstPlayerIndex: 0 | 1 = Math.random() < 0.5 ? 0 : 1;

  const players: [PlayerState, PlayerState] = [
    initPlayerState(player1Id, player1Hero, firstPlayerIndex === 0),
    initPlayerState(player2Id, player2Hero, firstPlayerIndex === 1),
  ];

  const state: GameState = {
    players,
    activePlayerIndex: firstPlayerIndex,
    turnNumber: 1,
    phase: 'start_of_turn',
    pendingCombat: [],
    winnerId: null,
    log: [],
  };

  return addLog(state, 'turn_started', `La partie commence ! C'est au tour de ${players[firstPlayerIndex].hero.name}`);
}

// ------------------------------------------------------------
// Début de tour
// ------------------------------------------------------------

/**
 * Résout toutes les actions de début de tour :
 * reset armure, +1 mana max, régénération mana, pioche, réveil des créatures.
 */
export function startTurn(state: GameState): GameState {
  let s = deepClone(state);
  const { active, activeIndex } = getPlayers(s);
  const player = s.players[activeIndex];

  // 1. Reset de l'armure à la valeur de base du héros
  player.armor = player.hero.baseArmor;

  // 2. +1 mana maximum (pas de plafond)
  player.maxMana += 1;

  // 3. Régénération complète du mana
  player.mana = player.maxMana;

  // 4. Pioche (1 carte + bonus passif éventuel)
  const drawCount =
    player.hero.passive.type === 'bonus_card_draw'
      ? 1 + player.hero.passive.value
      : 1;

  s = drawCards(s, activeIndex, drawCount);

  // Si le deck était vide, la partie est terminée — on arrête ici
  if (s.phase === 'game_over') return s;

  // 5. Réveil des créatures endormies
  s.players[activeIndex].board = s.players[activeIndex].board.map((c) => ({
    ...c,
    isSleeping: false,
    hasAttackedThisTurn: false,
    hasBlockedThisTurn: false,
  }));

  // 6. Régénération des PV des créatures (reset à leur baseDefense)
  s.players[activeIndex].board = s.players[activeIndex].board.map((c) => ({
    ...c,
    currentDefense: c.baseDefense,
  }));

  s.phase = 'main';

  return addLog(s, 'turn_started', `Tour ${s.turnNumber} — ${active.hero.name}`);
}

// ------------------------------------------------------------
// Pioche
// ------------------------------------------------------------

/**
 * Fait piocher N cartes à un joueur.
 * Si le deck est vide → défaite immédiate.
 * Si la main est pleine → la carte est retirée de la partie (défaussée silencieusement).
 */
function drawCards(
  state: GameState,
  playerIndex: 0 | 1,
  count: number
): GameState {
  let s = deepClone(state);

  for (let i = 0; i < count; i++) {
    const player = s.players[playerIndex];

    // Deck vide → défaite
    if (player.deck.length === 0) {
      s.winnerId = s.players[playerIndex === 0 ? 1 : 0].id;
      s.phase = 'game_over';
      s = addLog(s, 'game_over', `${player.hero.name} n'a plus de cartes — défaite !`);
      return s;
    }

    // On prend la première carte du deck
    const [drawn, ...rest] = player.deck;
    player.deck = rest;

    // Main pleine → carte retirée de la partie
    if (player.hand.length >= 10) {
      player.graveyard = [...player.graveyard, drawn];
      s = addLog(s, 'card_drawn', `Main pleine — ${drawn.name} est retirée de la partie`);
    } else {
      player.hand = [...player.hand, drawn];
      s = addLog(s, 'card_drawn', `${player.hero.name} pioche ${drawn.name}`);
    }
  }

  return s;
}

// ------------------------------------------------------------
// Jouer une carte
// ------------------------------------------------------------

/**
 * Point d'entrée pour jouer une carte depuis la main.
 * Valide l'action, puis délègue à playCreature ou playSpell.
 */
export function playCard(state: GameState, action: PlayCardAction): GameState {
  // Vérifications de base
  if (state.phase !== 'main') {
    throw new Error('Impossible de jouer une carte hors de la phase principale');
  }

  const { active, activeIndex } = getPlayers(state);

  // Trouver la carte dans la main (par son id — on cherche la première occurrence)
  const cardIndex = active.hand.findIndex((c) => c.id === action.cardInstanceId);
  if (cardIndex === -1) {
    throw new Error(`Carte ${action.cardInstanceId} introuvable dans la main`);
  }

  const card = active.hand[cardIndex];

  // Vérifier le mana
  if (card.cost > active.mana) {
    throw new Error(`Mana insuffisant (coût: ${card.cost}, disponible: ${active.mana})`);
  }

  // Retirer la carte de la main et dépenser le mana
  let s = deepClone(state);
  s.players[activeIndex].hand = [
    ...s.players[activeIndex].hand.slice(0, cardIndex),
    ...s.players[activeIndex].hand.slice(cardIndex + 1),
  ];
  s.players[activeIndex].mana -= card.cost;

  // Déléguer selon le type de carte
  if (card.type === 'creature') {
    return playCreature(s, activeIndex, card);
  } else {
    return playSpell(s, activeIndex, card, action.targetId);
  }
}

/** Pose une créature sur le terrain en état de sommeil */
function playCreature(
  state: GameState,
  playerIndex: 0 | 1,
  card: CreatureCard
): GameState {
  let s = deepClone(state);
  const player = s.players[playerIndex];

  // Appliquer le passif bonus_creature_attack si applicable
  const attackBonus =
    player.hero.passive.type === 'bonus_creature_attack'
      ? player.hero.passive.value
      : 0;

  const creature: CreatureOnBoard = {
    instanceId: generateInstanceId(),
    card,
    ownerId: player.id,
    currentAttack: card.attack + attackBonus,
    currentDefense: card.defense,
    baseDefense: card.defense,
    isSleeping: true,        // tour de sommeil
    hasAttackedThisTurn: false,
    hasBlockedThisTurn: false,
  };

  s.players[playerIndex].board = [...player.board, creature];

  // Appliquer les effets éventuels de la créature (cri de guerre, etc.)
  if (card.effects && card.effects.length > 0) {
    s = applyEffects(s, playerIndex, card.effects, undefined);
  }

  return addLog(s, 'play_creature', `${player.hero.name} joue ${card.name} (${card.attack}/${card.defense})`);
}

/** Joue un sort et applique ses effets immédiatement */
function playSpell(
  state: GameState,
  playerIndex: 0 | 1,
  card: import('./types').SpellCard,
  targetId?: string
): GameState {
  let s = deepClone(state);
  const player = s.players[playerIndex];

  // Appliquer les effets
  s = applyEffects(s, playerIndex, card.effects, targetId);

  // Le sort va au cimetière
  s.players[playerIndex].graveyard = [...s.players[playerIndex].graveyard, card];

  s = addLog(s, 'play_spell', `${player.hero.name} joue le sort ${card.name}`);

  // Vérifier les conditions de victoire après un sort
  return checkWinCondition(s);
}

// ------------------------------------------------------------
// Application des effets
// ------------------------------------------------------------

/**
 * Applique une liste d'effets de carte.
 * targetId est l'instanceId de la créature ciblée (si applicable).
 */
function applyEffects(
  state: GameState,
  casterIndex: 0 | 1,
  effects: CardEffect[],
  targetId?: string
): GameState {
  let s = deepClone(state);
  const opponentIndex: 0 | 1 = casterIndex === 0 ? 1 : 0;

  for (const effect of effects) {
    switch (effect.type) {

      case 'deal_damage': {
        if (effect.target === 'opponent') {
          s = dealDamageToPlayer(s, opponentIndex, effect.value);
        } else if (effect.target === 'self') {
          s = dealDamageToPlayer(s, casterIndex, effect.value);
        } else if (effect.target === 'target_creature' && targetId) {
          s = dealDamageToCreature(s, targetId, effect.value);
        } else if (effect.target === 'all_creatures') {
          // Inflige des dégâts à toutes les créatures des deux joueurs
          const allIds = [
            ...s.players[0].board.map((c) => c.instanceId),
            ...s.players[1].board.map((c) => c.instanceId),
          ];
          for (const id of allIds) {
            s = dealDamageToCreature(s, id, effect.value);
          }
        } else if (effect.target === 'own_creatures') {
          const ownIds = s.players[casterIndex].board.map((c) => c.instanceId);
          for (const id of ownIds) {
            s = dealDamageToCreature(s, id, effect.value);
          }
        }
        break;
      }

      case 'heal': {
        if (effect.target === 'self') {
          const player = s.players[casterIndex];
          // On ne peut pas dépasser les PV max
          player.hp = Math.min(player.hp + effect.value, player.hero.maxHp);
        } else if (effect.target === 'opponent') {
          const player = s.players[opponentIndex];
          player.hp = Math.min(player.hp + effect.value, player.hero.maxHp);
        }
        break;
      }

      case 'gain_armor': {
        const targetIndex = effect.target === 'opponent' ? opponentIndex : casterIndex;
        s.players[targetIndex].armor += effect.value;
        break;
      }

      case 'buff_attack': {
        if (effect.target === 'target_creature' && targetId) {
          s = buffCreature(s, targetId, effect.value, 0);
        } else if (effect.target === 'own_creatures') {
          for (const c of s.players[casterIndex].board) {
            s = buffCreature(s, c.instanceId, effect.value, 0);
          }
        }
        break;
      }

      case 'buff_defense': {
        if (effect.target === 'target_creature' && targetId) {
          s = buffCreature(s, targetId, 0, effect.value);
        } else if (effect.target === 'own_creatures') {
          for (const c of s.players[casterIndex].board) {
            s = buffCreature(s, c.instanceId, 0, effect.value);
          }
        }
        break;
      }

      case 'draw_card': {
        s = drawCards(s, casterIndex, effect.value);
        break;
      }

      case 'destroy_creature': {
        if (targetId) {
          s = killCreature(s, targetId);
        }
        break;
      }
    }
  }

  return s;
}

// ------------------------------------------------------------
// Dégâts et mort des créatures
// ------------------------------------------------------------

/** Inflige des dégâts à un joueur (armure absorbée en premier) */
function dealDamageToPlayer(
  state: GameState,
  playerIndex: 0 | 1,
  damage: number
): GameState {
  let s = deepClone(state);
  const player = s.players[playerIndex];

  const armorAbsorbed = Math.min(player.armor, damage);
  const remainingDamage = damage - armorAbsorbed;

  player.armor -= armorAbsorbed;
  player.hp -= remainingDamage;

  s = addLog(
    s,
    'damage_dealt',
    `${player.hero.name} subit ${damage} dégâts (${armorAbsorbed} absorbés par l'armure) → ${player.hp} PV`
  );

  return s;
}

/** Inflige des dégâts à une créature et la tue si nécessaire */
function dealDamageToCreature(
  state: GameState,
  instanceId: string,
  damage: number
): GameState {
  let s = deepClone(state);

  // Trouver la créature sur l'un ou l'autre des terrains
  for (const playerIndex of [0, 1] as const) {
    const idx = s.players[playerIndex].board.findIndex(
      (c) => c.instanceId === instanceId
    );
    if (idx !== -1) {
      s.players[playerIndex].board[idx].currentDefense -= damage;

      if (s.players[playerIndex].board[idx].currentDefense <= 0) {
        s = killCreature(s, instanceId);
      }
      return s;
    }
  }

  return s; // créature introuvable (déjà morte), on ignore
}

/** Envoie une créature au cimetière */
function killCreature(state: GameState, instanceId: string): GameState {
  let s = deepClone(state);

  for (const playerIndex of [0, 1] as const) {
    const idx = s.players[playerIndex].board.findIndex(
      (c) => c.instanceId === instanceId
    );
    if (idx !== -1) {
      const dead = s.players[playerIndex].board[idx];
      s.players[playerIndex].board = s.players[playerIndex].board.filter(
        (c) => c.instanceId !== instanceId
      );
      s.players[playerIndex].graveyard = [
        ...s.players[playerIndex].graveyard,
        dead.card,
      ];
      s = addLog(s, 'creature_died', `${dead.card.name} est détruite`);
      return s;
    }
  }

  return s;
}

/** Applique un buff d'attaque et/ou de défense à une créature */
function buffCreature(
  state: GameState,
  instanceId: string,
  attackBuff: number,
  defenseBuff: number
): GameState {
  let s = deepClone(state);

  for (const playerIndex of [0, 1] as const) {
    const idx = s.players[playerIndex].board.findIndex(
      (c) => c.instanceId === instanceId
    );
    if (idx !== -1) {
      s.players[playerIndex].board[idx].currentAttack += attackBuff;
      s.players[playerIndex].board[idx].currentDefense += defenseBuff;
      s.players[playerIndex].board[idx].baseDefense += defenseBuff; // le buff persiste au reset
      return s;
    }
  }

  return s;
}

// ------------------------------------------------------------
// Combat
// ------------------------------------------------------------

/**
 * Le joueur actif déclare ses attaquants.
 * Passe en phase declare_blockers et enregistre les pairings en attente.
 */
export function declareAttackers(
  state: GameState,
  action: DeclareAttackersAction
): GameState {
  if (state.phase !== 'main') {
    throw new Error('Les attaques ne peuvent être déclarées que pendant la phase principale');
  }

  const { active, activeIndex } = getPlayers(state);

  // Valider chaque attaquant
  const attackers: CreatureOnBoard[] = [];
  for (const id of action.attackerInstanceIds) {
    const creature = active.board.find((c) => c.instanceId === id);
    if (!creature) throw new Error(`Créature ${id} introuvable sur le terrain`);
    if (creature.isSleeping) throw new Error(`${creature.card.name} est endormie et ne peut pas attaquer`);
    if (creature.hasAttackedThisTurn) throw new Error(`${creature.card.name} a déjà attaqué ce tour`);
    attackers.push(creature);
  }

  // Créer les pairings (sans bloqueurs pour l'instant)
  const pendingCombat: CombatPairing[] = attackers.map((attacker) => ({
    attacker,
    blockers: [],
  }));

  let s = deepClone(state);
  // Marquer les attaquants
  for (const id of action.attackerInstanceIds) {
    const idx = s.players[activeIndex].board.findIndex((c) => c.instanceId === id);
    if (idx !== -1) s.players[activeIndex].board[idx].hasAttackedThisTurn = true;
  }

  s.pendingCombat = pendingCombat;
  s.phase = 'declare_blockers';

  return addLog(
    s,
    'attack_declared',
    `${active.hero.name} déclare ${attackers.length} attaquant(s) : ${attackers.map((a) => a.card.name).join(', ')}`
  );
}

/**
 * Le joueur défenseur déclare ses bloqueurs.
 * Puis résout immédiatement le combat.
 */
export function declareBlockers(
  state: GameState,
  action: DeclareBlockersAction
): GameState {
  if (state.phase !== 'declare_blockers') {
    throw new Error("Ce n'est pas le moment de déclarer des bloqueurs");
  }

  const { opponentIndex } = getPlayers(state);
  const defender = state.players[opponentIndex];

  let s = deepClone(state);

  // Assigner les bloqueurs à chaque attaquant
  for (const assignment of action.assignments) {
    const pairingIdx = s.pendingCombat.findIndex(
      (p) => p.attacker.instanceId === assignment.attackerInstanceId
    );
    if (pairingIdx === -1) continue;

    const blockers: CreatureOnBoard[] = [];
    for (const blockerId of assignment.blockerInstanceIds) {
      const blocker = defender.board.find((c) => c.instanceId === blockerId);
      if (!blocker) throw new Error(`Bloqueur ${blockerId} introuvable`);
      if (blocker.hasBlockedThisTurn) throw new Error(`${blocker.card.name} bloque déjà`);
      blockers.push(blocker);

      // Marquer le bloqueur
      const idx = s.players[opponentIndex].board.findIndex((c) => c.instanceId === blockerId);
      if (idx !== -1) s.players[opponentIndex].board[idx].hasBlockedThisTurn = true;
    }

    s.pendingCombat[pairingIdx].blockers = blockers;
  }

  s = addLog(s, 'block_declared', `${defender.hero.name} déclare ses bloqueurs`);
  s.phase = 'resolve_combat';

  // Résoudre le combat immédiatement
  return resolveCombat(s);
}

/**
 * Résout tous les combats en attente.
 * Les dégâts sont simultanés.
 */
function resolveCombat(state: GameState): GameState {
  let s = deepClone(state);
  const { activeIndex, opponentIndex } = getPlayers(s);

  for (const pairing of s.pendingCombat) {
    // Récupérer l'attaquant à jour (peut avoir été modifié)
    const attacker = findCreature(s, pairing.attacker.instanceId);
    if (!attacker) continue; // déjà mort

    if (pairing.blockers.length === 0) {
      // ── Attaque directe au joueur ──
      s = dealDamageToPlayer(s, opponentIndex, attacker.currentAttack);
    } else {
      // ── Combat avec bloqueurs ──
      // L'attaquant répartit ses dégâts sur les bloqueurs (ordre de la liste)
      let remainingAttack = attacker.currentAttack;
      let totalCounterDamage = 0;

      for (const blockerRef of pairing.blockers) {
        const blocker = findCreature(s, blockerRef.instanceId);
        if (!blocker) continue;

        // L'attaquant inflige ses dégâts au bloqueur
        const damageToBlocker = Math.min(remainingAttack, blocker.currentDefense);
        remainingAttack -= damageToBlocker;
        s = dealDamageToCreature(s, blocker.instanceId, damageToBlocker);

        // Le bloqueur contre-attaque sur l'attaquant
        totalCounterDamage += blocker.currentAttack;
      }

      // Appliquer les dégâts de contre-attaque à l'attaquant
      if (totalCounterDamage > 0) {
        s = dealDamageToCreature(s, attacker.instanceId, totalCounterDamage);
      }
    }
  }

  // Nettoyer les combats résolus
  s.pendingCombat = [];
  s.phase = 'main';

  s = addLog(s, 'combat_resolved', 'Combat résolu');

  return checkWinCondition(s);
}

/** Trouve une créature sur n'importe quel terrain */
function findCreature(
  state: GameState,
  instanceId: string
): CreatureOnBoard | undefined {
  for (const player of state.players) {
    const found = player.board.find((c) => c.instanceId === instanceId);
    if (found) return found;
  }
  return undefined;
}

// ------------------------------------------------------------
// Fin de tour
// ------------------------------------------------------------

/**
 * Le joueur actif passe la main.
 * Change le joueur actif et déclenche le début du tour suivant.
 */
export function endTurn(state: GameState): GameState {
  if (state.phase !== 'main') {
    throw new Error('Impossible de terminer le tour hors de la phase principale');
  }

  let s = deepClone(state);
  const { active } = getPlayers(s);

  s = addLog(s, 'turn_ended', `${active.hero.name} termine son tour`);

  // Changer de joueur actif
  s.activePlayerIndex = s.activePlayerIndex === 0 ? 1 : 0;
  s.turnNumber += 1;
  s.phase = 'start_of_turn';

  // Lancer le début du tour du nouveau joueur actif
  return startTurn(s);
}

// ------------------------------------------------------------
// Condition de victoire
// ------------------------------------------------------------

/** Vérifie si la partie est terminée après chaque action */
function checkWinCondition(state: GameState): GameState {
  let s = deepClone(state);

  for (const playerIndex of [0, 1] as const) {
    const player = s.players[playerIndex];
    if (player.hp <= 0) {
      const winnerId = s.players[playerIndex === 0 ? 1 : 0].id;
      s.winnerId = winnerId;
      s.phase = 'game_over';
      s = addLog(
        s,
        'game_over',
        `${player.hero.name} est à 0 PV — ${s.players[playerIndex === 0 ? 1 : 0].hero.name} remporte la partie !`
      );
      return s;
    }
  }

  return s;
}

// ------------------------------------------------------------
// Point d'entrée principal
// ------------------------------------------------------------

/**
 * Fonction principale : reçoit une action joueur, valide et applique.
 * C'est cette fonction que le serveur appelle à chaque action reçue.
 */
export function applyAction(state: GameState, action: PlayerAction): GameState {
  // La partie est terminée, on n'accepte plus d'actions
  if (state.phase === 'game_over') {
    throw new Error('La partie est terminée');
  }

  switch (action.type) {
    case 'play_card':
      return playCard(state, action);
    case 'declare_attackers':
      return declareAttackers(state, action);
    case 'declare_blockers':
      return declareBlockers(state, action);
    case 'end_turn':
      return endTurn(state);
    default:
      throw new Error(`Action inconnue`);
  }
}