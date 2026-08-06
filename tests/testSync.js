require("dotenv").config();

const { connectDatabase } = require("../src/database/database");
const syncTeams = require("../src/utils/syncTeams");

(async () => {
    try {
        await connectDatabase();
        const imported = await syncTeams();
        console.log(`✅ Imported ${imported} new teams.`);
    } catch (err) {
        console.error("Sync Test Error:", err);
    }
})();