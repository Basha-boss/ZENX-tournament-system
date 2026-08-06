/**
 * Validates bracket structure and match pairings.
 * @param {Array} matches - Array of match objects generated for a tournament round.
 * @returns {boolean} True if valid.
 */
function validateBracket(matches) {
    if (!Array.isArray(matches) || matches.length === 0) {
        throw new Error("Bracket validation failed: Match list is empty.");
    }

    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];

        if (!match.team1 && !match.team_a) {
            throw new Error(`Bracket validation failed: Match index ${i} is missing Team A.`);
        }

        if (!match.team2 && !match.team_b) {
            throw new Error(`Bracket validation failed: Match index ${i} is missing Team B.`);
        }
    }

    console.log(`✅ Bracket validation passed for ${matches.length} match(es).`);
    return true;
}

module.exports = {
    validateBracket
};
