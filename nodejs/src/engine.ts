function fibonacci(n: number): number {
    if (n === 0 || n === 1)
        return 1;
    return fibonacci(n - 1) + fibonacci(n - 2)
}

function playerDraw(player: Hero, n: number): boolean {
    while (player.library.length > 0 && n--)
        player.hand.push(player.library.pop()!);
    if (player.library.length === 0)
        return (false);
    return (true);
}

function startTurn(player: Hero, game: Game): void {
    player.curRunes = fibonacci(game.turnNumber);
    resolveEffect(player, player.passive, player); // fonction a definir
    playerDraw(player, 8 - player.hand.length)
}

function playCard(card: Card, zone?: Zone, target?: Hero | Card, target2?: Card) {
    card.owner.hand = card.owner.hand.filter(c => c.idInGame !== card.idInGame);
    if (card.type == "batiment" || card.type == "creature")
    {
        card.zone = zone;
        card.owner.battlefield[zone!] = card;
    }
    for (effect in card.effects) {
        if (effect.effect === "swap"){
            resolveEffect(card, target, target2);
        }
        else
            resolveEffect(card, target);
    }
}
// p1 deals to p2
function dealsDmg(player1: Hero, player2: Hero, x: number): void
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

function resolveCombat(game: Game) {
    for zone in Zone {
        const card0 = game.players[0].battleground[zone].card;
        const card1 = game.players[1].battleground[zone].card;
        if (card0.type == "creature" && card1.type == "creature"){
            // 1 tabasse 0
            if (card0.currEndurance - card1.currForce > 0)
                card0.currEndurance -= card1.currForce
            else if (card0.currEndurance - card1.currForce === 0)
                card0.zone = "graveyard";
            else {
                card0.zone = "graveyard";
                dealsDmg(card1.owner, game.players[0], card1.currForce - card0.currEndurance);
            }

            // 0 tabasse 1
            if (card1.currEndurance - card0.currForce > 0)
                card1.currEndurance -= card0.currForce
            else if (card1.currEndurance - card0.currForce === 0)
                card0.zone = "graveyard";
            else
            {
                card0.zone = "graveyard";
                dealsDmg(card0.owner, game.players[1], card0.currForce - card1.currEndurance);
            }
        }
        if (card0.type == "batiment" && card1.type == "creature"){
            game.players[0].dmgDealt += card1.currForce
            for eff in card0.effects {
                resolveEffect(eff, target = ask(player[0]), target2?= ask(player[0]));
            }
        }
        if (card1.type == "batiment" && card0.type == "creature"){
            game.players[0].dmgDealt += card0.currForce
            for eff in card1.effects {
                resolveEffect(eff, target = ask(player[1]), target2?= ask(player[1]));
            }
        }
        if (card0.type == "batiment" && card1.type == "batiment"){
            for eff in card0.effects {
                resolveEffect(eff, target = ask(player[0]), target2?= ask(player[0]));
            }
            for eff in card1.effects {
                resolveEffect(eff, target = ask(player[1]), target2?= ask(player[1]));
            }
        }
    }
}

function resolveBuildings(game:Game) {
    
}

function resolveEffect(player: Hero, eff: Effect, target: Hero | Card, target2?: Card): boolean { //succes or failure
    switch (eff.effect) {
        case "ad_mod":
            if (target.kind === "hero")
                return false;
            target.currForce += eff.value;
            break;
        case "def_mod":
            if (target.kind === "hero")
                return false;
            target.currEndurance += eff.value;
            break;
        case "draw":
            if (target.kind === "card")
                return false;
            playerDraw(target, eff.value);
            break;
        case "dmg":
            if (target.kind === "hero")
                dealsDmg(player, target, eff.value);
            if (target.kind === "card")
            {
                target.currEndurance -= eff.value;
                if (target.currEndurance < 0)
                {
                    target.zone = "graveyard"
                }
            }
            break;
        case "armor":
            if (target.kind === "card")
                return false;
            target.armor += eff.value;
            break;
        case "mana":
            if (target.kind === "card")
                return false;
            target.curRunes += eff.value;
            break;
        case "swap":
            if (target.kind === "hero" || target2 === undefined)
                return false;
            const tmp = target.zone;
            target.zone = target2.zone;
            target2.zone = tmp;
            break;
        case "destroy":
            if (target.kind === "hero")
                return false;
            // HELP
            // target.owner.battlefield[zone] = undefined
            target.zone = "graveyard";
            break;
    }

    return true;
}

function checkVictory(game: Game) {
//     let max = 0;
//     let draw = 0;
//     for player in game.players {
//         if (max === player.dmgDealt)
//             draw = 1;
//         if (max < player.dmgDealt)
//             max = player.dmgDealt
//     }
//     if (draw){
//         draw between
//         for each player {
//             if max === player.dmgDealt
//                 display player.nickname
//         }
//     }
//     else    

//     {
//             for each player {
//             if (max === player . dmgDealt)
//                 display player
//         }
//         display wins
//     }
}
        // HELP