const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const path = require("path");
const fs = require("fs");
const { getDatabase } = require("../database/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("resetallmatch")
        .setDescription("Reset all tournament matches and bracket data for testing")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const db = getDatabase();

        try {
            // Delete all records from matches table in SQLite
            await db.run("DELETE FROM matches");

            // Reset bracket.json
            const bracketJsonPath = path.join(__dirname, "..", "database", "bracket.json");
            if (fs.existsSync(bracketJsonPath)) {
                try {
                    fs.unlinkSync(bracketJsonPath);
                } catch {}
            }

            return interaction.editReply({
                content: "🔄 **All tournament matches and bracket data have been completely reset!** You can now run `/createbracket` to test again from scratch.",
                flags: MessageFlags.Ephemeral
            });
        } catch (err) {
            console.error("Reset all matches error:", err);
            return interaction.editReply({
                content: `❌ Failed to reset all matches: ${err.message}`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
