const {
    SlashCommandBuilder,
    AttachmentBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const getCountdown = require("../utils/countdown");
const generateDashboard = require("../utils/imageGenerator");
const { getTeamCount } = require("../utils/teamService");
const tournament = require("../config/tournament.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("dashboard")
        .setDescription("Create the live tournament dashboard"),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

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

        const dashboardPath = path.join(
            __dirname,
            "..",
            "assets",
            "dashboard.png"
        );

        const attachment = new AttachmentBuilder(dashboardPath);

        const message = await interaction.channel.send({
            files: [attachment]
        });

        const data = {
            channelId: interaction.channel.id,
            messageId: message.id
        };

        fs.writeFileSync(
            path.join(__dirname, "..", "database", "dashboard.json"),
            JSON.stringify(data, null, 4)
        );

        await interaction.editReply({
            content: "✅ Live dashboard created successfully."
        });
    }
};