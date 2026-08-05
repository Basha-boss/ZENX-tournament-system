const { getDatabase } = require("../database/database");

async function getTeamCount() {
    try {
        const db = getDatabase();

        const result = await db.get(
            "SELECT COUNT(*) AS total FROM teams"
        );

        return result?.total || 0;

    } catch (err) {

        console.error("❌ Failed to get team count");
        console.error(err.stack || err);

        return 0;
    }
}

module.exports = {
    getTeamCount
};