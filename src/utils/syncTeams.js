const { getTeams } = require("./googleSheets");
const { getDatabase } = require("../database/database");
const sendRegistrationAnnouncement = require("./registrationAnnouncement");

async function syncTeams(client) {

    const db = getDatabase();
    const sheetTeams = await getTeams();

    console.log("Google Sheet Teams:");
console.log(sheetTeams.map(t => t.teamName));



    console.log("----- SHEET TEAMS -----");
    console.log(sheetTeams.map(t => t.teamName));
    console.log("-----------------------");

    let newTeams = 0;

    // -------------------------
    // IMPORT NEW TEAMS
    // -------------------------

    for (const team of sheetTeams) {

        if (!team.teamName) continue;

        const teamName = team.teamName.trim();

        const exists = await db.get(
            "SELECT id FROM teams WHERE team_name = ?",
            [teamName]
        );

        if (exists) continue;

        await db.run(
            `
            INSERT INTO teams
            (
                team_name,
                manager,
                coach,
                captain
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                teamName,
                team.manager,
                team.coach,
                team.captain
            ]
        );

        newTeams++;

        console.log("✅ Imported:", teamName);

        if (client) {
            await sendRegistrationAnnouncement(client, team);
        }
    }

    // -------------------------
    // REMOVE DELETED TEAMS
    // -------------------------

    const databaseTeams = await db.all(
        "SELECT team_name FROM teams"
    );

    console.log("Database Teams:");
console.log(databaseTeams.map(t => t.team_name));

    const sheetNames = sheetTeams
        .filter(t => t.teamName)
        .map(t => t.teamName.trim());

    for (const dbTeam of databaseTeams) {

        if (!sheetNames.includes(dbTeam.team_name)) {

            console.log("❌ Removed:", dbTeam.team_name);

            await db.run(
                "DELETE FROM teams WHERE team_name = ?",
                [dbTeam.team_name]
            );

        }

    }

    // -------------------------
    // UPDATE TEAM COUNT
    // -------------------------

    await db.run(`
        UPDATE settings
        SET current_teams = (
            SELECT COUNT(*) FROM teams
        )
        WHERE id = 1
    `);

    return newTeams;
}

module.exports = syncTeams;