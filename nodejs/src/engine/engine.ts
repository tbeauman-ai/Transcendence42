import type { Hero } from '../types/hero.ts'
import type { Card, PlayCardPayload } from '../types/card.ts'
import type { Game } from '../types/gamesession.ts'
import type { Zone, BfZone } from '../types/zones.ts'
import type { Effect } from '../types/effects.ts'

export function fibonacci(n: number): number {
    if (n === 0 || n === 1)
        return 1;
    return fibonacci(n - 1) + fibonacci(n - 2)
}

export function playerDraw(player: Hero, n: number): boolean {
    while (player.library.length > 0 && n--)
        player.hand.push(player.library.pop()!);
    if (player.library.length === 0)
        return (false);
    return (true);
}

export function startTurn(game: Game): void {
    for (const player of game.players) {
        player.curRunes = fibonacci(game.turnNumber);
        playerDraw(player, 8 - player.hand.length);
        resolveEffect(player, player.passive, player);
        resolveBuildings(game);
        checkBoardState(game);

    }
}

export function playCard(card: Card, payload: PlayCardPayload) {

    card.owner.hand = card.owner.hand.filter(c => c.idInGame !== card.idInGame);

    
    if (card.type == "building" || card.type == "creature")
    {
        if (payload.zone && payload.zone.startsWith("bf"))
        {
            card.zone = payload.zone;
            card.owner.battlefield[payload.zone as BfZone] = card;
        }
    }


    for (const effect of card.effects) {
        if (!resolveEffect(card.owner, effect, payload))
            console.log("Resolve effect failed", { cardId: card.idInGame, effect: effect.effect, payload });
    }
}
// p1 deals to p2
export function dealsDmg(player1: Hero, player2: Hero, x: number): void
{
    if (x - player2.armor > 0)
    {
        player2.armor -= x;
    }
    else
    {
        player1.dmgDealt += x - player2.armor;
        player2.armor = 0;
    }

}

export function resolveCombat(game: Game) {
    for (let i = 1; i <= 8 ; i++) {
        const zone = `bf${i}` as BfZone;
        const card0 = game.players[0].battlefield[zone];
        const card1 = game.players[1].battlefield[zone];
        if (card0 === undefined) {
            if (card1 === undefined)
                continue;
            else if (card1.type === "creature")
                dealsDmg(card1.owner, game.players[0], card1.currForce);
        }
        else if (card1 === undefined) {
            if (card0.type === "creature")
                dealsDmg(card0.owner, game.players[0], card0.currForce);
        }
        else if (card0.type == "creature" && card1.type == "creature"){
            // 1 tabasse 0
            if (card0.currEndurance - card1.currForce > 0)
                card0.currEndurance -= card1.currForce
            else
                dealsDmg(card1.owner, game.players[0], card1.currForce - card0.currEndurance);
            // 0 tabasse 1
            if (card1.currEndurance - card0.currForce > 0)
                card1.currEndurance -= card0.currForce
            else
                dealsDmg(card0.owner, game.players[1], card0.currForce - card1.currEndurance);
        }
        else if (card1.type == "creature"){
            game.players[0].dmgDealt += card1.currForce
        }
        else if (card0.type == "creature"){
            game.players[0].dmgDealt += card0.currForce
        }
    }
}

export function resolveBuildings(game:Game) {
    for (let i = 1 ; i <= 8; i++)
    {
        const zone = `bf${i}` as BfZone;
        for (const player of game.players)
            {
            const card0 = player.battlefield[zone];
            if (card0 && card0.type === "building") {
                for (const effect of card0.effects){
                    switch (effect.target) {
                        case "self_hero":
                            resolveEffect(player, effect, player);
                            break;       
                        case "opponent_hero":
                            for (const oppo of game.players)
                            {
                                if (oppo !== player)
                                    resolveEffect(player, effect, oppo);
                            }
                            break;  
                        case "self":
                            resolveEffect(player, effect, card0);
                            break;          
                        case "left_neighbor":
                            if (i === 1)
                                break;
                            const zoneLeftTarget = `bf${i - 1}` as BfZone;
                            const leftTarget = player.battlefield[zoneLeftTarget];
                            if (leftTarget)
                                resolveEffect(player, effect, leftTarget);
                            break; 
                        case "right_neighbor":
                            if (i === 8)
                                break;
                            const zoneRightTarget = `bf${i + 1}` as BfZone;
                            const rightTarget = player.battlefield[zoneRightTarget];
                            if (rightTarget)
                                resolveEffect(player, effect, rightTarget);
                            break;
                        case "all_allies":
                            for (let j = 1 ; j <= 8; j++)
                            {
                                if (j === i)
                                    continue;
                                const nezo = `bf${j}` as BfZone;
                                const ally = player.battlefield[nezo];
                                if (ally)
                                    resolveEffect(player, effect, ally);
                            }
                            break;
                        case "all_enemies":
                            for (let j = 1 ; j <= 8; j++)
                            {
                                const enemyBf = `bf${i}` as BfZone;
                                for (const oppo of game.players){
                                    if (oppo === player)
                                        continue;
                                    const enemy = oppo.battlefield[enemyBf];
                                    if (enemy)
                                        resolveEffect(oppo, effect, enemy);

                                }
                            }
                            break;
                    }
                }
            }
        }

        }
}

export function resolveEffect(
    player: Hero,
    eff: Effect,
    payload: PlayCardPayload): boolean { //succes or failure
    if (!payload.target)
        return false
    switch (eff.effect) {
        case "ad_mod":
            if (payload.target.kind === "hero")
                return false;
            payload.target.currForce += eff.value;
            break;
        case "def_mod":
            if (payload.target.kind === "hero")
                return false;
            payload.target.currEndurance += eff.value;
            break;
        case "draw":
            if (payload.target.kind === "card")
                return false;
            playerDraw(payload.target, eff.value);
            break;
        case "dmg":
            if (payload.target.kind === "hero")
                dealsDmg(player, payload.target, eff.value);
            if (payload.target.kind === "card")
            {
                payload.target.currEndurance -= eff.value;
                if (payload.target.currEndurance < 0)
                {
                    payload.target.zone = "graveyard"
                }
            }
            break;
        case "armor":
            if (payload.target.kind === "card")
                return false;
            payload.target.armor += eff.value;
            break;
        case "runes":
            if (payload.target.kind === "card")
                return false;
            payload.target.curRunes += eff.value;
            break;
        case "swap":
            if (!payload.target2)
                return false;
            if (payload.target.kind === "hero" || payload.target2 === undefined)
                return false;
            const tmp = payload.target.zone;
            payload.target.zone = payload.target2.zone;
            payload.target2.zone = tmp;
            break;
        case "destroy":
            if (payload.target.kind === "hero")
                return false;
            payload.target.currEndurance = 0;
            break;
        case "freeze":
            if (payload.target.kind === "hero")
                return false;
            payload.target.state = "sick";
            break;
    }

    return true;
}

export function checkVictory(game: Game) {
    let max = 0;
    let draw = false;
    for (const player of game.players) {
        if (max === player.dmgDealt)
            draw = true;
        if (max < player.dmgDealt)
            max = player.dmgDealt
    }
    if (draw){
        console.log("draw between ")
        for (const player of game.players) {
            if (max === player.dmgDealt)
                console.log(player.class);
        }
    }
    else    
    {
        for (const player of game.players) {
            if (max === player.dmgDealt)
                console.log(player.class);
        }
        console.log(" wins");
    }
}

export function    checkBoardState(game: Game) {
    for (let i = 1 ; i<= 8 ; i++) {
        const zone = `bf${i}` as BfZone;
        for (const player of game.players) {
            const card = player.battlefield[zone];
            if (card && card.type == "creature" && card.currEndurance <= 0) {
                card.zone = "graveyard";
                player.battlefield[zone] = undefined;
            }
        }
    }
}