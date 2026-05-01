
export type EffectType = 
| "ad_mod" 
| "def_mod" 
| "draw" 
| "dmg" 
| "armor" 
| "runes" 
| "swap" 
| "destroy"
| "freeze";

export type EffectTime = 
| "immediate"
| "end_of_turn";

export type EffectTarget = 
| "self_hero"       
| "opponent_hero"  
| "self"          
| "left_neighbor" 
| "right_neighbor"
| "all_allies"
| "all_enemies";

export type TargetType = 
| "creature"
| "building"
| "hero"
| "zone";

export type Effect = {
    effect: EffectType;
    value: number;
    target: EffectTarget;
    targetType: TargetType;
}

