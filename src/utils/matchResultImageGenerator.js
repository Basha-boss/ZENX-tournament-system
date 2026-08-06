const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");

try {
    registerFont(
        path.join(__dirname, "..", "assets", "fonts", "Orbitron-Bold.ttf"),
        { family: "Orbitron" }
    );
} catch {
    // Fallback if font missing
}

/**
 * Draws team logo centered inside circular frame with golden/red border.
 */
async function drawTeamAvatar(ctx, teamName, logoUrl, centerX, centerY, radius = 85, borderColor = "#EAB308") {
    const size = radius * 2;
    const x = centerX - radius;
    const y = centerY - radius;

    let loadedImg = null;

    if (logoUrl && (logoUrl.startsWith("http://") || logoUrl.startsWith("https://") || fs.existsSync(logoUrl))) {
        try {
            loadedImg = await loadImage(logoUrl);
        } catch {
            loadedImg = null;
        }
    }

    ctx.save();

    // Outer Glowing Circular Ring
    ctx.shadowColor = borderColor;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Circular Clip Mask
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    if (loadedImg) {
        // Calculate aspect ratio scaling to fit inside circle
        const imgAspect = loadedImg.width / loadedImg.height;

        let drawW = size;
        let drawH = size;

        if (imgAspect > 1) {
            drawH = size / imgAspect;
        } else {
            drawW = size * imgAspect;
        }

        const drawX = centerX - drawW / 2;
        const drawY = centerY - drawH / 2;

        ctx.drawImage(loadedImg, drawX, drawY, drawW, drawH);
    } else {
        // Fallback Circular Initials Badge
        ctx.fillStyle = "#12141C";
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        const initial = teamName ? teamName.trim().charAt(0).toUpperCase() : "?";
        ctx.fillStyle = "#FACC15";
        ctx.font = "bold 60px Orbitron, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(initial, centerX, centerY + 4);
    }

    ctx.restore();
}

/**
 * Auto-scales font size down so text fits inside maxWidth.
 */
function drawAutoScaledText(ctx, text, centerX, centerY, maxWidth, initialFontSize = 26, color = "#FFFFFF") {
    let fontSize = initialFontSize;
    ctx.font = `bold ${fontSize}px Orbitron, sans-serif`;

    while (ctx.measureText(text).width > maxWidth && fontSize > 14) {
        fontSize -= 2;
        ctx.font = `bold ${fontSize}px Orbitron, sans-serif`;
    }

    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, centerX, centerY);
    return fontSize;
}

async function generateMatchResultImage(data) {
    const WIDTH = 1200;
    const HEIGHT = 680;

    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");

    // 1. Deep Rich Black Background
    ctx.fillStyle = "#08090D";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 2. Gold Particle Grid Texture
    ctx.fillStyle = "rgba(234, 179, 8, 0.05)";
    for (let x = 15; x < WIDTH; x += 30) {
        for (let y = 15; y < HEIGHT; y += 30) {
            ctx.beginPath();
            ctx.arc(x, y, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Outer Metallic Gold Corner Trims
    ctx.strokeStyle = "#EAB308";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(35, 75);
    ctx.lineTo(35, 35);
    ctx.lineTo(120, 35);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(WIDTH - 120, 35);
    ctx.lineTo(WIDTH - 35, 35);
    ctx.lineTo(WIDTH - 35, 75);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(35, HEIGHT - 75);
    ctx.lineTo(35, HEIGHT - 35);
    ctx.lineTo(120, HEIGHT - 35);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(WIDTH - 120, HEIGHT - 35);
    ctx.lineTo(WIDTH - 35, HEIGHT - 35);
    ctx.lineTo(WIDTH - 35, HEIGHT - 75);
    ctx.stroke();

    // 3. Top Banner Header
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.shadowColor = "#EAB308";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#FACC15";
    ctx.font = "bold 34px Orbitron, sans-serif";
    ctx.fillText("VALORANT SHOWDOWN", WIDTH / 2, 52);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#CA8A04";
    ctx.font = "bold 14px Orbitron, sans-serif";
    ctx.fillText("M A T C H   R E S U L T S", WIDTH / 2, 78);

    // 4. Top Round/Match Name Pill Box
    const topPillX = 390;
    const topPillY = 95;
    const topPillW = 420;
    const topPillH = 48;

    ctx.fillStyle = "#12141F";
    ctx.strokeStyle = "#EAB308";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(topPillX, topPillY, topPillW, topPillH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 18px Orbitron, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(data.round || "ROUND 1", WIDTH / 2, topPillY + topPillH / 2);

    const winnerName = data.winner || "Winner";
    const loserName = data.loser || "Loser";

    // ----------------------------------------------------
    // LEFT CARD (WINNER / QUALIFIED)
    // ----------------------------------------------------
    const cardY = 175;
    const cardW = 470;
    const cardH = 450;
    const leftX = 50;

    // Winner Box Container
    ctx.shadowColor = "#22C55E";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#0A140D";
    ctx.strokeStyle = "#22C55E";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(leftX, cardY, cardW, cardH, 16);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Winner Top Tab ("👑 QUALIFIED")
    const tabW = 180;
    const tabH = 34;
    ctx.fillStyle = "#22C55E";
    ctx.beginPath();
    ctx.roundRect(leftX + (cardW - tabW) / 2, cardY - 14, tabW, tabH, 6);
    ctx.fill();

    ctx.fillStyle = "#000000";
    ctx.font = "bold 14px Orbitron, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("👑 QUALIFIED", leftX + cardW / 2, cardY + 3);

    // Winner Team Name Pill
    const pillW = 400;
    const pillH = 50;
    const leftPillX = leftX + (cardW - pillW) / 2;
    const leftPillY = cardY + 45;

    ctx.fillStyle = "#0F1F14";
    ctx.strokeStyle = "#4ADE80";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(leftPillX, leftPillY, pillW, pillH, 8);
    ctx.fill();
    ctx.stroke();

    drawAutoScaledText(ctx, winnerName, leftX + cardW / 2, leftPillY + pillH / 2, pillW - 20, 24, "#FFFFFF");

    // Large Circular Team Logo Avatar for Winner
    const leftLogoX = leftX + cardW / 2;
    const leftLogoY = cardY + 250;
    await drawTeamAvatar(ctx, winnerName, data.winnerLogo, leftLogoX, leftLogoY, 85, "#22C55E");

    // Status Subtext
    ctx.fillStyle = "#4ADE80";
    ctx.font = "bold 16px Orbitron, sans-serif";
    ctx.fillText("✓ ADVANCED TO NEXT ROUND", leftX + cardW / 2, cardY + cardH - 30);

    // ----------------------------------------------------
    // CENTER VS / SCORE SECTION
    // ----------------------------------------------------
    const centerX = WIDTH / 2;
    const centerY = cardY + cardH / 2;

    // Vertical Gold Accent Line
    ctx.strokeStyle = "rgba(234, 179, 8, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, cardY + 30);
    ctx.lineTo(centerX, cardY + cardH - 30);
    ctx.stroke();

    // VS / Score Display
    ctx.shadowColor = "#EAB308";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#FACC15";

    if (typeof data.winnerRounds === "number" && typeof data.loserRounds === "number" && (data.winnerRounds > 0 || data.loserRounds > 0)) {
        ctx.font = "bold 32px Orbitron, sans-serif";
        ctx.fillText(`${data.winnerRounds} - ${data.loserRounds}`, centerX, centerY);
    } else {
        ctx.font = "bold 34px Orbitron, sans-serif";
        ctx.fillText("VS", centerX, centerY);
    }
    ctx.shadowBlur = 0;

    // ----------------------------------------------------
    // RIGHT CARD (LOSER / ELIMINATED)
    // ----------------------------------------------------
    const rightX = WIDTH - cardW - 50;

    // Loser Box Container
    ctx.fillStyle = "#160A0D";
    ctx.strokeStyle = "#991B1B";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(rightX, cardY, cardW, cardH, 16);
    ctx.fill();
    ctx.stroke();

    // Broken Red Lines Pattern across loser card
    ctx.strokeStyle = "rgba(239, 68, 68, 0.12)";
    ctx.lineWidth = 2;
    for (let l = -50; l < cardW + 50; l += 30) {
        ctx.beginPath();
        ctx.moveTo(rightX + l, cardY);
        ctx.lineTo(rightX + l + 40, cardY + cardH);
        ctx.stroke();
    }

    // Loser Top Tab ("❌ ELIMINATED")
    ctx.fillStyle = "#991B1B";
    ctx.beginPath();
    ctx.roundRect(rightX + (cardW - tabW) / 2, cardY - 14, tabW, tabH, 6);
    ctx.fill();

    ctx.fillStyle = "#FECDD3";
    ctx.font = "bold 14px Orbitron, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("❌ ELIMINATED", rightX + cardW / 2, cardY + 3);

    // Loser Team Name Pill
    const rightPillX = rightX + (cardW - pillW) / 2;
    const rightPillY = cardY + 45;

    ctx.fillStyle = "#240E12";
    ctx.strokeStyle = "#7F1D1D";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(rightPillX, rightPillY, pillW, pillH, 8);
    ctx.fill();
    ctx.stroke();

    const loserFontSize = drawAutoScaledText(ctx, loserName, rightX + cardW / 2, rightPillY + pillH / 2, pillW - 20, 24, "#94A3B8");

    // Strikethrough line over loser name
    ctx.font = `bold ${loserFontSize}px Orbitron, sans-serif`;
    const loserW = ctx.measureText(loserName).width;
    ctx.strokeStyle = "#EF4444";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rightX + cardW / 2 - loserW / 2 - 8, rightPillY + pillH / 2);
    ctx.lineTo(rightX + cardW / 2 + loserW / 2 + 8, rightPillY + pillH / 2);
    ctx.stroke();

    // Large Circular Team Logo Avatar for Loser
    const rightLogoX = rightX + cardW / 2;
    const rightLogoY = cardY + 250;
    await drawTeamAvatar(ctx, loserName, data.loserLogo, rightLogoX, rightLogoY, 85, "#991B1B");

    // Status Subtext
    ctx.fillStyle = "#F87171";
    ctx.font = "bold 16px Orbitron, sans-serif";
    ctx.fillText("ELIMINATED FROM BRACKET", rightX + cardW / 2, cardY + cardH - 30);

    // Save Output Image
    const outputPath = path.join(__dirname, "..", "assets", "match_result.png");
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.promises.writeFile(outputPath, canvas.toBuffer("image/png"));

    return outputPath;
}

module.exports = {
    generateMatchResultImage
};
