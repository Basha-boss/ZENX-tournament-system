const { getDatabase } = require("../database/database");
const { MATCH_STATUS } = require("./constants");

async function saveMatches(matches) {

    const db = getDatabase();

    // Remove old tournament matches
    await db.run(`DELETE FROM matches`);

    for (const match of matches) {

        let status = match.status;
        let winnerId = null;

        // Automatic BYE win
        if (match.team1?.bye && !match.team2?.bye) {
            status = MATCH_STATUS.COMPLETED;
            winnerId = match.team2Id;
        }

        if (!match.team1?.bye && match.team2?.bye) {
            status = MATCH_STATUS.COMPLETED;
            winnerId = match.team1Id;
        }

        await db.run(
            `
            INSERT INTO matches
            (
                match_id,
                bracket,
                round,
                match_number,
                team1_id,
                team2_id,
                winner_id,
                status,
                best_of
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                match.matchId,
                match.bracket,
                match.round,
                match.matchNumber,
                match.team1Id,
                match.team2Id,
                winnerId,
                status,
                1
            ]
        );
    }

    console.log(`✅ ${matches.length} matches saved.`);
}

module.exports = {
    saveMatches
};