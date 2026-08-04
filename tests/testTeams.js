require("dotenv").config();

const { connectDatabase } = require("./database/database");
const { getTeamCount } = require("./utils/teamService");

(async () => {

    await connectDatabase();

    const teams = await getTeamCount();

    console.log("Teams:", teams);

})();