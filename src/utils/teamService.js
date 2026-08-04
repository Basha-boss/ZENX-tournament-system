const { getDatabase } = require("../database/database");

async function getTeamCount() {
    const db = getDatabase();

    if (!db) {
        throw new Error("Database is not connected. Did you call connectDatabase() first?");
    }

    const result = await db.get(
        "SELECT COUNT(*) AS total FROM teams"
    );

    return result.total;
}

module.exports = {
    getTeamCount
};