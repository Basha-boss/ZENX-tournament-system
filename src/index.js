require('dotenv').config();

const { getTeamCount } = require("./utils/teamService");
const startTeamWatcher = require("./utils/teamWatcher");
const { connectDatabase } = require("./database/database");
const startAutoCountdown = require("./utils/autoCountdown");
const fs = require("fs");
const path = require("path");
const getCountdown = require("./utils/countdown");
const generateDashboard = require("./utils/imageGenerator");
const updateDashboard = require("./utils/dashboardUpdater");

const  {
    Client,
    GatewayIntentBits,
    Events,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActivityType,
    AttachmentBuilder
} = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

// =========================
// BOT READY
// =========================

client.once(Events.ClientReady, async (client) => {
   

    await connectDatabase(); 

    startTeamWatcher(client);

    console.log(`✅ Logged in as ${client.user.tag}`);

    client.user.setActivity("🏆 VALORANT SHOWDOWN", {
        type: ActivityType.Watching
    });
      await updateDashboard(client);
      
      await startAutoCountdown(client);
});

// =========================
// INTERACTIONS
// =========================

client.on(Events.InteractionCreate, async (interaction) => {

    // Slash Commands
    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === "dashboard") {

            await interaction.deferReply({ ephemeral: true });

  
    const timer = getCountdown();

    await generateDashboard({
        days: timer.days,
        hours: timer.hours,
        minutes: timer.minutes,
        seconds: timer.seconds,
        teams: await getTeamCount(),
        registration: "OPEN",
        date: "8 August 2026",
        time: "7:00 PM IST"
    });

    const attachment = new AttachmentBuilder("./assets/dashboard.png");

    const message = await interaction.channel.send({
        files: [attachment]
    });

    const dashboardData = {
        channelId: interaction.channel.id,
        messageId: message.id
    };

    fs.writeFileSync(
        path.join(__dirname, "database", "dashboard.json"),
        JSON.stringify(dashboardData, null, 4)
    );

    return interaction.editReply({
        content: "✅ Live dashboard created successfully.",
    });
}
        if (interaction.commandName === "tournament") {

            await interaction.deferReply();
            const teamCount = await getTeamCount();
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

    if (t.live) {
        return "🔴 Tournament is LIVE!";
    }

    return `${t.days} Days ${t.hours} Hours ${t.minutes} Minutes ${t.seconds} Seconds`;
})()}

━━━━━━━━━━━━━━━━━━━━━━━━

👥 **Teams**
**${teamCount} / 32**

📅 **Date**
8 August 2026

🕖 **Time**
7:00 PM IST

💸 **Entry Fee**
FREE

🏆 **Prize**
Community Tournament

🗺️ **Map Pool**
Current Competitive Rotation

━━━━━━━━━━━━━━━━━━━━━━━━

Hosted by **ZENX Esports**
`)

                .setFooter({
                    text: "ZENX Esports"
                })

                .setTimestamp();

            const buttons = new ActionRowBuilder()

                .addComponents(

                    new ButtonBuilder()

                        .setLabel("📝 Register")

                        .setStyle(ButtonStyle.Link)

                        .setURL("https://docs.google.com/forms/d/e/1FAIpQLSe7baOq1Ip4bML4yyfhsyqxckgCHyHnKf-LgfIou9skUxeuIQ/viewform"),

                    new ButtonBuilder()

                        .setCustomId("rules")

                        .setLabel("📜 Rules")

                        .setStyle(ButtonStyle.Secondary),

                    new ButtonBuilder()

                        .setCustomId("bracket")

                        .setLabel("🏆 Bracket")

                        .setStyle(ButtonStyle.Success)

                );

           const message = await interaction.editReply({

    embeds: [embed],

    components: [buttons],

    files: ["./assets/logo.png"]

});

const tournamentData = {
    channelId: interaction.channel.id,
    messageId: message.id
};

fs.writeFileSync(
    path.join(__dirname, "database", "tournament.json"),
    JSON.stringify(tournamentData, null, 4)
);

        }

    }

    // =========================
    // BUTTONS
    // =========================

    if (interaction.isButton()) {

        if (interaction.customId === "rules") 
        {
            try {

    const rules = fs.readFileSync(
        path.join(__dirname, "config", "rules.md"),
        "utf8"
    );

    const embed = new EmbedBuilder()
        .setColor("#E11D48")
        .setTitle("📜 ZENX ESPORTS | VALORANT TOURNAMENT RULEBOOK")
        .setThumbnail("attachment://logo.png")
        .setDescription(rules.substring(0, 4000))
        .setFooter({
            text: "Hosted by ZENX Esports"
        })
        .setTimestamp();

    await interaction.editReply({
        embeds: [embed],
        components: [buttons],
        files: ["./assets/logo.png"],
        ephemeral: true
    });

} catch (err) {

    console.error(err);

    await interaction.reply({
        content: "❌ Unable to load tournament rules.",
        ephemeral: true
    });

}
        }

        if (interaction.customId === "bracket") {

            await interaction.reply({

                ephemeral: true,

                content: "🏆 Bracket will be available once registration closes."

            });

        }

    }

});

client.login(process.env.TOKEN);