const { BRACKET_SIZES } = require("./constants");

function getBracketSize(teamCount) {

    console.log("teamCount =", teamCount);
    console.log("BRACKET_SIZES =", BRACKET_SIZES);

    for (const size of BRACKET_SIZES) {

        if (teamCount <= size) {
            console.log("Selected bracket size:", size);
            return size;
        }

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