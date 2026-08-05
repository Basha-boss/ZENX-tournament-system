const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require("discord.js");

const { startTournament } = require("../tournament/tournamentEngine");

module.exports = {

    data: new SlashCommandBuilder()
        .setName("starttournament")
        .setDescription("Start the tournament")
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),

    async execute(interaction) {

        await interaction.deferReply();

        try {

            const result = await startTournament();

            await interaction.editReply({

                content:
`🏆 Tournament Started!

Teams: ${result.teamCount}
Bracket Size: ${result.bracketSize}
BYEs: ${result.byeCount}

Winner Bracket Created Successfully.`

            });

        } catch (err) {

            console.error(err);

            await interaction.editReply({
                content: "❌ Failed to start tournament."
            });

        }

    }

};