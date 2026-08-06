const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    AttachmentBuilder
} = require("discord.js");
const path = require("path");
const fs = require("fs");
const { getDatabase } = require("../database/database");
const syncTeams = require("../utils/syncTeams");
const { generateMMRBracket } = require("../tournament/mmrSeeding");
const { generateBracketImage } = require("../utils/bracketImageGenerator");
const { saveMatches } = require("../tournament/matchManager");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("createbracket")
        .setDescription("Generate and post MMR-paired tournament bracket")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Ephemeral deferred reply so admin command confirmation is private
        await interaction.deferReply({ ephemeral: true });

        try {
            // 1. Sync latest teams and MMR ratings from Google Sheets
            await syncTeams(interaction.client);

            const db = getDatabase();

            // 2. Fetch all registered teams with MMR and Logo
            const teams = await db.all(`
                SELECT id, team_name, mmr, logo
                FROM teams
                WHERE status = 'Registered'
                ORDER BY mmr DESC
            `);

            if (teams.length < 2) {
                return interaction.editReply({
                    content: "❌ Minimum 2 registered teams required to generate a bracket."
                });
            }

            // 3. Generate MMR Bracket Pairings
            const result = await generateMMRBracket(teams);

            // 4. Save matches into SQLite
            await saveMatches(result.matches);

            // 5. Generate Visual Canvas Bracket PNG
            const imagePath = await generateBracketImage(result.matches, "bracket.png");
            const attachment = new AttachmentBuilder(imagePath, { name: "bracket.png" });

            // 6. Build Rich Discord Embed
            const matchPairingsText = result.matches.map((m, idx) => {
                const t1 = m.team1?.team_name || m.team_a || "TBD";
                const t1MMR = m.team1?.mmr ? ` (${m.team1.mmr} MMR)` : "";
                const t2 = m.team2?.team_name || m.team_b || "TBD";
                const t2MMR = m.team2?.mmr ? ` (${m.team2.mmr} MMR)` : "";

                const statusText = m.status === "COMPLETED" ? ` ✅ Winner: **${m.winner}**` : "";
                return `**Match ${idx + 1}**: ${t1}${t1MMR} 🆚 ${t2}${t2MMR}${statusText}`;
            }).join("\n");

            const embed = new EmbedBuilder()
                .setColor("#EAB308")
                .setTitle("🏆 VALORANT SHOWDOWN — TOURNAMENT BRACKET")
                .setDescription(`
# ⚔️ ROUND 1 MATCHUPS (PAIRED BY MMR)

━━━━━━━━━━━━━━━━━━━━━━━━

${matchPairingsText}

━━━━━━━━━━━━━━━━━━━━━━━━
👥 **Teams**: ${result.teamCount} | 📐 **Bracket Size**: ${result.bracketSize} | 🎁 **BYEs**: ${result.byeCount}
`)
                .setImage("attachment://bracket.png")
                .setFooter({ text: "ZENX Esports • MMR Bracket System" })
                .setTimestamp();

            // 7. Route output to BRACKET_CHANNEL_ID
            const targetChannelId = process.env.BRACKET_CHANNEL_ID || process.env.BRACKETS_CHANNEL_ID;
            let targetChannel = null;

            if (targetChannelId) {
                try {
                    targetChannel = await interaction.client.channels.fetch(targetChannelId);
                } catch (err) {
                    console.log("⚠️ Could not fetch BRACKET_CHANNEL_ID:", err.message);
                }
            }

            if (!targetChannel) {
                targetChannel = interaction.channel;
            }

            // Send main embed & attachment to target channel
            const postedMessage = await targetChannel.send({
                embeds: [embed],
                files: [attachment]
            });

            // Save bracket message details to database/bracket.json
            fs.writeFileSync(
                path.join(__dirname, "..", "database", "bracket.json"),
                JSON.stringify(
                    {
                        channelId: targetChannel.id,
                        messageId: postedMessage.id,
                        createdAt: new Date().toISOString()
                    },
                    null,
                    4
                )
            );

            // Private ephemeral reply to Admin
            return interaction.editReply({
                content: `✅ Tournament bracket generated and posted to <#${targetChannel.id}>!`
            });

        } catch (err) {
            console.error("❌ Failed to create bracket:", err);
            return interaction.editReply({
                content: `❌ Failed to create bracket: ${err.message}`
            });
        }
    }
};
