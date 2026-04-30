export type CardType = "creature" | "sortilege" | "building";

export type CreatureState = "sick" | "ready";

export type CardClass = "common" | "Warrior" | "Druid";

export type WaitingPlayer = {
    socket: any;
    playerData: any;
}

export type Zone = 
| "bf1"
| "bf2"
| "bf3"
| "bf4"
| "bf5"
| "bf6"
| "bf7"
| "bf8"
| "hand"
| "library"
| "graveyard";

export type BfZone = 
| "bf1"
| "bf2"
| "bf3"
| "bf4"
| "bf5"
| "bf6"
| "bf7"
| "bf8";

export type EffectType = 
| "ad_mod" 
| "def_mod" 
| "draw" 
| "dmg" 
| "armor" 
| "mana" 
| "swap" 
| "destroy";

export type EffectTarget = 
| "self_hero"       
| "opponent_hero"  
| "self"          
| "left_neighbor" 
| "right_neighbor"
| "all_allies"
| "all_enemies";

export type Effect = {
    effect: EffectType;
    value: number;
    target: EffectTarget;
}

export type Card = {
    kind: "card";
    zone: Zone;
    effects: Effect[];
    type: CardType;
    class: CardClass;
    owner: Hero;
    state: CreatureState;
    runeCost: number;
    idInCollection: number;
    idInGame: number;
    baseForce: number;
    currForce: number;
    baseEndurance: number;
    currEndurance: number;
    cardName: string;
    fullPicPath: string;
    smallPicPath: string;
    cardBackPath: string;
};

export type Hero = {
    kind: "hero";
    idInGame: number;
    class: CardClass;
    passive: Effect;
    armor: number;
    dmgDealt: number;
    curRunes: number;
    battlefield: Partial<Record<BfZone, Card>>;
    library: Card[];
    graveyard: Card[];
    hand: Card[];
    heroPicPath: string;
};

export type GamePhase = "beginning" | "main" | "resolve";

export type Game = {
    kind: "game";
    phase: GamePhase;
    turnNumber: number;
    clock_per_turn: number;
    players: Hero[];
    backgroundPath: string;
};

export type GameSession = {
    game: Game;
    sockets: any[];
    submittedCards: Map<string, any[]>; // socketId : cartes jouées
    timer: ReturnType<typeof setTimeout> | null;
    readyPlayers: Set<string>;  // les socketIds des joueurs qui ont cliqué fin de tour
}