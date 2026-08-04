const { getTeamCount } = require("./teamService");
const fs = require("fs");
const path = require("path");
const {
    EmbedBuilder
} = require("discord.js");

const getCountdown = require("./countdown");

const CHANNEL_ID = "1533206589480243342";

const DATABASE = path.join(
    __dirname,
    "..",
    "database",
    "liveCountdown.json"
);

let interval = null;

async function startAutoCountdown(client) {

    let message;

    // Load saved message if it exists
    if (fs.existsSync(DATABASE)) {

        try {

            const saved = JSON.parse(
                fs.readFileSync(DATABASE, "utf8")
            );

        if (saved.messageId) {
    try {
        const channel = await client.channels.fetch(CHANNEL_ID);

        message = await channel.messages.fetch(saved.messageId);

    } catch (err) {
        console.log("⚠️ Old countdown message not found. Creating a new one...");
        message = null;
    }
}

        } catch {}

    }

    const channel =
        await client.channels.fetch(CHANNEL_ID);

    // Create message if it doesn't exist
    if (!message) {

        const t = getCountdown();

        const teamCount = await getTeamCount();

        console.log("AUTO COUNTDOWN TEAM COUNT:", teamCount);
        
        const embed = new EmbedBuilder()
            .setColor("#E11D48")
            .setTitle("🏆 ZENX ESPORTS")
            .setDescription(`
# ⏳ LIVE COUNTDOWN

📅 **${t.days} Days**

🕒 **${t.hours} Hours**

⏰ **${t.minutes} Minutes**

⚡ **${t.seconds} Seconds**

━━━━━━━━━━━━━━━━━━

👥 Teams: **${teamCount} / 32**

🟢 Registration: **OPEN**

📅 8 August 2026

🕖 7:00 PM IST
`)
            .setTimestamp();

        message = await channel.send({
            embeds: [embed]
        });

        fs.writeFileSync(
            DATABASE,
            JSON.stringify(
                {
                    messageId: message.id
                },
                null,
                4
            )
        );

    }

    console.log("✅ Auto Countdown Started");

    if (interval)
        clearInterval(interval);

    interval = setInterval(async () => {

        try {

          const t = getCountdown();
const teamCount = await getTeamCount();

console.log("AUTO COUNTDOWN TEAM COUNT:", teamCount);

const embed = new EmbedBuilder()
                .setColor("#E11D48")
                .setTitle("🏆 ZENX ESPORTS")
                .setDescription(`
# ⏳ LIVE COUNTDOWN

📅 **${t.days} Days**

🕒 **${t.hours} Hours**

⏰ **${t.minutes} Minutes**

⚡ **${t.seconds} Seconds**

━━━━━━━━━━━━━━━━━━

👥 Teams: **${teamCount} / 32**

🟢 Registration: **OPEN**

📅 8 August 2026

🕖 7:00 PM IST
`)
                .setTimestamp();

            await message.edit({
                embeds: [embed]
            });

      } catch (err) {

    if (err.code === 10008) {
        console.log("⚠️ Countdown message was deleted.");
        clearInterval(interval);
        return;
    }

    console.error(err);

}

    }, 2000);

}

module.exports = startAutoCountdown;