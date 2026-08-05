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
            family: "Orbitron",
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

    ctx.shadowColor = "#ff3b30";
    ctx.shadowBlur = 45;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // ===============================
    // FONT
    // ===============================

    ctx.fillStyle = "#ff2b2b";
    ctx.font = "bold 105px Orbitron";

    // ===============================
    // DRAW NUMBER
    // ===============================

  function drawNumber(number, x, y) {

    const value = Math.max(0, Number(number) || 0);

    ctx.fillText(
        value.toString().padStart(2, "0"),
        x,
        y
    );

}

         // ===============================
    // DRAW COUNTDOWN
    // ===============================

const positions = [
    280,
    618,
    956,
    1294
];

[
    data.days,
    data.hours,
    data.minutes,
    data.seconds
].forEach((value,index)=>{
    drawNumber(value,positions[index],555);
});
   
    // ===============================
    // TEAMS
    // ===============================

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 42px Orbitron";

    ctx.fillText(
    `${data.teams}/${data.maxTeams}`,
    250,
    805
);

    // ===============================
    // REGISTRATION
    // ===============================

    ctx.fillStyle =
        data.registration === "OPEN"
            ? "#00FF66"
            : "#FF3B30";

    ctx.font = "bold 42px Orbitron";
    
    ctx.fillText(
    data.registration,
    650,
    805
    );
    // ===============================
    // DATE
    // ===============================

    ctx.fillStyle = "#FFFFFF";

    ctx.font = " bold 36px Orbitron";
    ctx.fillText(data.date, 1075, 805);

    // ===============================
    // TIME
    // ===============================

    ctx.font = " bold 36px Orbitron";
    ctx.fillText(data.time, 1455, 805);

    // ===============================
    // SAVE IMAGE
    // ===============================

const output = path.resolve(
    __dirname,
    "..",
    "assets",
    data.output || "dashboard.png"
);

// Make sure the assets folder exists
await fs.promises.mkdir(
    path.dirname(output),
    { recursive: true }
);

// Save image
await fs.promises.writeFile(
    output,
    canvas.toBuffer("image/png")
);

console.log(`🖼 Dashboard image saved: ${output}`);

return output;

}

module.exports = generateDashboard;