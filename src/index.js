require('dotenv').config();

const startTeamWatcher = require("./utils/teamWatcher");
const { connectDatabase } = require("./database/database");
const startAutoCountdown = require("./utils/autoCountdown");
const { loadCommands } = require("./handlers/commandHandler");
const fs = require("fs");
const path = require("path");
const updateDashboard = require("./utils/dashboardUpdater");
const updateTeamList = require("./utils/teamListUpdater");

const {
    Client,
    GatewayIntentBits,
    Events,
    EmbedBuilder,
    ActivityType
} = require("discord.js");

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

loadCommands(client);

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
    await updateTeamList(client);
    startTeamWatcher(client);
    await startAutoCountdown(client);
});

// =========================
// INTERACTIONS
// =========================

client.on(Events.InteractionCreate, async (interaction) => {
    // Slash commands
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (command) {
            try {
                return await command.execute(interaction);
            } catch (err) {
                console.error(err);

                if (interaction.deferred || interaction.replied) {
                    return interaction.editReply({ content: "❌ Command failed." });
                }

                return interaction.reply({
                    content: "❌ Command failed.",
                    ephemeral: true
                });
            }
        } else {
            return interaction.reply({
                content: "❌ Unknown command.",
                ephemeral: true
            });
        }
    }

    // Buttons
    if (interaction.isButton()) {
        if (interaction.customId === "rules") {
            try {
                const rulesPath = path.join(__dirname, "config", "rules.md");
                const rules = fs.readFileSync(rulesPath, "utf8");

                const logoPath = path.join(__dirname, "assets", "logo.png");

                const embed = new EmbedBuilder()
                    .setColor("#E11D48")
                    .setTitle("📜 ZENX ESPORTS | VALORANT TOURNAMENT RULEBOOK")
                    .setThumbnail("attachment://logo.png")
                    .setDescription(rules.substring(0, 4000))
                    .setFooter({ text: "Hosted by ZENX Esports" })
                    .setTimestamp();

                await interaction.reply({
                    embeds: [embed],
                    files: fs.existsSync(logoPath) ? [logoPath] : [],
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
                content: "🏆 Bracket will be available once registration closes.",
                ephemeral: true
            });
        }
    }
});

client.login(process.env.TOKEN);