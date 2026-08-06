const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    AttachmentBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const getCountdown = require("../utils/countdown");
const { getTeamCount } = require("../utils/teamService");
const tournament = require("../config/tournament.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("tournament")
        .setDescription("Display tournament information and rules"),

    async execute(interaction) {
        await interaction.deferReply();

        const teamCount = await getTeamCount();
        const eventDate = new Date(tournament.date);

        const embed = new EmbedBuilder()
            .setColor("#E11D48")
            .setTitle("🏆 ZENX ESPORTS")
            .setThumbnail("attachment://logo.png")
            .setDescription(`
# VALORANT COMMUNITY TOURNAMENT

━━━━━━━━━━━━━━━━━━━━━━━━

⏳ **Tournament Starts In**

${(() => {
    const t = getCountdown();
    if (t.live) return "🔴 Tournament is LIVE!";
    return `${t.days} Days ${t.hours} Hours ${t.minutes} Minutes ${t.seconds} Seconds`;
})()}

━━━━━━━━━━━━━━━━━━━━━━━━

👥 **Teams**
**${teamCount} / ${tournament.maxTeams}**

📅 **Date**
${eventDate.toLocaleDateString("en-GB")}

🕖 **Time**
${eventDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
})}

💸 **Entry Fee**
FREE

🏆 **Prize**
${tournament.prize}

🗺️ **Map Pool**
Current Competitive Rotation

━━━━━━━━━━━━━━━━━━━━━━━━

Hosted by **ZENX Esports**
`)
            .setFooter({
                text: "ZENX Esports"
            })
            .setTimestamp();

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("📝 Register")
                .setStyle(ButtonStyle.Link)
                .setURL(tournament.registration.googleForm),

            new ButtonBuilder()
                .setCustomId("rules")
                .setLabel("📜 Rules")
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId("bracket")
                .setLabel("🏆 Bracket")
                .setStyle(ButtonStyle.Success)
        );

        const logoPath = path.join(__dirname, "..", "assets", "logo.png");

        await interaction.editReply({
            embeds: [embed],
            components: [buttons],
            files: fs.existsSync(logoPath) ? [logoPath] : []
        });

        try {
            const message = await interaction.fetchReply();

            fs.writeFileSync(
                path.join(__dirname, "..", "database", "tournament.json"),
                JSON.stringify(
                    {
                        channelId: interaction.channel.id,
                        messageId: message.id
                    },
                    null,
                    4
                )
            );

            console.log("✅ Tournament message saved.");
        } catch (err) {
            console.error("❌ Failed to save tournament message:", err);
        }
    }
};
