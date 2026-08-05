const { getTeams } = require("./googleSheets");
const { getDatabase } = require("../database/database");
const sendRegistrationAnnouncement = require("./registrationAnnouncement");

async function syncTeams(client) {

    try {

        const db = getDatabase();
        const sheetTeams = await getTeams();

        console.log(`📥 Google Sheets returned ${sheetTeams.length} team(s).`);

        let newTeams = 0;
        let removedTeams = 0;

        // =========================
        // IMPORT NEW TEAMS
        // =========================

        for (const team of sheetTeams) {

            if (!team.teamName) continue;

            const teamName = team.teamName.trim();

            const exists = await db.get(
                "SELECT id FROM teams WHERE LOWER(team_name)=LOWER(?)",
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
                    team.manager || "",
                    team.coach || "",
                    team.captain || ""
                ]
            );

            newTeams++;

            console.log(`✅ Imported: ${teamName}`);

            if (client) {
                await sendRegistrationAnnouncement(client, team);
            }
        }

        // =========================
        // REMOVE DELETED TEAMS
        // =========================

        const databaseTeams = await db.all(
            "SELECT team_name FROM teams"
        );

        const sheetNames = sheetTeams
            .filter(team => team.teamName)
            .map(team => team.teamName.trim().toLowerCase());

        for (const dbTeam of databaseTeams) {

            if (!sheetNames.includes(dbTeam.team_name.toLowerCase())) {

                await db.run(
                    "DELETE FROM teams WHERE team_name = ?",
                    [dbTeam.team_name]
                );

                removedTeams++;

                console.log(`❌ Removed: ${dbTeam.team_name}`);
            }
        }

        // =========================
        // UPDATE TEAM COUNT
        // =========================

        await db.run(`
            UPDATE settings
            SET current_teams = (
                SELECT COUNT(*) FROM teams
            )
            WHERE id = 1
        `);

        console.log(
            `📊 Sync Complete | Added: ${newTeams} | Removed: ${removedTeams}`
        );

        return newTeams;

    } catch (err) {

        console.error("❌ Team Sync Failed");
        console.error(err.stack || err);

        return 0;
    }

}

module.exports = syncTeams;