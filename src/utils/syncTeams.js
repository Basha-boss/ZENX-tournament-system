const { getTeams, getTeamsMMR } = require("./googleSheets");
const { getDatabase } = require("../database/database");
const sendRegistrationAnnouncement = require("./registrationAnnouncement");
const updateTeamList = require("./teamListUpdater");

let isInitialSyncDone = false;

async function syncTeams(client) {
    try {
        const db = getDatabase();
        const sheetTeams = await getTeams();
        const mmrMap = await getTeamsMMR();

        console.log(`📥 Google Sheets returned ${sheetTeams.length} team(s) and ${mmrMap.size} MMR record(s).`);

        let newTeams = 0;
        let removedTeams = 0;

        // Check if initial sync has occurred
        const existingCount = await db.get("SELECT COUNT(*) AS total FROM teams");
        const isFirstSync = !isInitialSyncDone && (existingCount?.total === 0 || existingCount?.total < sheetTeams.length);

        // =========================
        // IMPORT / UPDATE TEAMS, MMR & LOGO
        // =========================

        for (const team of sheetTeams) {
            if (!team.teamName) continue;

            const teamName = team.teamName.trim();
            const mmrData = mmrMap.get(teamName.toLowerCase()) || { mmr: 0, logo: "" };
            const mmr = mmrData.mmr;
            const logo = mmrData.logo;

            const exists = await db.get(
                "SELECT id, mmr, logo FROM teams WHERE LOWER(team_name)=LOWER(?)",
                [teamName]
            );

            if (exists) {
                // Update MMR or Logo if changed
                if (exists.mmr !== mmr || exists.logo !== logo) {
                    await db.run(
                        "UPDATE teams SET mmr=?, logo=? WHERE id=?",
                        [mmr, logo, exists.id]
                    );
                    console.log(`🔄 Updated MMR/Logo for ${teamName}: MMR=${mmr}, Logo=${logo ? "Yes" : "No"}`);
                }
                continue;
            }

            await db.run(
                `
                INSERT INTO teams
                (
                    team_name,
                    manager,
                    coach,
                    captain,
                    mmr,
                    logo
                )
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    teamName,
                    team.manager || "",
                    team.coach || "",
                    team.captain || "",
                    mmr,
                    logo
                ]
            );

            newTeams++;

            console.log(`✅ Imported: ${teamName} (MMR: ${mmr})`);

            // Only send individual announcements for single new teams after initial sync
            if (client && !isFirstSync) {
                await sendRegistrationAnnouncement(client, team);
            }
        }

        // Sync MMR & Logo for any teams already in DB that exist in MMR sheet
        for (const [name, data] of mmrMap.entries()) {
            await db.run(
                "UPDATE teams SET mmr=?, logo=? WHERE LOWER(team_name)=LOWER(?) AND (mmr != ? OR logo != ?)",
                [data.mmr, data.logo, name, data.mmr, data.logo]
            );
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
                SELECT COUNT(*) FROM teams WHERE status = 'Registered'
            )
            WHERE id = 1
        `);

        console.log(
            `📊 Sync Complete | Added: ${newTeams} | Removed: ${removedTeams}`
        );

        isInitialSyncDone = true;

        // Update live team roster embed on Discord
        if (client) {
            await updateTeamList(client);
        }

        return newTeams;

    } catch (err) {
        console.error("❌ Team Sync Failed");
        console.error(err.stack || err);

        return 0;
    }
}

module.exports = syncTeams;