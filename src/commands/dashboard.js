const {
    SlashCommandBuilder,
    AttachmentBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const getCountdown = require("../utils/countdown");
const generateDashboard = require("../utils/imageGenerator");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("dashboard")
        .setDescription("Create the live tournament dashboard"),

    async execute(interaction) {

        const timer = getCountdown();

        await generateDashboard({
            days: timer.days,
            hours: timer.hours,
            minutes: timer.minutes,
            seconds: timer.seconds,

            teams: 0,
            registration: "OPEN",
            date: "8 August 2026",
            time: "7:00 PM IST"
        });

        const attachment = new AttachmentBuilder("./assets/dashboard.png");

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

        await interaction.reply({
            content: "✅ Live dashboard created successfully.",
            ephemeral: true
        });

    }
};