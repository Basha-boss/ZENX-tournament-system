const { BRACKET_SIZES } = require("./constants");

function getBracketSize(teamCount) {

    for (const size of BRACKET_SIZES) {

        if (teamCount <= size)
            return size;

    }

    throw new Error("Maximum supported teams is 32.");
}

function addByes(seededTeams) {

    const bracketSize = getBracketSize(seededTeams.length);

    const teams = [...seededTeams];

    while (teams.length < bracketSize) {

        teams.push({
            id: null,
            seed: teams.length + 1,
            team_name: "BYE",
            bye: true
        });

    }

    return {
        bracketSize,
        byeCount: bracketSize - seededTeams.length,
        teams
    };
}

module.exports = {
    getBracketSize,
    addByes
};