import express from 'express'
import mysql from 'mysql2/promise'

const app = express()

// Test MySQL
const connection = await mysql.createConnection({
  host: 'mysql',
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
})
console.log('MySQL OK ✅')

// Route de test
app.get('/', (req, res) => {
  res.send('TCG Dev Edition — API OK ✅')
})

// Ecoute sur le port 3000
app.listen(3000, () => {
  game = instantiateGame();
  while (game.turnNumber < 8) {
    for (player in game.players) {
      startTurn(player);
    }
    const curr_time = Date.now();
    const elapsed = 0;
    while (elapsed < game.clock_per_turn){
      selectedCards.push(playerSelectCards());
      elapsed = Date.now() - curr_time;
    }
    for (const card of selectedCards) {
      playCard(card, params);
      checkBoardState(); // pour mettre les creas au cimetiere
    }
    resolveBuildings(game);
    checkBoardState(); // pour mettre les creas au cimetiere
    resolveCombat(game);
    checkBoardState(); // pour mettre les creas au cimetiere
    game.turnNumber += 1;
  }
  checkVictory();
  console.log('Server running on port 3000')
})