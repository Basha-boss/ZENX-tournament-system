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
const tournament = require("./config/tournament.json");

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

console.log(`✅ Logged in as ${client.user.tag}`);

client.user.setActivity("🏆 VALORANT SHOWDOWN", {
    type: ActivityType.Watching
});

await updateDashboard(client);

startTeamWatcher(client);

await startAutoCountdown(client);

});

// =========================
// INTERACTIONS
// =========================

client.on(Events.InteractionCreate, async (interaction) => {

    // Slash Commands
    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === "dashboard") {

            await interaction.deferReply({ ephemeral: false });

  
    const timer = getCountdown();

 const eventDate = new Date(tournament.date);

await generateDashboard({
    days: timer.days,
    hours: timer.hours,
    minutes: timer.minutes,
    seconds: timer.seconds,

    teams: await getTeamCount(),
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
    "assets",
    "dashboard.png"
);

const attachment = new AttachmentBuilder(dashboardPath);

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

            await interaction.deferReply({
    ephemeral: false
});
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

    if (t.live) {
        return "🔴 Tournament is LIVE!";
    }

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

            const buttons = new ActionRowBuilder()

                .addComponents(

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

await interaction.editReply({

    embeds: [embed],

    components: [buttons],

    files: ["./assets/logo.png"]

});

const message = await interaction.fetchReply();

const tournamentData = {
    channelId: interaction.channel.id,
    messageId: message.id
};
fs.writeFileSync(
    path.join(__dirname, "database", "tournament.json"),
    JSON.stringify(tournamentData, null, 4)
);
console.log("✅ Tournament message created.");

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
const logoPath = path.join(
    __dirname,
    "assets",
    "logo.png"
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

    await interaction.reply({
        embeds: [embed],
        files: [logoPath],
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