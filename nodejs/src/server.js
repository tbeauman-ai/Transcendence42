import mysql from 'mysql2'

const connection = mysql.createConnection({
  host: 'mysql',       // nom du service docker, pas localhost !
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
})

connection.connect((err) => {
  if (err) {
    console.error('MySQL KO :', err.message)
  } else {
    console.log('MySQL OK ✅')
  }
})