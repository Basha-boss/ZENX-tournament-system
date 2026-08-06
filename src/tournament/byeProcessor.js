const { getDatabase } = require("../database/database");

async function processByes(matches) {

    const db = getDatabase();

    for (const match of matches) {

        const team1Bye = match.team1?.bye;
        const team2Bye = match.team2?.bye;

        // Ignore BYE vs BYE
        if (team1Bye && team2Bye) continue;

        // Team 1 advances
        if (!team1Bye && team2Bye) {

            match.winner = match.team1.team_name;
            match.status = "COMPLETED";

        }

        // Team 2 advances
        if (team1Bye && !team2Bye) {

            match.winner = match.team2.team_name;
            match.status = "COMPLETED";

        }

    }

    return matches;

}

module.exports = {
    processByes
};