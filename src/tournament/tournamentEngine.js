const { processByes } = require("./byeProcessor");
const { getDatabase } = require("../database/database");
const { generateSeeds } = require("./seeding");
const { generateWinnerBracket } = require("./bracketGenerator");

async function startTournament() {

    const db = getDatabase();

    // Get all registered teams
    const teams = await db.all(`
        SELECT id, team_name
        FROM teams
        WHERE status = 'Registered'
        ORDER BY team_name
    `);

    if (teams.length < 2) {
        throw new Error("At least 2 teams are required.");
    }

    // Random seeding
    const seededTeams = generateSeeds(teams);

    // Generate Winner Bracket
   let matches = generateWinnerBracket(seededTeams);

// Automatically advance teams facing BYEs
matches = await processByes(matches);

    // Clear previous matches
    await db.run(`DELETE FROM matches`);

    // Save matches
    for (const match of matches) {

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
        match.team1.team_name,
        match.team2.team_name,
        match.winner,
        `WB-R${match.round}`,
        match.status
    ]
);
    }

    return {
        teamCount: teams.length,
        bracketSize: matches.length * 2,
        byeCount: (matches.length * 2) - teams.length
    };

}

module.exports = {
    startTournament
};