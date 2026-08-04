const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

let db;

async function connectDatabase() {

    db = await open({
        filename: path.join(__dirname, "zenx.db"),
        driver: sqlite3.Database
    });

    console.log("✅ SQLite Connected");

    // ===========================
    // Teams
    // ===========================

    await db.exec(`
        CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    team_name TEXT UNIQUE,

    manager TEXT,

    coach TEXT,

    captain TEXT,

    whatsapp TEXT,

    logo TEXT,

    checked_in INTEGER DEFAULT 0,

    status TEXT DEFAULT 'Registered',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
    `);

    await db.exec(`
CREATE TABLE IF NOT EXISTS players (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    team_id INTEGER,

    player_number INTEGER,

    real_name TEXT,

    riot_id TEXT,

    current_rank TEXT,

    peak_rank TEXT,

    discord_id TEXT,

    youtube_channel TEXT,

    FOREIGN KEY(team_id) REFERENCES teams(id)

);
`);

    // ===========================
    // Tournament Settings
    // ===========================

    await db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY,
            registration TEXT DEFAULT 'OPEN',
            max_teams INTEGER DEFAULT 32,
            current_teams INTEGER DEFAULT 0,
            tournament_date TEXT,
            tournament_time TEXT
        );
    `);


    await db.run(`
INSERT OR IGNORE INTO settings
(
    id,
    registration,
    max_teams,
    current_teams,
    tournament_date,
    tournament_time
)
VALUES
(
    1,
    'OPEN',
    32,
    0,
    '8 August 2026',
    '7:00 PM IST'
)
`);
    // ===========================
    // Matches
    // ===========================

    await db.exec(`
        CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_a TEXT,
            team_b TEXT,
            winner TEXT,
            round TEXT,
            status TEXT DEFAULT 'Pending'
        );
    `);

    console.log("✅ Database Ready");
}

function getDatabase() {
    return db;
}

module.exports = {
    connectDatabase,
    getDatabase
};