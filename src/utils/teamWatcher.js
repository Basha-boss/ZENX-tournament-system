const syncTeams = require("./syncTeams");

function startTeamWatcher(client) {

    console.log("✅ Team Watcher Started");

    setInterval(async () => {

        try {

            const imported = await syncTeams(client);

            if (imported > 0) {

                console.log(`🎉 ${imported} new team(s) imported.`);

            }

        } catch (err) {

            console.error(err);

        }

    }, 10000); // Every 10 seconds

}

module.exports = startTeamWatcher;