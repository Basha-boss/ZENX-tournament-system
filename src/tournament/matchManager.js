const { getDatabase } = require("../database/database");
const { MATCH_STATUS } = require("./constants");

async function saveMatches(matches) {
    const db = getDatabase();

    // Remove old tournament matches
    await db.run(`DELETE FROM matches`);

    for (const match of matches) {
        const teamA = match.team1?.team_name || match.team_a || "BYE";
        const teamB = match.team2?.team_name || match.team_b || "BYE";

        const roundStr = String(match.round || "1");
        const roundName = roundStr.startsWith("WB-R") ? roundStr : `WB-R${roundStr}`;

        await db.run(
            `
            INSERT INTO matches
            (
                team_a,
                team_b,
                winner,
                round,
                status
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                teamA,
                teamB,
                match.winner || null,
                roundName,
                match.status || MATCH_STATUS.PENDING
            ]
        );
    }

    console.log(`✅ ${matches.length} matches saved.`);
}

module.exports = {
    saveMatches
};