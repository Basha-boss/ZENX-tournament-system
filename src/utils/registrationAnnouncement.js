const {
    EmbedBuilder
} = require("discord.js");

const { getTeamCount } = require("./teamService");

async function sendRegistrationAnnouncement(client, team) {

    try {

        const channel = await client.channels.fetch(
            process.env.TEAM_REGISTRATION_CHANNEL
        );

        if (!channel) return;

        const totalTeams = await getTeamCount();

        const embed = new EmbedBuilder()

            .setColor("#E11D48")

            .setTitle("🎉 NEW TEAM REGISTERED")

            .setDescription(`
🏆 **Team**
${team.teamName}

👤 **Manager**
${team.manager || "N/A"}

🎯 **Coach**
${team.coach || "N/A"}

👑 **Captain**
${team.captain || "N/A"}

━━━━━━━━━━━━━━━━━━

📈 **Current Teams**
${totalTeams} / 32

🕒 **Registered**
${team.timestamp || "Today"}

━━━━━━━━━━━━━━━━━━
`)

            .setFooter({
                text: "ZENX Esports"
            })

            .setTimestamp();

        await channel.send({
            embeds: [embed]
        });

    } catch (err) {

        console.error("Registration Announcement Error:", err);

    }

}

module.exports = sendRegistrationAnnouncement;