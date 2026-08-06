const { getDatabase } = require("../database/database");

/**
 * Fisher-Yates Shuffle
 */
function shuffleTeams(teams) {
    const shuffled = [...teams];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

async function generateSeeds(providedTeams) {
    let teams = providedTeams;

    if (!teams || !teams.length) {
        const db = getDatabase();
        teams = await db.all(`
            SELECT *
            FROM teams
            WHERE status = 'Registered'
            ORDER BY id ASC
        `);
    }

    if (teams.length < 2) {
        throw new Error("Minimum 2 teams required to generate seeds.");
    }

    const shuffled = shuffleTeams(teams);

    const seeded = shuffled.map((team, index) => ({
        ...team,
        seed: index + 1
    }));

    console.log(`✅ ${seeded.length} teams seeded.`);

    return seeded;
}

module.exports = {
    generateSeeds
};