const { getTeamCount } = require("./teamService");
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const getCountdown = require("./countdown");
const tournament = require("../config/tournament.json");

const DATABASE = path.join(
    __dirname,
    "..",
    "database",
    "liveCountdown.json"
);

let interval = null;

function getChannelId() {
    return (
        process.env.COUNTDOWN_CHANNEL_ID ||
        tournament.channels.countdown ||
        ""
    );
}

function buildEmbed(t, teamCount) {
    const eventDate = new Date(tournament.date);
    const dateFormatted = eventDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
    const timeFormatted = eventDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZoneName: "short"
    });

    return new EmbedBuilder()
        .setColor("#E11D48")
        .setTitle(`🏆 ${tournament.name || "ZENX ESPORTS"}`)
        .setDescription(`
# ⏳ LIVE COUNTDOWN

📅 **${t.days} Days**

🕒 **${t.hours} Hours**

⏰ **${t.minutes} Minutes**

⚡ **${t.seconds} Seconds**

━━━━━━━━━━━━━━━━━━

👥 Teams: **${teamCount} / ${tournament.maxTeams}**

🟢 Registration: **${tournament.status}**

📅 ${dateFormatted}

Host Time: **${timeFormatted}**
`)
        .setTimestamp();
}

async function startAutoCountdown(client) {
    const channelId = getChannelId();

    if (!channelId) {
        console.log("⚠️ COUNTDOWN_CHANNEL_ID is not configured in .env or tournament.json. Auto Countdown skipped.");
        return;
    }

    let channel;
    try {
        channel = await client.channels.fetch(channelId);
    } catch (err) {
        console.log("❌ Failed to fetch Auto Countdown channel:", err.message);
        return;
    }

    if (!channel) {
        console.log("❌ Auto Countdown channel not found.");
        return;
    }

    let message;

    // Load saved message if it exists
    if (fs.existsSync(DATABASE)) {
        try {
            const saved = JSON.parse(fs.readFileSync(DATABASE, "utf8"));

            if (saved.messageId) {
                try {
                    message = await channel.messages.fetch(saved.messageId);
                } catch {
                    console.log("⚠️ Old countdown message not found. Creating a new one...");
                    message = null;
                }
            }
        } catch {}
    }

    // Create message if it doesn't exist
    if (!message) {
        const t = getCountdown();
        const teamCount = await getTeamCount();
        const embed = buildEmbed(t, teamCount);

        try {
            message = await channel.send({
                embeds: [embed]
            });

            fs.writeFileSync(
                DATABASE,
                JSON.stringify({ messageId: message.id }, null, 4)
            );
        } catch (err) {
            console.error("❌ Failed to send initial countdown message:", err.message);
            return;
        }
    }

    console.log("✅ Auto Countdown Started");

    if (interval) clearInterval(interval);

    interval = setInterval(async () => {
        try {
            const t = getCountdown();
            const teamCount = await getTeamCount();
            const embed = buildEmbed(t, teamCount);

            await message.edit({ embeds: [embed] });
        } catch (err) {
            if (err.code === 10008) {
                console.log("⚠️ Countdown message was deleted.");
                clearInterval(interval);
                return;
            }
            console.error("Countdown edit error:", err.message);
        }
    }, 2000);
}

module.exports = startAutoCountdown;