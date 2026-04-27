import { createDecipheriv } from "node:crypto";
import { title } from "node:process"
import { zstdCompressSync } from "node:zlib";

type CardType = "creature" | "sortilege" | "batiment";

type CreatureState = "sick" | "ready";

type CardOwner = "common" | "Warrior" | "Druid";

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

type Effects = {
    Card            affectedCards[];
    type Effect = "ad" | "def" | "draw" | "dmg" | "armor" | "mana" | "swap" | "destroy";
    int             value;
    int             value2;
}

type Card = {
    int         runeCost;
    Effects     effects[];
    string      cardName;
    CardType    type;
    CardOwner   owner;
    int         idInCollection;
    int         idInGame;
    Zone        zone;
    Image       fullPic; // la carte qu'on voit dans la collection ou dans la main
    Image       smallPic; // la miniature sur le board
    Image       cardBack; // la sleeve
    int         baseForce;
    int         currForce;
    int         baseEndurance;
    int         currEndurance;
};

type Hero = {
    int         armor;
    Effects     passive;
    int         dmgDealt;
    int         curRunes;
    Card        battlefield[8];
    Card        library[];
    Card        graveyard[];
    Card        hand[];
    Image       heroPic;
};

type Game {
    int         turnNumber;
    time_t      clock_per_turn;
    Hero        Players[];
    Image       background;
};