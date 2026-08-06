const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder, MessageFlags } = require("discord.js");
const path = require("path");
const fs = require("fs");
const { getDatabase } = require("../database/database");
const { MATCH_STATUS } = require("../tournament/constants");
const { generateBracketImage } = require("../utils/bracketImageGenerator");

async function updateLiveBracketOnDiscord(client) {
    if (!client) return;

    const bracketChannelId = process.env.BRACKET_CHANNEL_ID || process.env.BRACKETS_CHANNEL_ID;
    if (!bracketChannelId) return;

    try {
        const channel = await client.channels.fetch(bracketChannelId);
        if (!channel) return;

        const db = getDatabase();
        const matches = await db.all(`SELECT * FROM matches ORDER BY id ASC`);

        if (matches.length === 0) return;

        const imagePath = await generateBracketImage(matches, "bracket.png");
        const attachment = new AttachmentBuilder(imagePath, { name: "bracket.png" });

        const bracketJsonPath = path.join(__dirname, "..", "database", "bracket.json");
        let savedData = null;
        if (fs.existsSync(bracketJsonPath)) {
            try {
                savedData = JSON.parse(fs.readFileSync(bracketJsonPath, "utf8"));
            } catch {}
        }

        if (savedData && savedData.messageId) {
            try {
                const message = await channel.messages.fetch(savedData.messageId);
                if (message && typeof message.edit === "function") {
                    await message.edit({
                        files: [attachment]
                    });
                    console.log("✅ Master Bracket Image updated live on Discord.");
                }
            } catch (err) {
                console.log("⚠️ Could not edit existing bracket message:", err.message);
            }
        }
    } catch (err) {
        console.log("⚠️ Could not update bracket on Discord:", err.message);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("resetmatch")
        .setDescription("Reset a completed match back to Pending status and update bracket")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addIntegerOption(option =>
            option.setName("matchid")
                .setDescription("Match Number (e.g. 1, 2, 3...)")
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const matchId = interaction.options.getInteger("matchid");
        const db = getDatabase();

        try {
            // 1. Try finding match by DB id
            let match = await db.get("SELECT * FROM matches WHERE id = ?", [matchId]);

            // 2. Fallback to 1-indexed match position
            if (!match) {
                const allMatches = await db.all("SELECT * FROM matches ORDER BY id ASC");
                if (allMatches.length >= matchId) {
                    match = allMatches[matchId - 1];
                }
            }

            if (!match) {
                return interaction.editReply({
                    content: `❌ Match #${matchId} not found.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            const previousWinner = match.winner;

            // Reset match status, winner, and scores
            await db.run(
                "UPDATE matches SET winner = NULL, status = ?, score_a = 0, score_b = 0 WHERE id = ?",
                [MATCH_STATUS.PENDING, match.id]
            );

            // Clear previous winner from any advanced round slots if present
            if (previousWinner) {
                await db.run(
                    "UPDATE matches SET team_a = 'TBD' WHERE LOWER(team_a) = LOWER(?)",
                    [previousWinner]
                );
                await db.run(
                    "UPDATE matches SET team_b = 'TBD' WHERE LOWER(team_b) = LOWER(?)",
                    [previousWinner]
                );
            }

            // Automatically update live master bracket image on Discord (in BRACKET_CHANNEL_ID)
            await updateLiveBracketOnDiscord(interaction.client);

            return interaction.editReply({
                content: `🔄 Match **#${matchId}** (${match.team_a} vs ${match.team_b}) reset to **PENDING** and live bracket updated!`,
                flags: MessageFlags.Ephemeral
            });
        } catch (err) {
            console.error("Reset match error:", err);
            return interaction.editReply({
                content: `❌ Failed to reset match: ${err.message}`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
