const { getTeams } = require("./utils/googleSheets");

(async () => {

    try {

        const teams = await getTeams();

        console.log(teams);

    } catch (err) {

        console.error(err);

    }

})();