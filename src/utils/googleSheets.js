const { google } = require("googleapis");
const path = require("path");

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, "..", "credentials.json"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({
    version: "v4",
    auth,
});

const SPREADSHEET_ID = "1Ij5h7sD0iEXTX4PMNg8kSixQX6aF6IFDqQVyd4bbEYI";
const RANGE = "Form Responses 1!A:AZ";

async function getTeams() {

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE,
    });

    const rows = response.data.values || [];

    if (rows.length <= 1) {
        return [];
    }

    const teams = [];

    for (let i = 1; i < rows.length; i++) {

        const row = rows[i];

        if (!row[1]) continue;

teams.push({
    timestamp: row[0] || "",
    teamName: row[1].trim(),
    manager: row[2] || "",
    coach: row[3] || "",
    captain: row[4] || ""
});

    }

    return teams;
}

module.exports = {
    getTeams
};