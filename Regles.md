# 📜 Règles du jeu — TCG Dev Edition

## 1. Concept général

Chaque joueur choisit un **personnage** (inspiré d'un développeur du jeu) avec son **deck pré-construit**.  
Les decks sont composés de **cartes communes** (disponibles pour tous) et de **cartes exclusives** au personnage choisi.

Le but : **infliger le maximum de dégâts directs** à l'adversaire avant la fin du **8ème tour**.  
Le joueur ayant infligé le plus de dégâts directs au joueur adverse remporte la partie.

---

## 2. Les personnages

Chaque personnage possède :
- Des **points de vie** propres (variables selon le perso) — utilisés uniquement pour encaisser les dégâts directs
- Un **passif unique** qui définit son style de jeu
- Un **deck de 64 cartes** pré-construit

### Exemples de passifs
| Personnage | PV | Passif |
|---|---|---|
| Le Tank | 60 | Ses créatures ont +0/+2 |
| Le Glass Cannon | 30 | Ses créatures ont +2/+0 |
| Le Support | 45 | Pioche 1 carte supplémentaire par tour |
| *(à définir)* | ... | ... |

---

## 3. Le deck

| Paramètre | Valeur |
|---|---|
| Taille du deck | 64 cartes |
| Copies max par carte | 2 |
| Main de départ | 8 cartes |
| Limite de main | 8 cartes |
| Pioche par tour | Jusqu'à 8 cartes |

- Au début de chaque tour, le joueur **repioche jusqu'à avoir 8 cartes** en main (si 3 cartes gardées → pioche 5)
- Si le deck est vide, il ne se passe rien — le joueur joue simplement avec ce qu'il a en main
- **Aucune fatigue**, aucune défaite par deck vide

---

## 4. Le mana

- Chaque joueur dispose d'un mana incremental suivant la suite de Fibonacci :
1 1 2 3 5 8 13 21
- Le mana **s'accumule** d'un tour à l'autre
- Les cartes coûtent entre **1 et 5 mana**

---

## 5. Le terrain

Le terrain de chaque joueur comporte **8 slots numérotés de 1 à 8**.

```
Joueur A : [ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ]
           ───────────────────────────────────────────
Joueur B : [ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ]
```

- Chaque slot peut contenir **une seule carte permanente** (créature ou bâtiment)
- Les créatures et bâtiments **persistent entre les tours** jusqu'à leur destruction
- Le joueur choisit **dans quel slot** placer sa carte

---

## 6. Les types de cartes

### 🧙 Créatures
- Ont une valeur d'**Attaque** et de **Défense**
- Combattent automatiquement en fin de tour (voir section Combat)
- Restent sur le terrain jusqu'à leur destruction (Défense à 0)
- Les dégâts subis **persistent entre les tours** (pas de régénération)

### 🏰 Bâtiments
- Occupent un slot parmi les 8
- Ont un **effet passif** permanent tant qu'ils sont en jeu
- Sont **transparents** pour les créatures : ignorés lors du combat (la créature en face attaque directement le joueur si le slot adverse ne contient qu'un bâtiment)
- Peuvent être détruits par certains sorts ou effets de cartes

### 🔮 Sortilèges
- Jouables **pendant la phase de planification**
- Effet **immédiat**, puis vont au cimetière
- Effets variés : dégâts, buff de créatures, destruction de permanents, etc.

---

## 7. Le déroulement d'un tour

Les deux joueurs agissent **simultanément** — aucun joueur ne voit ce que joue l'adversaire pendant la phase de planification.

```
1. DÉBUT DE TOUR
   ├── Repioche jusqu'à 8 cartes en main
   └── 8 mana disponibles

2. PHASE DE PLANIFICATION (simultanée)
   ├── Chaque joueur choisit les cartes à jouer et dans quel ordre
   ├── Pour les créatures et bâtiments : choisir le slot de destination
   ├── Pour les sortilèges : choisir la cible
   └── Le joueur valide son plan (les cartes ne sont pas encore jouées)

3. RÉSOLUTION (simultanée et ordonnée)
   ├── Les cartes se jouent dans l'ordre choisi par chaque joueur
   ├── Les effets s'appliquent immédiatement
   └── Les créatures/bâtiments occupent leurs slots

4. COMBAT AUTOMATIQUE
   └── (voir section Combat)

5. FIN DE TOUR
   ├── Il se passe rien
```

---

## 8. Le combat

Le combat est **entièrement automatique** et se déroule après la phase de résolution.

### Résolution du combat slot par slot

Chaque slot est résolu **indépendamment** :

- **Créature vs Créature** : les deux se blessent mutuellement (dégâts simultanés). Si une créature tombe à 0 DEF → cimetière. Les dégâts excédentaires **passent sur le joueur adverse** (piétinement).
- **Créature vs Bâtiment** : le bâtiment est transparent — la créature inflige ses dégâts **directement au joueur adverse**
- **Créature vs Vide** : la créature inflige ses dégâts **directement au joueur adverse**
- **Bâtiment vs n'importe quoi** : le bâtiment n'attaque pas, il est ignoré

### Piétinement (Trample)
Les dégâts excédentaires passent sur le joueur adverse.

> **Exemple :** Une créature 5/3 affronte une créature 2/2. La 5/3 inflige 5 dégâts → 2 détruisent la créature adverse, **3 passent sur le joueur adverse**. La 2/2 inflige 2 dégâts → la 5/3 devient une 5/1.

### Seuls les dégâts directs au joueur comptent pour le score
Les dégâts infligés aux créatures adverses **ne comptent pas** dans le total de score.

---

## 9. Le score

- Chaque point de dégât infligé **directement au joueur adverse** s'ajoute au score de l'attaquant
- À la fin du **tour 8**, le joueur avec le **score le plus élevé** remporte la partie
- En cas d'égalité → **match nul**

---

## 10. Conditions de fin de partie

| Condition | Résultat |
|---|---|
| Fin du tour 8 | Victoire du joueur avec le score le plus élevé |
| Égalité de score | Match nul |

> Il n'y a **pas de défaite anticipée** par PV à 0 — un joueur peut encaisser plus de dégâts que ses PV sans perdre la partie. Les PV servent uniquement de **référence de robustesse** du personnage.

---

## 11. Glossaire

| Terme | Définition |
|---|---|
| **Slot** | Emplacement numéroté sur le terrain (1 à 8) |
| **Transparent** | Un bâtiment est ignoré lors du combat |
| **Piétinement** | Dégâts excédentaires transmis au joueur adverse |
| **Score** | Total des dégâts directs infligés au joueur adverse |
| **Permanent** | Carte qui reste sur le terrain (créature ou bâtiment) |
| **Cimetière** | Zone des cartes utilisées/détruites |
| **Commun** | Carte disponible dans tous les decks |
| **Exclusif** | Carte réservée à un personnage spécifique |
