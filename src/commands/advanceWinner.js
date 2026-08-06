const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, MessageFlags } = require("discord.js");
const path = require("path");
const fs = require("fs");
const { getDatabase } = require("../database/database");
const { advanceWinner } = require("../tournament/progression");
const { generateMatchResultImage } = require("../utils/matchResultImageGenerator");
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
                    console.log("✅ Live master bracket message updated in BRACKET_CHANNEL_ID.");
                    return;
                }
            } catch (err) {
                console.log("⚠️ Could not edit existing bracket message, posting new one:", err.message);
            }
        }

        // If no message or edit failed, post a new bracket message to BRACKET_CHANNEL_ID
        const embed = new EmbedBuilder()
            .setColor("#EAB308")
            .setTitle("🏆 VALORANT SHOWDOWN — UPDATED TOURNAMENT BRACKET")
            .setDescription("# ⚔️ LIVE TOURNAMENT BRACKET UPDATE\n\nThe tournament bracket has been updated with the latest match winners!")
            .setImage("attachment://bracket.png")
            .setFooter({ text: "ZENX Esports • MMR Bracket System" })
            .setTimestamp();

        const posted = await channel.send({
            embeds: [embed],
            files: [attachment]
        });

        fs.writeFileSync(
            bracketJsonPath,
            JSON.stringify(
                {
                    channelId: channel.id,
                    messageId: posted.id,
                    updatedAt: new Date().toISOString()
                },
                null,
                4
            )
        );
        console.log("✅ Posted updated bracket image to BRACKET_CHANNEL_ID.");
    } catch (err) {
        console.log("⚠️ Could not update bracket on Discord:", err.message);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("advancewinner")
        .setDescription("Advance a team as winner of a match")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addIntegerOption(option =>
            option.setName("matchid")
                .setDescription("Match Number (e.g. 1, 2, 3...)")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("winner")
                .setDescription("Exact name of the winning team")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("winner_rounds")
                .setDescription("Rounds/Games won by the winning team (e.g. 13 or 2)")
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName("loser_rounds")
                .setDescription("Rounds/Games won by the losing team (e.g. 9 or 1)")
                .setRequired(false)
        ),

    async execute(interaction) {
        // Ephemeral deferred reply using discord.js v14 flags
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const matchId = interaction.options.getInteger("matchid");
        const winnerInput = interaction.options.getString("winner");
        const winnerRounds = interaction.options.getInteger("winner_rounds") || 0;
        const loserRounds = interaction.options.getInteger("loser_rounds") || 0;

        try {
            const result = await advanceWinner(matchId, winnerInput, winnerRounds, loserRounds);

            const winner = result.winner;
            const loser = result.loser;
            const winnerLogo = result.winnerLogo || "";
            const loserLogo = result.loserLogo || "";

            const currentRound = result.match.round || "WB-R1";
            const currentMatchNum = result.match.roundMatchNumber || matchId;
            const nextRound = result.nextMatch?.round || "WB-R2";
            const nextMatchNum = result.nextMatch?.roundMatchNumber || 1;

            // Generate Match Result Card PNG
            const imagePath = await generateMatchResultImage({
                round: `${currentRound} MATCH #${currentMatchNum}`,
                winner,
                loser,
                winnerLogo,
                loserLogo,
                winnerRounds,
                loserRounds
            });

            const attachment = new AttachmentBuilder(imagePath, { name: "match_result.png" });

            const scoreText = (winnerRounds > 0 || loserRounds > 0)
                ? `\n📊 **Score**: **${winner}** \`${winnerRounds}\` — \`${loserRounds}\` **${loser}**\n`
                : "";

            const embed = new EmbedBuilder()
                .setColor("#EAB308")
                .setTitle(`🏆 MATCH RESULT — ${currentRound} MATCH #${currentMatchNum}`)
                .setDescription(`
# 🎉 Congratulations to **${winner}**!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚔️ **Match #${currentMatchNum}**: **${winner}** 🆚 **${loser}**
${scoreText}
🏆 **WINNER**: **${winner}**  \`[ QUALIFIED ]\`
❌ **DEFEATED**: **${loser}**  \`[ ELIMINATED ]\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

➡️ **${winner}** Advanced to **${nextRound} Match #${nextMatchNum}**!
`)
                .setImage("attachment://match_result.png")
                .setFooter({ text: "ZENX Esports • Tournament System" })
                .setTimestamp();

            // Route output STRICTLY to WINNER_UPDATE_CHANNEL_ID
            const winnerChannelId = process.env.WINNER_UPDATE_CHANNEL_ID;
            let targetChannel = null;

            if (winnerChannelId) {
                try {
                    targetChannel = await interaction.client.channels.fetch(winnerChannelId);
                } catch (err) {
                    console.log("⚠️ Could not fetch WINNER_UPDATE_CHANNEL_ID:", err.message);
                }
            }

            if (!targetChannel) {
                targetChannel = interaction.channel;
            }

            // Post main winner announcement strictly to target WINNER_UPDATE_CHANNEL_ID
            await targetChannel.send({
                embeds: [embed],
                files: [attachment]
            });

            // Automatically update live master bracket image on Discord (in BRACKET_CHANNEL_ID)
            await updateLiveBracketOnDiscord(interaction.client);

            // Private ephemeral reply to Admin
            return interaction.editReply({
                content: `🏆 Match #${currentMatchNum} result announced in <#${targetChannel.id}>! **${winner}** advanced to next round in bracket.`,
                flags: MessageFlags.Ephemeral
            });
        } catch (err) {
            console.error(err);
            return interaction.editReply({
                content: `❌ Failed to advance winner: ${err.message}`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
