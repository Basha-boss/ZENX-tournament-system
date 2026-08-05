const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { startTournament } = require("../../tournament/tournamentEngine");

module.exports = {

    data: new SlashCommandBuilder()
        .setName("starttournament")
        .setDescription("Start the tournament.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {

        await interaction.deferReply();

        try {

            const matches = await startTournament();

            await interaction.editReply({
                content:
                    `🏆 Tournament started successfully!\n\n` +
                    `✅ ${matches.length} matches generated.`
            });

        } catch (err) {

            console.error(err);

            await interaction.editReply({
                content: "❌ Failed to start tournament."
            });

        }

    }

};