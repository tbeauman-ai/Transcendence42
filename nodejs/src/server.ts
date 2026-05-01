import express from 'express'
import mysql from 'mysql2/promise'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { initSocket } from './socket/game.ts'
import cardsRouter from './routes/cards.ts'
import heroesRouter from './routes/heroes.ts'
import authRouter from './routes/auth.ts'


const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: "*" } })

export const connection = await mysql.createConnection({
    host: 'mysql',
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
})
console.log('MySQL OK ✅')

app.use(express.json())
app.use('/cards', cardsRouter)
app.use('/heroes', heroesRouter)
app.use('/auth', authRouter)
app.get('/users', async (req, res) => {
    const [rows] = await connection.query('SELECT id, username, created_at FROM users')
    res.json(rows)
})

app.get('/', (req, res) => {
    res.send('TCG Dev Edition — API OK ✅')
})

initSocket(io)

httpServer.listen(3000, () => {
    console.log('Server running on port 3000')
})