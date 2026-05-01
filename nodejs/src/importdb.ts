import fs from 'fs'
// import path from 'path'
import mysql from 'mysql2/promise'

const connection = await mysql.createConnection({
    host: 'mysql',
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
})

console.log('MySQL connecté ✅')

// Parse un CSV avec ; comme séparateur
function parseCSV(filePath: string): Record<string, string>[] {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n').filter(l => l.trim() !== '')
    const headers = lines[0].split(';').map(h => h.trim())
    
    return lines.slice(1).map(line => {
        const values = line.split(';').map(v => v.trim())
        const row: Record<string, string> = {}
        headers.forEach((h, i) => row[h] = values[i] ?? '')
        return row
    }).filter(row => row['CollectionID'] !== '')
}

// Import des créatures
async function importCreatures() {
    const rows = parseCSV('/app/databases/creatures/CREATURE_DB.csv')
    for (const row of rows) {
        await connection.execute(
            `INSERT INTO cards (id, name, type, class, rune_cost, base_force, base_endurance, effect_text, effect_json_path, illustration, collection_id)
             VALUES (?, ?, 'creature', ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE name = VALUES(name)`,
            [
                row['CollectionID'],
                row['Name'],
                row['Class'],
                parseInt(row['Rune Cost']),
                parseInt(row['Force']),
                parseInt(row['Endurance']),
                row['Effect (string)'],
                row['Effect (json path)'],
                row['Illustration'],
                row['CollectionID']
            ]
        )
        console.log(`Créature importée : ${row['Name']} (${row['CollectionID']})`)
    }
}

// Import des bâtiments
async function importBuildings() {
    const rows = parseCSV('/app/databases/buildings/BUILDINGS_DB.csv')
    for (const row of rows) {
        await connection.execute(
            `INSERT INTO cards (id, name, type, class, rune_cost, base_endurance, effect_text, effect_json_path, illustration, collection_id)
             VALUES (?, ?, 'building', ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE name = VALUES(name)`,
            [
                row['CollectionID'],
                row['Name'],
                row['Class'],
                parseInt(row['Rune Cost']),
                parseInt(row['Life']),
                row['Effect (string)'],
                row['Effect (json path)'],
                row['Illustration'],
                row['CollectionID']
            ]
        )
        console.log(`Bâtiment importé : ${row['Name']} (${row['CollectionID']})`)
    }
}

// Import des sorts
async function importSpells() {
    const rows = parseCSV('/app/databases/spells/SPELLS_DB.csv')
    for (const row of rows) {
        await connection.execute(
            `INSERT INTO cards (id, name, type, class, rune_cost, effect_text, effect_json_path, illustration, collection_id)
             VALUES (?, ?, 'sortilege', ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE name = VALUES(name)`,
            [
                row['CollectionID'],
                row['Name'],
                row['Class'],
                parseInt(row['Rune Cost']),
                row['Effect (string)'],
                row['Effect (json path)'],
                row['Illustration (.png)'],
                row['CollectionID']
            ]
        )
        console.log(`Sort importé : ${row['Name']} (${row['CollectionID']})`)
    }
}

async function importHeroes() {
    const rows = parseCSV('/app/databases/heroes/HERO_DB.csv')
    for (const row of rows) {
        await connection.execute(
            `INSERT INTO heroes (id, name, base_armor, passive_text, passive_json_path, illustration)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE name = VALUES(name)`,
            [
                row['Id'],
                row['Class'],
                parseInt(row['BaseArmor']),
                row['Description'],
                row['PassiveEffect'],
                row['Picture']
            ]
        )
        console.log(`Héros importé : ${row['Class']} (${row['Id']})`)
    }
}

await importCreatures()
await importBuildings()
await importSpells()
await importHeroes()

console.log('Import terminé ✅')
await connection.end()
