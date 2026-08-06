const { getDatabase } = require("../database/database");
const { MATCH_STATUS } = require("./constants");

/**
 * Advances a winner from a completed match into the next round match.
 * @param {number|string} matchId - The database ID or 1-indexed match number of the match.
 * @param {string} winnerTeamName - The name of the winning team.
 * @param {number} [winnerRounds=0] - Number of rounds/games won by winner.
 * @param {number} [loserRounds=0] - Number of rounds/games won by loser.
 */
async function advanceWinner(matchId, winnerTeamName, winnerRounds = 0, loserRounds = 0) {
    const db = getDatabase();

    // 1. Try fetching match by exact primary key `id`
    let match = await db.get(
        `SELECT * FROM matches WHERE id = ?`,
        [matchId]
    );

    // 2. If not found by DB id, try resolving `matchId` as 1-based match index
    if (!match) {
        const numericId = parseInt(matchId, 10);
        if (!isNaN(numericId) && numericId > 0) {
            const allMatches = await db.all(
                `SELECT * FROM matches ORDER BY id ASC`
            );

            if (allMatches.length >= numericId) {
                match = allMatches[numericId - 1];
            }
        }
    }

    if (!match) {
        throw new Error(`Match not found: ${matchId}`);
    }

    // Resolve exact team name (case-insensitive) from team_a or team_b
    let resolvedWinner = winnerTeamName;
    let resolvedLoser = "N/A";
    let scoreA = 0;
    let scoreB = 0;

    const wRounds = parseInt(winnerRounds, 10) || 0;
    const lRounds = parseInt(loserRounds, 10) || 0;

    if (match.team_a && match.team_a.toLowerCase() === winnerTeamName.trim().toLowerCase()) {
        resolvedWinner = match.team_a;
        resolvedLoser = match.team_b || "N/A";
        scoreA = wRounds;
        scoreB = lRounds;
    } else if (match.team_b && match.team_b.toLowerCase() === winnerTeamName.trim().toLowerCase()) {
        resolvedWinner = match.team_b;
        resolvedLoser = match.team_a || "N/A";
        scoreA = lRounds;
        scoreB = wRounds;
    } else {
        resolvedWinner = winnerTeamName;
        resolvedLoser = match.team_a === winnerTeamName ? match.team_b : match.team_a;
        scoreA = wRounds;
        scoreB = lRounds;
    }

    // Fetch logo URLs for winner and loser
    const winnerTeamObj = await db.get(`SELECT logo FROM teams WHERE LOWER(team_name)=LOWER(?)`, [resolvedWinner]);
    const loserTeamObj = await db.get(`SELECT logo FROM teams WHERE LOWER(team_name)=LOWER(?)`, [resolvedLoser]);

    const winnerLogo = winnerTeamObj?.logo || "";
    const loserLogo = loserTeamObj?.logo || "";

    // Mark current match as completed with scores
    await db.run(
        `UPDATE matches SET winner = ?, status = ?, score_a = ?, score_b = ? WHERE id = ?`,
        [resolvedWinner, MATCH_STATUS.COMPLETED, scoreA, scoreB, match.id]
    );

    // Find all matches in current round to determine human-readable match index
    const currentRoundMatches = await db.all(
        `SELECT * FROM matches WHERE round = ? ORDER BY id ASC`,
        [match.round]
    );

    const matchIndex = currentRoundMatches.findIndex(m => m.id === match.id);
    const roundMatchNumber = matchIndex !== -1 ? matchIndex + 1 : 1;

    // Extract round number from 'WB-R1', 'WB-R2', etc.
    const roundMatch = match.round ? match.round.match(/R(\d+)/) : null;
    const currentRoundNum = roundMatch ? parseInt(roundMatch[1], 10) : 1;
    const nextRoundNum = currentRoundNum + 1;
    const nextRoundName = `WB-R${nextRoundNum}`;

    const nextMatchIndex = Math.floor(matchIndex / 2);
    const nextRoundMatchNumber = nextMatchIndex + 1;
    const isTeamA = matchIndex % 2 === 0;

    // Check if next round match exists in DB
    const nextRoundMatches = await db.all(
        `SELECT * FROM matches WHERE round = ? ORDER BY id ASC`,
        [nextRoundName]
    );

    let nextMatch = nextRoundMatches[nextMatchIndex];

    if (nextMatch) {
        // Update existing match slot in next round
        const columnToUpdate = isTeamA ? "team_a" : "team_b";
        await db.run(
            `UPDATE matches SET ${columnToUpdate} = ? WHERE id = ?`,
            [resolvedWinner, nextMatch.id]
        );
    } else {
        // Create new match in next round
        const teamA = isTeamA ? resolvedWinner : "TBD";
        const teamB = isTeamA ? "TBD" : resolvedWinner;

        const insertResult = await db.run(
            `INSERT INTO matches (team_a, team_b, round, status) VALUES (?, ?, ?, ?)`,
            [teamA, teamB, nextRoundName, MATCH_STATUS.PENDING]
        );

        nextMatch = {
            id: insertResult.lastID,
            team_a: teamA,
            team_b: teamB,
            round: nextRoundName,
            status: MATCH_STATUS.PENDING
        };
    }

    return {
        match: {
            ...match,
            roundMatchNumber,
            scoreA,
            scoreB
        },
        nextMatch: {
            ...nextMatch,
            roundMatchNumber: nextRoundMatchNumber
        },
        winner: resolvedWinner,
        loser: resolvedLoser,
        winnerRounds: wRounds,
        loserRounds: lRounds,
        winnerLogo,
        loserLogo
    };
}

module.exports = {
    advanceWinner
};
