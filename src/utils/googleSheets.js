const { google } = require("googleapis");
const path = require("path");
const tournament = require("../config/tournament.json");

let auth;

if (process.env.GOOGLE_PRIVATE_KEY) {
    auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
} else {
    auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, "..", "credentials.json"),
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
}

const sheets = google.sheets({
    version: "v4",
    auth,
});

const SPREADSHEET_ID =
    process.env.GOOGLE_SHEET_ID ||
    tournament.registration.googleSheetId;

const RANGE = "Form Responses 1!A:AZ";

async function getTeams() {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGE,
        });

        const rows = response.data.values || [];

        if (rows.length <= 1) return [];

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

        // Remove duplicates
        const uniqueTeams = Array.from(
            new Map(
                teams.map(team => [
                    team.teamName.toLowerCase(),
                    team
                ])
            ).values()
        );

        // Sort by registration time
        uniqueTeams.sort(
            (a, b) =>
                new Date(a.timestamp) -
                new Date(b.timestamp)
        );

        return uniqueTeams;

    } catch (error) {
        console.error("❌ Google Sheets Error:", error.message);
        return [];
    }
}

async function getTeamsMMR() {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "MMR!A:D",
        });

        const rows = response.data.values || [];

        if (rows.length <= 1) return new Map();

        const mmrMap = new Map();

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];

            if (!row || !row[1]) continue;

            const teamName = row[1].toString().trim().toLowerCase();
            const mmr = parseFloat(row[2]) || 0;
            const logo = row[3] ? row[3].toString().trim() : "";

            mmrMap.set(teamName, { mmr, logo });
        }

        return mmrMap;

    } catch (error) {
        console.error("❌ Google Sheets MMR Read Error:", error.message);
        return new Map();
    }
}

module.exports = {
    getTeams,
    getTeamsMMR
};