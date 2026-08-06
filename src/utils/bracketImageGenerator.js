const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");
const { getDatabase } = require("../database/database");

try {
    registerFont(
        path.join(__dirname, "..", "assets", "fonts", "Orbitron-Bold.ttf"),
        { family: "Orbitron" }
    );
} catch {
    // Fallback if font missing
}

// Helper to draw team logo avatar inside slot
async function drawSlotAvatar(ctx, teamName, logoUrl, x, y, radius = 12) {
    const size = radius * 2;
    const centerX = x + radius;
    const centerY = y + radius;

    let loadedImg = null;
    if (logoUrl && (logoUrl.startsWith("http://") || logoUrl.startsWith("https://") || fs.existsSync(logoUrl))) {
        try {
            loadedImg = await loadImage(logoUrl);
        } catch {
            loadedImg = null;
        }
    }

    ctx.save();
    if (loadedImg) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(loadedImg, x, y, size, size);
    } else {
        ctx.fillStyle = "#1E293B";
        ctx.strokeStyle = "#EAB308";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        const initial = teamName ? teamName.trim().charAt(0).toUpperCase() : "?";
        ctx.fillStyle = "#F8FAFC";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(initial, centerX, centerY + 1);
    }
    ctx.restore();
}

// Draw a single trapezoid bracket slot card with golden outline
async function drawBracketSlot(ctx, x, y, width, height, teamName, mmr, logoUrl, isWinner = false) {
    const slant = 10;
    const isValidTeam = teamName && teamName !== "TBD" && teamName !== "BYE";

    // Card Fill
    ctx.fillStyle = isWinner ? "#1E2211" : isValidTeam ? "#151824" : "#12141C";
    ctx.beginPath();
    ctx.moveTo(x + slant, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width - slant, y + height);
    ctx.lineTo(x, y + height);
    ctx.closePath();
    ctx.fill();

    // Golden / Green Outline
    ctx.strokeStyle = isWinner ? "#22C55E" : isValidTeam ? "#EAB308" : "#334155";
    ctx.lineWidth = isWinner ? 2.5 : 1.5;
    ctx.stroke();

    // Side Accent Trapezoid Tab
    ctx.fillStyle = isWinner ? "#22C55E" : isValidTeam ? "#CA8A04" : "#1E293B";
    ctx.beginPath();
    ctx.moveTo(x + width - slant, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width - slant, y + height);
    ctx.lineTo(x + width - slant - slant, y + height);
    ctx.closePath();
    ctx.fill();

    // Team Avatar
    await drawSlotAvatar(ctx, teamName, logoUrl, x + 8, y + (height - 24) / 2, 12);

    // Team Name & MMR
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = isValidTeam ? "#F8FAFC" : "#64748B";
    ctx.font = "bold 12px sans-serif";

    const displayName = isValidTeam ? teamName : "TBD";
    const mmrSuffix = mmr ? ` (${mmr})` : "";
    const fullText = `${displayName}${mmrSuffix}`;

    // Truncate text if too long
    let truncated = fullText;
    if (ctx.measureText(truncated).width > width - 50) {
        truncated = displayName.substring(0, 10) + "...";
    }

    ctx.fillText(truncated, x + 38, y + height / 2);
}

// Draw golden connecting bracket line between two rounds
function drawConnectingLine(ctx, x1, y1, x2, y2, color = "#EAB308") {
    const midX = (x1 + x2) / 2;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(midX, y1);
    ctx.lineTo(midX, y2);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

async function generateBracketImage(matches, outputFileName = "bracket.png") {
    const WIDTH = 1600;
    const HEIGHT = 780;

    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");

    // Fetch team metadata (logo & MMR) from SQLite
    const teamMap = new Map();
    try {
        const db = getDatabase();
        const teams = await db.all("SELECT team_name, mmr, logo FROM teams");
        for (const t of teams) {
            teamMap.set(t.team_name.toLowerCase(), t);
        }
    } catch {}

    // Helper to get team object
    const getTeamInfo = (name) => {
        if (!name || name === "TBD" || name === "BYE") return { name: "TBD", mmr: null, logo: null };
        const found = teamMap.get(name.toLowerCase());
        return {
            name: found?.team_name || name,
            mmr: found?.mmr || null,
            logo: found?.logo || null
        };
    };

    // Helper functions for flexible round filtering (handles 1, "1", "WB-R1", etc.)
    const isRound1 = (r) => !r || r === 1 || r === "1" || r === "WB-R1" || (typeof r === "string" && r.startsWith("WB-R1"));
    const isRound2 = (r) => r === 2 || r === "2" || r === "WB-R2" || (typeof r === "string" && r.startsWith("WB-R2"));
    const isRound3 = (r) => r === 3 || r === "3" || r === "WB-R3" || (typeof r === "string" && r.startsWith("WB-R3"));

    // Group matches by round flexibly
    const round1Matches = matches.filter(m => isRound1(m.round));
    const round2Matches = matches.filter(m => isRound2(m.round));
    const round3Matches = matches.filter(m => isRound3(m.round));

    // 1. Dark background
    ctx.fillStyle = "#0A0B0E";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 2. Dot Grid Pattern Overlay
    ctx.fillStyle = "rgba(234, 179, 8, 0.06)";
    for (let x = 15; x < WIDTH; x += 25) {
        for (let y = 15; y < HEIGHT; y += 25) {
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 3. Central Silhouette Background
    ctx.fillStyle = "rgba(234, 179, 8, 0.03)";
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2 - 80, 50);
    ctx.lineTo(WIDTH / 2 + 100, 280);
    ctx.lineTo(WIDTH / 2, 280);
    ctx.lineTo(WIDTH / 2 + 80, 680);
    ctx.lineTo(WIDTH / 2 - 100, 420);
    ctx.lineTo(WIDTH / 2, 420);
    ctx.closePath();
    ctx.fill();

    // 4. Header Banner
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.shadowColor = "#EAB308";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "#EAB308";
    ctx.font = "bold 32px Orbitron, sans-serif";
    ctx.fillText("VALORANT SHOWDOWN — TOURNAMENT BRACKET", WIDTH / 2, 50);

    ctx.shadowBlur = 0;

    // Center Trophy Icon & Labels
    ctx.fillStyle = "#FACC15";
    ctx.font = "42px sans-serif";
    ctx.fillText("🏆", WIDTH / 2, 190);

    ctx.font = "bold 20px Orbitron, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("FINAL", WIDTH / 2, 135);

    ctx.fillStyle = "#94A3B8";
    ctx.font = "bold 16px Orbitron, sans-serif";
    ctx.fillText("3rd PLACE", WIDTH / 2, 600);

    // 5. Geometry calculation for Symmetrical Split Tree
    const SLOT_WIDTH = 180;
    const SLOT_HEIGHT = 34;
    const PAIR_GAP = 8;

    const totalR1 = round1Matches.length;
    const halfR1 = Math.ceil(totalR1 / 2);
    const leftMatches = round1Matches.slice(0, halfR1);
    const rightMatches = round1Matches.slice(halfR1);

    const startY = 110;
    const endY = HEIGHT - 60;
    const totalH = endY - startY;

    // --- LEFT WING (Round 1 -> Round 2 -> Semis) ---
    const leftR1X = 50;
    const leftR2X = 280;
    const leftSemiX = 510;

    const r1LeftStep = totalH / (leftMatches.length || 1);
    const leftR2Coords = [];

    for (let i = 0; i < leftMatches.length; i++) {
        const match = leftMatches[i];
        const matchCenterY = startY + r1LeftStep * i + r1LeftStep / 2;

        const y1 = matchCenterY - SLOT_HEIGHT - PAIR_GAP / 2;
        const y2 = matchCenterY + PAIR_GAP / 2;

        const t1 = getTeamInfo(match.team1?.team_name || match.team_a);
        const t2 = getTeamInfo(match.team2?.team_name || match.team_b);

        // Draw R1 Slots
        await drawBracketSlot(ctx, leftR1X, y1, SLOT_WIDTH, SLOT_HEIGHT, t1.name, t1.mmr, t1.logo, match.winner === t1.name);
        await drawBracketSlot(ctx, leftR1X, y2, SLOT_WIDTH, SLOT_HEIGHT, t2.name, t2.mmr, t2.logo, match.winner === t2.name);

        // Connect pair to Round 2 slot
        if (i % 2 === 0) {
            const r2Y = matchCenterY + r1LeftStep / 2 - SLOT_HEIGHT / 2;
            leftR2Coords.push(r2Y);

            // Lines from R1 to R2
            drawConnectingLine(ctx, leftR1X + SLOT_WIDTH, y1 + SLOT_HEIGHT / 2, leftR2X, r2Y + SLOT_HEIGHT / 2);
            drawConnectingLine(ctx, leftR1X + SLOT_WIDTH, y2 + SLOT_HEIGHT / 2, leftR2X, r2Y + SLOT_HEIGHT / 2);

            // Dynamic R2 Match Lookup
            const r2MatchIndex = Math.floor(i / 2);
            const r2Match = round2Matches[r2MatchIndex];
            const r2TeamA = getTeamInfo(r2Match?.team_a);

            await drawBracketSlot(ctx, leftR2X, r2Y, SLOT_WIDTH, SLOT_HEIGHT, r2TeamA.name, r2TeamA.mmr, r2TeamA.logo, r2Match?.winner === r2TeamA.name);
        }
    }

    // Connect R2 to Semis on Left
    if (leftR2Coords.length >= 2) {
        for (let j = 0; j < leftR2Coords.length; j += 2) {
            const r2Y1 = leftR2Coords[j] + SLOT_HEIGHT / 2;
            const r2Y2 = leftR2Coords[j + 1] + SLOT_HEIGHT / 2;
            const semiY = (r2Y1 + r2Y2) / 2 - SLOT_HEIGHT / 2;

            drawConnectingLine(ctx, leftR2X + SLOT_WIDTH, r2Y1, leftSemiX, semiY + SLOT_HEIGHT / 2);
            drawConnectingLine(ctx, leftR2X + SLOT_WIDTH, r2Y2, leftSemiX, semiY + SLOT_HEIGHT / 2);

            const r3Match = round3Matches[Math.floor(j / 2)];
            const r3TeamA = getTeamInfo(r3Match?.team_a);

            await drawBracketSlot(ctx, leftSemiX, semiY, SLOT_WIDTH, SLOT_HEIGHT, r3TeamA.name, r3TeamA.mmr, r3TeamA.logo, r3Match?.winner === r3TeamA.name);

            // Connect Semis to Final Left Slot
            drawConnectingLine(ctx, leftSemiX + SLOT_WIDTH, semiY + SLOT_HEIGHT / 2, WIDTH / 2 - SLOT_WIDTH - 15, 230);
        }
    } else if (leftR2Coords.length === 1) {
        drawConnectingLine(ctx, leftR2X + SLOT_WIDTH, leftR2Coords[0] + SLOT_HEIGHT / 2, WIDTH / 2 - SLOT_WIDTH - 15, 230);
    }

    // --- RIGHT WING (Round 1 -> Round 2 -> Semis) ---
    const rightR1X = WIDTH - 50 - SLOT_WIDTH;
    const rightR2X = WIDTH - 280 - SLOT_WIDTH;
    const rightSemiX = WIDTH - 510 - SLOT_WIDTH;

    const r1RightStep = totalH / (rightMatches.length || 1);
    const rightR2Coords = [];

    for (let i = 0; i < rightMatches.length; i++) {
        const match = rightMatches[i];
        const matchCenterY = startY + r1RightStep * i + r1RightStep / 2;

        const y1 = matchCenterY - SLOT_HEIGHT - PAIR_GAP / 2;
        const y2 = matchCenterY + PAIR_GAP / 2;

        const t1 = getTeamInfo(match.team1?.team_name || match.team_a);
        const t2 = getTeamInfo(match.team2?.team_name || match.team_b);

        // Draw R1 Slots
        await drawBracketSlot(ctx, rightR1X, y1, SLOT_WIDTH, SLOT_HEIGHT, t1.name, t1.mmr, t1.logo, match.winner === t1.name);
        await drawBracketSlot(ctx, rightR1X, y2, SLOT_WIDTH, SLOT_HEIGHT, t2.name, t2.mmr, t2.logo, match.winner === t2.name);

        // Connect pair to Round 2 slot
        if (i % 2 === 0) {
            const r2Y = matchCenterY + r1RightStep / 2 - SLOT_HEIGHT / 2;
            rightR2Coords.push(r2Y);

            drawConnectingLine(ctx, rightR1X, y1 + SLOT_HEIGHT / 2, rightR2X + SLOT_WIDTH, r2Y + SLOT_HEIGHT / 2);
            drawConnectingLine(ctx, rightR1X, y2 + SLOT_HEIGHT / 2, rightR2X + SLOT_WIDTH, r2Y + SLOT_HEIGHT / 2);

            // Dynamic R2 Match Lookup for Right Wing
            const r2MatchIndex = Math.floor(leftMatches.length / 2) + Math.floor(i / 2);
            const r2Match = round2Matches[r2MatchIndex];
            const r2TeamB = getTeamInfo(r2Match?.team_b || r2Match?.team_a);

            await drawBracketSlot(ctx, rightR2X, r2Y, SLOT_WIDTH, SLOT_HEIGHT, r2TeamB.name, r2TeamB.mmr, r2TeamB.logo, r2Match?.winner === r2TeamB.name);
        }
    }

    // Connect R2 to Semis on Right
    if (rightR2Coords.length >= 2) {
        for (let j = 0; j < rightR2Coords.length; j += 2) {
            const r2Y1 = rightR2Coords[j] + SLOT_HEIGHT / 2;
            const r2Y2 = rightR2Coords[j + 1] + SLOT_HEIGHT / 2;
            const semiY = (r2Y1 + r2Y2) / 2 - SLOT_HEIGHT / 2;

            drawConnectingLine(ctx, rightR2X, r2Y1, rightSemiX + SLOT_WIDTH, semiY + SLOT_HEIGHT / 2);
            drawConnectingLine(ctx, rightR2X, r2Y2, rightSemiX + SLOT_WIDTH, semiY + SLOT_HEIGHT / 2);

            const r3Match = round3Matches[round3Matches.length - 1];
            const r3TeamB = getTeamInfo(r3Match?.team_b);

            await drawBracketSlot(ctx, rightSemiX, semiY, SLOT_WIDTH, SLOT_HEIGHT, r3TeamB.name, r3TeamB.mmr, r3TeamB.logo, r3Match?.winner === r3TeamB.name);

            // Connect Semis to Final Right Slot
            drawConnectingLine(ctx, rightSemiX, semiY + SLOT_HEIGHT / 2, WIDTH / 2 + 15 + SLOT_WIDTH, 230);
        }
    } else if (rightR2Coords.length === 1) {
        drawConnectingLine(ctx, rightR2X, rightR2Coords[0] + SLOT_HEIGHT / 2, WIDTH / 2 + 15 + SLOT_WIDTH, 230);
    }

    // --- CENTER FINAL & 3RD PLACE SLOTS ---
    const finalMatch = matches.find(m => m.round === "WB-R4" || m.round === "FINAL" || m.round === 4);
    const finalA = getTeamInfo(finalMatch?.team_a);
    const finalB = getTeamInfo(finalMatch?.team_b);

    // Final Match Slots
    await drawBracketSlot(ctx, WIDTH / 2 - SLOT_WIDTH - 15, 215, SLOT_WIDTH, SLOT_HEIGHT, finalA.name, finalA.mmr, finalA.logo, finalMatch?.winner === finalA.name);
    await drawBracketSlot(ctx, WIDTH / 2 + 15, 215, SLOT_WIDTH, SLOT_HEIGHT, finalB.name, finalB.mmr, finalB.logo, finalMatch?.winner === finalB.name);

    // 3rd Place Match Slots
    const thirdMatch = matches.find(m => m.round === "3RD_PLACE");
    const thirdA = getTeamInfo(thirdMatch?.team_a);
    const thirdB = getTeamInfo(thirdMatch?.team_b);

    await drawBracketSlot(ctx, WIDTH / 2 - SLOT_WIDTH - 15, 620, SLOT_WIDTH, SLOT_HEIGHT, thirdA.name, thirdA.mmr, thirdA.logo, thirdMatch?.winner === thirdA.name);
    await drawBracketSlot(ctx, WIDTH / 2 + 15, 620, SLOT_WIDTH, SLOT_HEIGHT, thirdB.name, thirdB.mmr, thirdB.logo, thirdMatch?.winner === thirdB.name);

    // Output File
    const outputPath = path.join(__dirname, "..", "assets", outputFileName);
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.promises.writeFile(outputPath, canvas.toBuffer("image/png"));

    return outputPath;
}

module.exports = {
    generateBracketImage
};
