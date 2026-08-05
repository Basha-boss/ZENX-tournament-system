const { addByes } = require("./byeManager");
const { BRACKETS, MATCH_STATUS } = require("./constants");

// Standard bracket seed order
const SEED_ORDERS = {
    4: [1, 4, 2, 3],

    8: [1, 8, 4, 5, 2, 7, 3, 6],

    16: [
        1,16,8,9,
        5,12,4,13,
        6,11,3,14,
        7,10,2,15
    ],

    32: [
        1,32,16,17,
        8,25,9,24,
        5,28,12,21,
        4,29,13,20,
        6,27,11,22,
        3,30,14,19,
        7,26,10,23,
        2,31,15,18
    ]
};

function generateWinnerBracket(seededTeams) {

    const { bracketSize, teams } = addByes(seededTeams);

    const seedOrder = SEED_ORDERS[bracketSize];

    const orderedTeams = seedOrder.map(seed =>
        teams.find(team => team.seed === seed)
    );

    const matches = [];

    let matchNumber = 1;

    for (let i = 0; i < orderedTeams.length; i += 2) {

        matches.push({

            matchId: `WB-R1-M${matchNumber}`,

            bracket: BRACKETS.WINNER,

            round: 1,

            matchNumber,

team1: orderedTeams[i],
team2: orderedTeams[i + 1],

team1Id: orderedTeams[i]?.id ?? null,
team2Id: orderedTeams[i + 1]?.id ?? null,

            winner: null,

            loser: null,

            status: MATCH_STATUS.PENDING

        });

        matchNumber++;
    }

    return matches;
}

module.exports = {
    generateWinnerBracket
};