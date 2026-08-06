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
        throw new Error("At least 2 teams are required to start the tournament.");
    }

    // Random seeding
    const seededTeams = await generateSeeds(teams);

    // Generate Winner Bracket
    let matches = generateWinnerBracket(seededTeams);

    // Automatically advance teams facing BYEs
    matches = await processByes(matches);

    // Clear previous matches
    await db.run(`DELETE FROM matches`);

    // Save matches
    for (const match of matches) {
        const teamA = match.team1?.team_name || "BYE";
        const teamB = match.team2?.team_name || "BYE";

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
                teamA,
                teamB,
                match.winner,
                `WB-R${match.round}`,
                match.status
            ]
        );
    }

    const bracketSize = matches.length * 2;
    const byeCount = bracketSize - teams.length;

    return {
        teamCount: teams.length,
        bracketSize,
        byeCount
    };
}

module.exports = {
    startTournament
};