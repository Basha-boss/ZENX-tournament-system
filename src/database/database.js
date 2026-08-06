const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const tournament = require("../config/tournament.json");

let db;

async function connectDatabase() {
    try {
        db = await open({
            filename: path.join(__dirname, "zenx.db"),
            driver: sqlite3.Database
        });

        // Enable Foreign Keys
        await db.exec("PRAGMA foreign_keys = ON;");

        console.log("✅ SQLite Connected");

        // =====================================
        // Teams
        // =====================================

        await db.exec(`
            CREATE TABLE IF NOT EXISTS teams (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                team_name TEXT UNIQUE NOT NULL,

                manager TEXT,

                coach TEXT,

                captain TEXT,

                whatsapp TEXT,

                logo TEXT,

                checked_in INTEGER DEFAULT 0,

                status TEXT DEFAULT 'Registered',

                mmr REAL DEFAULT 0,

                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Migration: Ensure mmr & logo columns exist for older DBs
        try {
            await db.exec("ALTER TABLE teams ADD COLUMN mmr REAL DEFAULT 0;");
        } catch {}
        try {
            await db.exec("ALTER TABLE teams ADD COLUMN logo TEXT;");
        } catch {}

        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_team_name
            ON teams(team_name);
        `);

        // =====================================
        // Players
        // =====================================

        await db.exec(`
            CREATE TABLE IF NOT EXISTS players (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                team_id INTEGER NOT NULL,

                player_number INTEGER,

                real_name TEXT,

                riot_id TEXT,

                current_rank TEXT,

                peak_rank TEXT,

                discord_id TEXT,

                youtube_channel TEXT,

                FOREIGN KEY(team_id)
                REFERENCES teams(id)
                ON DELETE CASCADE
            );
        `);

        // =====================================
        // Tournament Settings
        // =====================================

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

        const tournamentDate = new Date(tournament.date);

        await db.run(
            `
            INSERT OR IGNORE INTO settings
            (
                id,
                registration,
                max_teams,
                current_teams,
                tournament_date,
                tournament_time
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                1,
                tournament.status,
                tournament.maxTeams,
                tournament.registeredTeams,
                tournamentDate.toLocaleDateString("en-GB"),
                tournamentDate.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true
                })
            ]
        );

        // =====================================
        // Matches
        // =====================================

        await db.exec(`
            CREATE TABLE IF NOT EXISTS matches (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                team_a TEXT,

                team_b TEXT,

                winner TEXT,

                round TEXT,

                status TEXT DEFAULT 'Pending',

                score_a INTEGER DEFAULT 0,

                score_b INTEGER DEFAULT 0,

                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Migration: Ensure score_a and score_b columns exist for older DBs
        try {
            await db.exec("ALTER TABLE matches ADD COLUMN score_a INTEGER DEFAULT 0;");
        } catch {}
        try {
            await db.exec("ALTER TABLE matches ADD COLUMN score_b INTEGER DEFAULT 0;");
        } catch {}

        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_match_round
            ON matches(round);
        `);

        console.log("✅ Database Ready");
    } catch (error) {
        console.error("❌ Database Error");
        console.error(error);
        process.exit(1);
    }
}

function getDatabase() {
    if (!db) {
        throw new Error("Database has not been initialized.");
    }

    return db;
}

async function closeDatabase() {
    if (db) {
        await db.close();
        console.log("🛑 Database Closed");
    }
}

module.exports = {
    connectDatabase,
    getDatabase,
    closeDatabase
};
