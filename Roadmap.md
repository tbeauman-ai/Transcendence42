# 🃏 Roadmap — TCG en ligne

## Vue d'ensemble

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
MVP        UI        Multi      Comptes   Match-     Polish
local      basique   joueur     users     making
```

---

## Phase 1 — MVP & Moteur de jeu
**Objectif : avoir un jeu fonctionnel, même sans interface**

- [ ] Définir les règles complètes du jeu (document de game design)
- [ ] Concevoir un premier set de cartes (20–30 cartes suffisent)
- [ ] Implémenter le moteur de jeu en TypeScript/JS pur
  - Gestion des tours
  - Zones de jeu (main, terrain, cimetière, deck)
  - Résolution des effets de cartes
  - Conditions de victoire/défaite
- [ ] Tests unitaires sur le moteur (cas limites, interactions)
- [ ] Simulation de partie en console (2 joueurs, même machine)

> 💡 **Conseil** : Le moteur doit être 100% indépendant de l'UI. Une fonction `applyAction(gameState, action) → newGameState` comme base.

---

## Phase 2 — Interface utilisateur basique
**Objectif : rendre le jeu jouable visuellement**

- [ ] Setup du projet frontend (React + Vite recommandé)
- [ ] Affichage des cartes (image, stats, effets)
- [ ] Zones de jeu cliquables (main du joueur, terrain, deck, cimetière)
- [ ] Drag & drop ou clic pour jouer une carte
- [ ] Indicateurs de jeu (points de vie, mana/énergie, tour actuel)
- [ ] Deck builder basique (sélection de cartes, sauvegarde locale)
- [ ] Partie solo contre une IA simple (aléatoire ou règles basiques)

> 💡 **Conseil** : Utiliser PixiJS ou simplement du CSS/SVG pour le rendu des cartes selon la complexité visuelle souhaitée.

---

## Phase 3 — Multijoueur temps réel
**Objectif : deux joueurs peuvent s'affronter en ligne**

- [ ] Setup du backend (Node.js + Fastify ou Express)
- [ ] Intégration WebSockets (Socket.io)
- [ ] Déplacement du moteur de jeu côté serveur (**source de vérité**)
- [ ] Synchronisation de l'état de jeu entre les deux clients
- [ ] Gestion des actions joueur (validation serveur avant application)
- [ ] Système de lobby (créer/rejoindre une partie par code)
- [ ] Gestion des déconnexions (timeout, abandon, reconnexion)
- [ ] Déploiement d'un serveur de test (Railway, Fly.io, etc.)

> ⚠️ **Sécurité** : Toute logique de jeu doit être validée côté serveur. Le client ne fait qu'envoyer des intentions, jamais décider du résultat.

---

## Phase 4 — Comptes utilisateurs & Collection
**Objectif : les joueurs ont une identité et une collection**

- [ ] Système d'authentification (JWT + OAuth Discord/Google)
- [ ] Base de données PostgreSQL
  - Table `users`
  - Table `cards`
  - Table `collections` (user ↔ cards)
  - Table `decks`
- [ ] API REST pour la gestion des comptes
- [ ] Deck builder connecté au compte (sauvegarde cloud)
- [ ] Page profil (stats, historique de parties)
- [ ] Système de collection (cartes obtenues, quantités)
- [ ] Ouverture de boosters (distribution aléatoire pondérée par rareté)

---

## Phase 5 — Matchmaking
**Objectif : trouver un adversaire automatiquement**

- [ ] File d'attente de matchmaking
- [ ] Système de ranking (ELO ou MMR simple)
- [ ] Appariement par niveau (éviter les déséquilibres)
- [ ] Modes de jeu : Classé / Non classé / Amis
- [ ] Historique des parties (résultat, decks joués, durée)
- [ ] Statistiques globales (win rate par carte, taux de play)

---

## Phase 6 — Polish & Lancement
**Objectif : une expérience joueur soignée**

- [ ] Animations (jeu de cartes, attaques, effets)
- [ ] Effets sonores & musique
- [ ] Tutoriel interactif pour les nouveaux joueurs
- [ ] Équilibrage du jeu basé sur les stats (nerf/buff de cartes)
- [ ] Optimisation des performances (lazy loading, compression assets)
- [ ] Tests de charge (WebSockets sous stress)
- [ ] Sécurité & anti-triche (rate limiting, validation stricte)
- [ ] Documentation (règles du jeu, API publique si besoin)
- [ ] Lancement bêta fermée → ouverte

---

## Stack technique récapitulatif

| Couche | Technologie |
|---|---|
| Frontend | React + Vite + PixiJS (optionnel) |
| Backend | Node.js + Fastify |
| Temps réel | Socket.io |
| Base de données | PostgreSQL |
| Auth | JWT + OAuth (Discord / Google) |
| Hébergement | Fly.io / Railway / Render |
| CI/CD | GitHub Actions |

---

## Indicateurs de progression

| Phase | Critère de validation |
|---|---|
| 1 — MVP | Partie simulable en console, moteur testé |
| 2 — UI | Partie solo jouable dans le navigateur |
| 3 — Multi | 2 joueurs s'affrontent via internet |
| 4 — Comptes | Login fonctionnel, decks sauvegardés |
| 5 — Matchmaking | File d'attente opérationnelle avec ranking |
| 6 — Polish | Bêta ouverte lancée |
