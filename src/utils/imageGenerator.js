const {
    createCanvas,
    loadImage,
    registerFont
} = require("canvas");

const fs = require("fs");
const path = require("path");

// ===============================
// FONT
// ===============================

try {
    registerFont(
        path.join(
            __dirname,
            "..",
            "assets",
            "fonts",
            "Orbitron-Bold.ttf"
        ),
        {
            family: "Orbitron"
        }
    );
} catch (err) {
    console.log("Orbitron font not found. Using Arial.");
}

// ===============================
// MAIN FUNCTION
// ===============================

async function generateDashboard(data) {

    const WIDTH = 1672;
    const HEIGHT = 941;

    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");

    // ===============================
    // LOAD BACKGROUND
    // ===============================

    const background = await loadImage(
        path.join(
            __dirname,
            "..",
            "assets",
            "background.png"
        )
    );

    ctx.drawImage(background, 0, 0, WIDTH, HEIGHT);

    // ===============================
    // TEXT SETTINGS
    // ===============================

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // ===============================
    // RED GLOW
    // ===============================

    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // ===============================
    // FONT
    // ===============================

    ctx.fillStyle = "#ff2b2b";
    ctx.font = "bold 105px Arial";

    // ===============================
    // DRAW NUMBER
    // ===============================

    function drawNumber(number, x, y) {

        ctx.fillText(
            String(number).padStart(2, "0"),
            x,
            y
        );

    }     // ===============================
    // DRAW COUNTDOWN
    // ===============================

    drawNumber(data.days, 280, 555);
    drawNumber(data.hours, 618, 555);
    drawNumber(data.minutes, 956, 555);
    drawNumber(data.seconds, 1294, 555);
   
    // ===============================
    // TEAMS
    // ===============================

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 42px Arial";

    ctx.fillText(`${data.teams}/32`, 250, 805);

    // ===============================
    // REGISTRATION
    // ===============================

    ctx.fillStyle =
        data.registration === "OPEN"
            ? "#33FF33"
            : "#FF3333";

    ctx.font = "bold 42px Arial";
    
    ctx.fillText(
    data.registration,
    650,
    805
    );
    // ===============================
    // DATE
    // ===============================

    ctx.fillStyle = "#FFFFFF";

    ctx.font = " bold 36px Arial";
    ctx.fillText(data.date, 1075, 805);

    // ===============================
    // TIME
    // ===============================

    ctx.font = " bold 36px Arial";
    ctx.fillText(data.time, 1455, 805);

    // ===============================
    // SAVE IMAGE
    // ===============================

    const output = path.join(
        __dirname,
        "..",
        "assets",
        "dashboard.png"
    );

    fs.writeFileSync(
        output,
        canvas.toBuffer("image/png")
    );

    return output;
}

module.exports = generateDashboard;