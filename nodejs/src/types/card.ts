import type { Zone, BfZone } from './zones.ts'
import type { EffectType, EffectTarget, EffectTime, TargetType, Effect } from './effects.ts'
import type { Hero } from './hero.ts'

export type CardType = "creature" | "sortilege" | "building";

export type CreatureState = "sick" | "ready";

export type CardClass = "common" | "Warrior" | "Druid";

export type Card = {
    kind: "card";
    zone: Zone;
    effects: Effect[];
    timing: EffectTime;
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

export type PlayCardPayload = {
    cardId: number;
    zone?: Zone;
    target?: Card | Hero;
    target2?: Card;

};