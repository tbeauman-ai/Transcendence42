
import type { Hero } from './hero.ts'

export type WaitingPlayer = {
    socket: any;
    playerData: any;
}

export type GameSession = {
    game: Game;
    sockets: any[];
    submittedCards: Map<string, any[]>; // socketId : cartes jouées
    timer: ReturnType<typeof setTimeout> | null;
    readyPlayers: Set<string>;  // les socketIds des joueurs qui ont cliqué fin de tour
}

export type GamePhase = "beginning" | "main" | "resolve";

export type Game = {
    kind: "game";
    phase: GamePhase;
    turnNumber: number;
    clock_per_turn: number;
    players: Hero[];
    backgroundPath: string;
};

