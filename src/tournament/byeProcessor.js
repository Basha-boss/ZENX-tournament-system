const { MATCH_STATUS } = require("./constants");

async function processByes(matches) {
    return matches.map(match => {
        const isTeam1Bye = match.team1?.bye || match.team1?.team_name === "BYE";
        const isTeam2Bye = match.team2?.bye || match.team2?.team_name === "BYE";

        let winner = null;
        let status = MATCH_STATUS.PENDING;

        if (isTeam1Bye && !isTeam2Bye) {
            winner = match.team2?.team_name || null;
            status = MATCH_STATUS.COMPLETED;
        } else if (!isTeam1Bye && isTeam2Bye) {
            winner = match.team1?.team_name || null;
            status = MATCH_STATUS.COMPLETED;
        }

        return {
            ...match,
            winner,
            status
        };
    });
}

module.exports = {
    processByes
};
