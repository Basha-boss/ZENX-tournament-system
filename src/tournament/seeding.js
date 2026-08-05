const { getDatabase } = require("../database/database");

/**
 * Fisher-Yates Shuffle
 */
function shuffleTeams(teams) {
    const shuffled = [...teams];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[j]] = [
            shuffled[j],
            shuffled[i]
        ];
    }

    return shuffled;
}

async function generateSeeds() {

    const db = getDatabase();

    const teams = await db.all(`
        SELECT *
        FROM teams
        WHERE status='Registered'
        ORDER BY id ASC
    `);

    if (teams.length < 4) {
        throw new Error("Minimum 4 teams required.");
    }

    const shuffled = shuffleTeams(teams);

    for (let i = 0; i < shuffled.length; i++) {

        await db.run(
            `UPDATE teams SET seed=? WHERE id=?`,
            [i + 1, shuffled[i].id]
        );

        shuffled[i].seed = i + 1;
    }

    console.log(`✅ ${shuffled.length} teams seeded.`);

    return shuffled;
}

module.exports = {
    generateSeeds
};