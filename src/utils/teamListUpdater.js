const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");
const { getDatabase } = require("../database/database");
const tournament = require("../config/tournament.json");

const DATABASE_FILE = path.join(
    __dirname,
    "..",
    "database",
    "teamList.json"
);

function getTargetChannelId() {
    return (
        process.env.TEAM_LIST_CHANNEL_ID ||
        process.env.TEAM_REGISTRATION_CHANNEL ||
        tournament.channels.registration ||
        ""
    );
}

async function updateTeamList(client) {
    if (!client) return;

    const channelId = getTargetChannelId();

    if (!channelId) {
        console.log("⚠️ TEAM_LIST_CHANNEL_ID / TEAM_REGISTRATION_CHANNEL not set. Roster feed skipped.");
        return;
    }

    let channel;
    try {
        channel = await client.channels.fetch(channelId);
    } catch (err) {
        console.log("❌ Failed to fetch Team List channel:", err.message);
        return;
    }

    if (!channel) return;

    const db = getDatabase();

    const teams = await db.all(`
        SELECT id, team_name, manager, captain, mmr, created_at
        FROM teams
        WHERE status = 'Registered'
        ORDER BY id ASC
    `);

    const totalRegisteredTeams = teams.length;
    let teamRosterText = "";

    if (totalRegisteredTeams === 0) {
        teamRosterText = "*No teams registered yet.*";
    } else {
        teamRosterText = teams.map((team, index) => {
            const mmrText = team.mmr > 0 ? ` | MMR: **${team.mmr}**` : "";
            const captainText = team.captain ? ` (Captain: ${team.captain})` : "";
            return `**${index + 1}. ${team.team_name}**${captainText}${mmrText}`;
        }).join("\n");
    }

    const embed = new EmbedBuilder()
        .setColor("#E11D48")
        .setTitle("📋 REGISTERED TEAMS ROSTER")
        .setDescription(`
# 🏆 ${tournament.name || "VALORANT SHOWDOWN"}

━━━━━━━━━━━━━━━━━━━━━━━━

${teamRosterText}

━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Total Registered Teams**: **${totalRegisteredTeams} / ${tournament.maxTeams}**
`)
        .setFooter({ text: "ZENX Esports • Live Team Roster Feed" })
        .setTimestamp();

    let savedData = { channelId: "", messageId: "" };

    if (fs.existsSync(DATABASE_FILE)) {
        try {
            savedData = JSON.parse(fs.readFileSync(DATABASE_FILE, "utf8"));
        } catch {}
    }

    let message;

    if (savedData.messageId) {
        try {
            message = await channel.messages.fetch(savedData.messageId);
        } catch {
            message = null;
        }
    }

    if (message && typeof message.edit === "function") {
        try {
            await message.edit({ embeds: [embed] });
            console.log(`✅ Live Team Roster updated (${totalRegisteredTeams}/${tournament.maxTeams} teams).`);
            return;
        } catch (err) {
            console.log("⚠️ Could not edit existing roster message, posting a new one:", err.message);
        }
    }

    try {
        message = await channel.send({ embeds: [embed] });

        fs.writeFileSync(
            DATABASE_FILE,
            JSON.stringify(
                {
                    channelId: channel.id,
                    messageId: message.id
                },
                null,
                4
            )
        );

        console.log(`✅ Live Team Roster posted (${totalRegisteredTeams}/${tournament.maxTeams} teams).`);
    } catch (err) {
        console.error("❌ Failed to send Team Roster embed:", err.message);
    }
}

module.exports = updateTeamList;
