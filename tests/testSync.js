require("dotenv").config();

const { connectDatabase } = require("./database/database");
const syncTeams = require("./utils/syncTeams");

(async () => {

    await connectDatabase();

    const imported = await syncTeams();

    console.log(`✅ Imported ${imported} new teams.`);

})();