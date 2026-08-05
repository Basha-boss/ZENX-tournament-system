const tournament = require("../config/tournament.json");
const { getTeamCount } = require("./teamService");
const fs = require("fs");
const path = require("path");

const { AttachmentBuilder } = require("discord.js");
;
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

// Create dashboard.json if it doesn't exist
if (!fs.existsSync(databasePath)) {
    fs.writeFileSync(
        databasePath,
        JSON.stringify(
            {
                channelId: "",
                messageId: ""
            },
            null,
            4
        )
    );
}


    const database = JSON.parse(
        fs.readFileSync(databasePath, "utf8")
    );

    
    try {

const DASHBOARD_CHANNEL_ID = process.env.DASHBOARD_CHANNEL_ID;

const channel = await client.channels.fetch(DASHBOARD_CHANNEL_ID);



        if (!channel) {
            console.log("❌ Dashboard channel not found.");
            return;
        }

let message;

try {

    if (database.messageId) {
        message = await channel.messages.fetch(database.messageId);
    }

} catch {

    message = null;

 

console.log("📊 Creating dashboard automatically...");

// Generate the dashboard image first
const timer = getCountdown();
const teamCount = await getTeamCount();
const eventDate = new Date(tournament.date);

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
    path.join(__dirname, "..", "assets", "dashboard.png"),
    {
        name: "dashboard.png"
    }
);
message = await channel.send({
    files: [attachment]
});

// Save the new message ID
database.channelId = channel.id;
database.messageId = message.id;

fs.writeFileSync(
    databasePath,
    JSON.stringify(database, null, 4)
);

}

if (!message) {

    console.log("📊 Creating dashboard automatically...");

    const timer = getCountdown();
    const teamCount = await getTeamCount();
    const eventDate = new Date(tournament.date);

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
        path.join(__dirname, "..", "assets", "dashboard.png")
    );

    message = await channel.send({
        files: [attachment]
    });

    database.channelId = channel.id;
    database.messageId = message.id;

    fs.writeFileSync(
        databasePath,
        JSON.stringify(database, null, 4)
    );
}

console.log("✅ Dashboard updater started.");
console.log(`📢 Channel: ${channel.id}`);
console.log(`📝 Message: ${message.id}`);

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
    path.join(__dirname, "..", "assets", "dashboard.png"),
    {
        name: "dashboard.png"
    }
);



          // Always fetch the latest message before editing


const liveMessage = await channel.messages.fetch(message.id);



if (!liveMessage || typeof liveMessage.edit !== "function") {
    throw new Error("Fetched object is not a Discord Message.");
}

await liveMessage.edit({
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