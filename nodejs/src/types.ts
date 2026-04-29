type CardType = "creature" | "sortilege" | "building";

type CreatureState = "sick" | "ready";

type CardClass = "common" | "Warrior" | "Druid";

type    Zone = 
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

type EffectType = 
| "ad_mod" 
| "def_mod" 
| "draw" 
| "dmg" 
| "armor" 
| "mana" 
| "swap" 
| "destroy";

type EffectTarget = 
| "self_hero"       
| "opponent_hero"  
| "self"          
| "left_neighbor" 
| "right_neighbor"
| "all_allies"
| "all_enemies";

type Effect = {
    /* A changer, quand on definit une carte on veut pas mettre les cibles dans les effets, ca se fait a la resolution
    affectedCards: Card[];
    swapa: Card;
    swapb: Card;
    */

    effect: EffectType;
    value: number;
    target: EffectTarget;
}

type Card = {
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
    fullPicPath: string; // la carte qu'on voit dans la collection ou dans la main
    smallPicPath: string; // la miniature sur le board
    cardBackPath: string; // la sleeve
};

type Hero = {
    kind: "hero";
    class: CardClass;
    passive: Effect;
    armor: number;
    dmgDealt: number;
    curRunes: number;
    battlefield: Partial<Record<Zone, Card>>;
    library: Card[];
    graveyard: Card[];
    hand: Card[];
    heroPicPath: string;
};

type GamePhase = "beginning" | "main" | "resolve" 

type Game = {
    kind: "game";
    phase: GamePhase;
    turnNumber: number;
    clock_per_turn: number;
    players: Hero[];
    backgroundPath: string;
};