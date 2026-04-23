// ============================================================
// TCG Dev Edition — Types & Interfaces
// ============================================================

// ------------------------------------------------------------
// Cartes
// ------------------------------------------------------------

export type CardType = 'creature' | 'spell';
export type CardRarity = 'common' | 'exclusive';

interface CardBase {
  id: string;           // identifiant unique de la carte (ex: "fireball_01")
  name: string;
  cost: number;         // coût en mana
  type: CardType;
  rarity: CardRarity;   // 'common' = partagée, 'exclusive' = propre au perso
  description: string;
}

export interface CreatureCard extends CardBase {
  type: 'creature';
  attack: number;
  defense: number;
  effects?: CardEffect[];
}

export interface SpellCard extends CardBase {
  type: 'spell';
  effects: CardEffect[];
}

export type Card = CreatureCard | SpellCard;

// ------------------------------------------------------------
// Effets de cartes
// ------------------------------------------------------------

export type EffectType =
  | 'deal_damage'       // inflige des dégâts à une cible
  | 'heal'              // soigne une cible
  | 'gain_armor'        // génère de l'armure temporaire
  | 'buff_attack'       // donne +X/+0 à une créature
  | 'buff_defense'      // donne +0/+X à une créature
  | 'draw_card'         // fait piocher des cartes
  | 'destroy_creature'; // détruit une créature ciblée

export type EffectTarget =
  | 'opponent'          // le joueur adverse
  | 'self'              // le joueur qui joue la carte
  | 'target_creature'   // une créature ciblée
  | 'all_creatures'     // toutes les créatures sur le terrain
  | 'own_creatures';    // toutes les créatures du joueur

export interface CardEffect {
  type: EffectType;
  target: EffectTarget;
  value: number;
}

// ------------------------------------------------------------
// Créatures en jeu (instance sur le terrain)
// ------------------------------------------------------------

export interface CreatureOnBoard {
  instanceId: string;       // ID unique de l'instance (différent de card.id)
  card: CreatureCard;
  ownerId: string;          // ID du joueur propriétaire
  currentAttack: number;    // peut être modifié par des buffs
  currentDefense: number;   // valeur courante (reset à chaque tour)
  baseDefense: number;      // valeur de base de la carte
  isSleeping: boolean;      // true = posée ce tour, ne peut pas attaquer
  hasAttackedThisTurn: boolean;
  hasBlockedThisTurn: boolean;
}

// ------------------------------------------------------------
// Personnages
// ------------------------------------------------------------

export type PassiveType =
  | 'bonus_armor_per_turn'    // régénère X armure en plus chaque tour
  | 'bonus_creature_attack'   // toutes les créatures ont +X en attaque
  | 'bonus_starting_mana'     // commence avec X mana supplémentaire
  | 'bonus_card_draw';        // pioche X cartes supplémentaires par tour

export interface Passive {
  type: PassiveType;
  value: number;
  description: string;
}

export interface HeroDefinition {
  id: string;
  name: string;
  maxHp: number;
  baseArmor: number;    // armure régénérée au début de chaque tour
  passive: Passive;
  deck: Card[];         // les 30 cartes du deck pré-construit
}

// ------------------------------------------------------------
// État d'un joueur en cours de partie
// ------------------------------------------------------------

export interface PlayerState {
  id: string;
  hero: HeroDefinition;
  hp: number;
  armor: number;            // armure courante (peut être > baseArmor grâce aux cartes)
  mana: number;             // mana disponible ce tour
  maxMana: number;          // mana maximum atteint (augmente de 1/tour)
  hand: Card[];             // cartes en main (max 10)
  deck: Card[];             // cartes restantes dans le deck (mélangé)
  board: CreatureOnBoard[]; // créatures sur le terrain
  graveyard: Card[];        // cartes défaussées/détruites
}

// ------------------------------------------------------------
// État global de la partie
// ------------------------------------------------------------

export type GamePhase =
  | 'setup'             // initialisation
  | 'start_of_turn'     // début de tour (reset armure, mana, pioche)
  | 'main'              // phase principale (jouer cartes, attaquer)
  | 'declare_attackers' // le joueur déclare ses attaquants
  | 'declare_blockers'  // l'adversaire déclare ses bloqueurs
  | 'resolve_combat'    // résolution des combats
  | 'end_of_turn'       // fin de tour
  | 'game_over';        // partie terminée

export interface CombatPairing {
  attacker: CreatureOnBoard;
  blockers: CreatureOnBoard[];  // vide = attaque directe au joueur
}

export interface GameState {
  players: [PlayerState, PlayerState];
  activePlayerIndex: 0 | 1;    // index du joueur dont c'est le tour
  turnNumber: number;
  phase: GamePhase;
  pendingCombat: CombatPairing[];  // combats déclarés en attente de résolution
  winnerId: string | null;
  log: GameLogEntry[];             // historique des actions
}

// ------------------------------------------------------------
// Log des actions
// ------------------------------------------------------------

export type LogActionType =
  | 'play_creature'
  | 'play_spell'
  | 'attack_declared'
  | 'block_declared'
  | 'combat_resolved'
  | 'damage_dealt'
  | 'creature_died'
  | 'card_drawn'
  | 'turn_started'
  | 'turn_ended'
  | 'game_over';

export interface GameLogEntry {
  turn: number;
  playerId: string;
  action: LogActionType;
  description: string;  // texte lisible ex: "Alice joue Firewall (3 dégâts)"
}

// ------------------------------------------------------------
// Actions joueur (ce que le client envoie au serveur)
// ------------------------------------------------------------

export type PlayerActionType =
  | 'play_card'
  | 'declare_attackers'
  | 'declare_blockers'
  | 'end_turn';

export interface PlayCardAction {
  type: 'play_card';
  cardInstanceId: string;   // ID de la carte en main
  targetId?: string;        // ID de la cible (créature ou joueur) si nécessaire
}

export interface DeclareAttackersAction {
  type: 'declare_attackers';
  attackerInstanceIds: string[];
}

export interface DeclareBlockersAction {
  type: 'declare_blockers';
  // Pour chaque attaquant, la liste des bloqueurs assignés
  assignments: {
    attackerInstanceId: string;
    blockerInstanceIds: string[];
  }[];
}

export interface EndTurnAction {
  type: 'end_turn';
}

export type PlayerAction =
  | PlayCardAction
  | DeclareAttackersAction
  | DeclareBlockersAction
  | EndTurnAction;