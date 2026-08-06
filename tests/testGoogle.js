const { getTeams } = require("../src/utils/googleSheets");

(async () => {
    try {
        const teams = await getTeams();
        console.log("Teams from Google Sheets:", teams);
    } catch (err) {
        console.error("Google Sheets Test Error:", err);
    }
})();