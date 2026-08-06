require("dotenv").config();

const { connectDatabase } = require("../src/database/database");
const { getTeamCount } = require("../src/utils/teamService");

(async () => {
    try {
        await connectDatabase();
        const count = await getTeamCount();
        console.log("Team Count:", count);
    } catch (err) {
        console.error("Teams Test Error:", err);
    }
})();