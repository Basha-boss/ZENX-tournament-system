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
        console.log("dashboard.json not found.");
        return;
    }

    const database = JSON.parse(
        fs.readFileSync(databasePath, "utf8")
    );

    if (!database.channelId || !database.messageId) {
        console.log("Dashboard not created yet.");
        return;
    }

    try {

        const channel = await client.channels.fetch(database.channelId);

        if (!channel) return;

        const message = await channel.messages.fetch(database.messageId);

        if (!message) return;

        console.log("✅ Dashboard updater started.");

        if (dashboardInterval) clearInterval(dashboardInterval);

        dashboardInterval = setInterval(async () => {

            try {

                const timer = getCountdown();

                console.log(
    `Updating: ${timer.days}:${timer.hours}:${timer.minutes}:${timer.seconds}`
);
const teamCount = await getTeamCount();

console.log("DASHBOARD TEAM COUNT:", teamCount);

console.log(
    "Dashboard Timer:",
    timer.days,
    timer.hours,
    timer.minutes,
    timer.seconds
);

await generateDashboard({
    console.log(
    "Generated image at:",
    path.join(__dirname, "..", "assets", "dashboard.png")
);


    days: timer.days,
    hours: timer.hours,
    minutes: timer.minutes,
    seconds: timer.seconds,

    teams: teamCount,

    registration: "OPEN",

    date: "8 August 2026",

    time: "7:00 PM IST"

});

     const attachment = new AttachmentBuilder(
    fs.readFileSync(
        path.join(__dirname, "..", "assets", "dashboard.png")
    ),
    {
        name: `dashboard-${Date.now()}.png`
    }
);

console.log("Editing dashboard message...");

await message.edit({
    attachments: [],
    files: [attachment]
});

console.log("Dashboard message updated!");



            } catch (err) {

                console.error("Dashboard Update Error:", err);

            }

        }, 2000);

    } catch (err) {

        console.error("Dashboard Startup Error:", err);

    }

}

module.exports = updateDashboard;