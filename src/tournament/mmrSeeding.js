const { getBracketSize } = require("./byeManager");
const { processByes } = require("./byeProcessor");
const { BRACKETS, MATCH_STATUS } = require("./constants");

/**
 * Pairs teams for Round 1 based on how close their MMR ratings are.
 * Sorts teams by MMR in DESCENDING order (highest MMR team plays in Match 1).
 * Pairs adjacent teams, handles BYE padding if needed.
 * @param {Array} teams - Array of team objects with { id, team_name, mmr }
 */
async function generateMMRBracket(teams) {
    if (!teams || teams.length < 2) {
        throw new Error("At least 2 teams are required to generate an MMR bracket.");
    }

    // Sort teams by MMR in DESCENDING order (highest MMR first)
    const sortedTeams = [...teams].sort((a, b) => (b.mmr || 0) - (a.mmr || 0));

    // Determine target bracket size (4, 8, 16, 32)
    const bracketSize = getBracketSize(sortedTeams.length);

    // Add BYE padding if needed
    const paddedTeams = [...sortedTeams];
    while (paddedTeams.length < bracketSize) {
        paddedTeams.push({
            id: null,
            seed: paddedTeams.length + 1,
            team_name: "BYE",
            mmr: 0,
            bye: true
        });
    }

    const matches = [];
    let matchNumber = 1;

    for (let i = 0; i < paddedTeams.length; i += 2) {
        const team1 = paddedTeams[i];
        const team2 = paddedTeams[i + 1];

        matches.push({
            matchId: `WB-R1-M${matchNumber}`,
            bracket: BRACKETS.WINNER,
            round: 1,
            matchNumber,
            team1,
            team2,
            team1Id: team1?.id ?? null,
            team2Id: team2?.id ?? null,
            winner: null,
            loser: null,
            status: MATCH_STATUS.PENDING
        });

        matchNumber++;
    }

    // Auto-advance teams facing BYEs
    const finalMatches = await processByes(matches);

    return {
        bracketSize,
        teamCount: teams.length,
        byeCount: bracketSize - teams.length,
        matches: finalMatches
    };
}

module.exports = {
    generateMMRBracket
};
