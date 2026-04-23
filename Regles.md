# 📜 Règles du jeu — TCG Dev Edition

## 1. Concept général

Chaque joueur choisit un **personnage** (inspiré d'un développeur du jeu) avec son **deck pré-construit**.  
Les decks sont composés de **cartes communes** (disponibles pour tous) et de **cartes exclusives** au personnage choisi.  
Le but : réduire les **points de vie** de l'adversaire à 0.

---

## 2. Les personnages

Chaque personnage possède :
- Des **points de vie** propres (variables selon le perso)
- Un **passif unique** qui définit son style de jeu
- Une valeur d'**armure de base** (peut être 0)
- Un **deck de 30 cartes** pré-construit

### L'armure
- L'armure **absorbe les dégâts avant les PV**
- Elle se **réinitialise au début de chaque tour** du joueur à sa valeur de base
- Certaines cartes peuvent **générer de l'armure temporaire** en plus (s'ajoute à la valeur de base jusqu'au prochain reset)
- Elle n'a pas de plafond, mais les valeurs générées par les cartes doivent rester raisonnables

> **Exemple :** Un perso avec 1 armure de base subit 3 dégâts → il perd 1 armure et 2 PV. Au début de son prochain tour, son armure repasse à 1.

### Exemples de passifs
| Personnage | PV | Armure de base | Passif |
|---|---|---|---|
| Le Tank | 30 | 2 | +3 armure au début de chaque tour |
| Le Glass Cannon | 20 | 0 | Ses creatures gagnent +1/+0 |
| Le Druide | 25 | 1 | Gagne 1 mana supplementaire au debut du match |
| *(à définir)* | ... | ... | ... |

---

## 3. Les ressources — Le Mana

- Chaque joueur commence avec **1 mana** au tour 1
- Le **mana maximum augmente de 1 par tour**, sans maximum
- Le mana se **reinitialise automatiquement** au début de chaque tour
- Le mana non utilisé **ne se conserve pas** pendant le tour de l'adversaire.

---

## 4. Le deck

| Paramètre | Valeur |
|---|---|
| Taille du deck | 30 cartes |
| Copies max par carte | 2 |
| Main de départ | 6 cartes |
| Limite de main | 10 cartes |
| Pioche par tour | 1 carte |

- Si un joueur doit piocher mais que son deck est vide → il perds la partie
- Si la main est pleine (10 cartes) et qu'une carte doit être piochée → elle est **retiree de la partie**

---

## 5. Les types de cartes

### 🧙 Créatures
- Ont une valeur d'**Attaque** et de **Défense**
- Arrivent sur le terrain avec un **tour de sommeil** (ne peuvent pas attaquer le tour où elles sont posées, elles peuvent bloquer)
- Se **réveillent au début du tour suivant** du joueur
- Restent sur le terrain jusqu'à leur mort (Défense à 0)
- Les dégâts subis **ne persistent pas entre les tours** (régénération automatique)

### 🔮 Sorts (Éphémères)
- Jouables **uniquement pendant son propre tour**
- Résolution **immédiate**, sans pile
- Effets variés : dégâts, soins, buff de créatures, génération d'armure...

---

## 6. Le déroulement d'un tour

```
1. DÉBUT DE TOUR
   ├── Réinitialisation de l'armure à sa valeur de base
   ├── +1 mana maximum (si < 10)
   ├── Régénération du mana
   ├── Pioche d'1 carte
   └── Réveil des créatures posées au tour précédent

2. PHASE PRINCIPALE
   ├── Jouer des cartes (créatures, sorts)
   ├── Déclarer des attaques avec les créatures éveillées
   └── Jouer des cartes (l'adversaire peut répondre)

3. FIN DE TOUR
   └── Le joueur declare la fin de son tour
```

---

## 7. Le combat

### Déclarer une attaque
- Seules les créatures **éveillées** peuvent attaquer
- Une créature ne peut attaquer **qu'une fois par tour**
- Les créatures attaquent **directement le joueur adverse** par défaut

### Le blocage
- Le joueur défenseur peut **déclarer des bloqueurs** parmi ses créatures éveillées
- **Plusieurs créatures** peuvent bloquer une même créature attaquante
- Une créature ne peut bloquer **qu'une attaque par tour**

### Résolution du combat
- Si une créature est bloquée par **plusieurs créatures**, l'attaquant répartit ses dégâts entre les bloqueurs
- Les dégâts sont **simultanés** : attaquant et bloqueur se blessent mutuellement
- Une créature dont la **Défense tombe à 0** est envoyée au **cimetière**
- Les dégâts excédentaires ne se **reportent pas** sur le joueur (sauf effet de carte spécifique)

> **Exemple :** Une créature 3/2 attaque. L'adversaire bloque avec une créature 1/4. La 3/2 inflige 3 dégâts → la 1/4 devient une 1/1. La 1/4 inflige 1 dégât → la 3/2 devient une 3/1. Les deux survivent.

---

## 8. Conditions de victoire et défaite

| Condition | Résultat |
|---|---|
| PV adversaire à 0 | Victoire |
| PV propres à 0 | Défaite |
| Deck vide + fatigue | Défaite progressive |
| Abandon | Défaite immédiate |

---

## 9. Glossaire

| Terme | Définition |
|---|---|
| **Sommeil** | État d'une créature posée ce tour, ne peut pas agir |
| **Éveillée** | Créature pouvant attaquer ou bloquer |
| **Armure** | Absorbe les dégâts avant les PV, reset chaque tour |
| **Pile** | File LIFO de résolution des instantanés |
| **Fatigue** | Dégât subi quand le deck est vide |
| **Cimetière** | Zone des cartes utilisées/détruites |
| **Commun** | Carte disponible dans tous les decks |
| **Exclusif** | Carte réservée à un personnage spécifique |
