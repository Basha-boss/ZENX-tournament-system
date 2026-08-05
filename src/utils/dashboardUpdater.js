const tournament = require("../config/tournament.json");
const { getTeamCount } = require("./teamService");
const fs = require("fs");
const path = require("path");

const { AttachmentBuilder } = require("discord.js");

const getCountdown = require("./countdown");
const generateDashboard = require("./imageGenerator");

let dashboardInterval = null;

async function updateDashboard(client) {

    const databasePath = path.join(
        __dirname,
        "..",
        "database",
        "dashboard.json"
    );

    if (!fs.existsSync(databasePath)) {
        console.log("❌ dashboard.json not found.");
        return;
    }

    const database = JSON.parse(
        fs.readFileSync(databasePath, "utf8")
    );

    if (!database.channelId || !database.messageId) {
        console.log("❌ Dashboard not created yet.");
        return;
    }

    try {

        const channel = await client.channels.fetch(database.channelId);

        if (!channel) {
            console.log("❌ Dashboard channel not found.");
            return;
        }

        const message = await channel.messages.fetch(database.messageId);

        if (!message) {
            console.log("❌ Dashboard message not found.");
            return;
        }

        console.log("✅ Dashboard updater started.");
        console.log(`📢 Channel: ${database.channelId}`);
        console.log(`📝 Message: ${database.messageId}`);

        if (dashboardInterval) {
            clearInterval(dashboardInterval);
        }

        async function refreshDashboard() {

            try {

                const timer = getCountdown();
                const teamCount = await getTeamCount();

                console.log(
                    `📊 Teams: ${teamCount}/${tournament.maxTeams} | ⏳ ${timer.days}d ${timer.hours}h ${timer.minutes}m ${timer.seconds}s`
                );

                const eventDate = new Date(tournament.date);

                console.log("🖼 Generating dashboard image...");

                await generateDashboard({
                    days: timer.days,
                    hours: timer.hours,
                    minutes: timer.minutes,
                    seconds: timer.seconds,

                    teams: teamCount,
                    maxTeams: tournament.maxTeams,

                    registration: tournament.status,

                    date: eventDate.toLocaleDateString("en-GB"),

                    time: eventDate.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true
                    }),

                    output: "dashboard.png"
                });

                const attachment = new AttachmentBuilder(
                    fs.readFileSync(
                        path.join(
                            __dirname,
                            "..",
                            "assets",
                            "dashboard.png"
                        )
                    ),
                    {
                        name: "dashboard.png"
                    }
                );

                await message.edit({
                    attachments: [],
                    files: [attachment]
                });

                console.log(
                    `✅ Dashboard Updated | ${teamCount}/${tournament.maxTeams} Teams`
                );

            } catch (err) {

                console.error("❌ Dashboard Update Error");
                console.error(err.stack || err);

            }

        }

        // Update immediately when bot starts
        await refreshDashboard();

        // Continue updating every 30 seconds
        dashboardInterval = setInterval(refreshDashboard, 30000);

    } catch (err) {

        console.error("❌ Dashboard Startup Error");
        console.error(err.stack || err);

    }

}

module.exports = updateDashboard;