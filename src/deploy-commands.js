const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");
require("dotenv").config();

const { clientId, guildId } = require("./config/config.json");

const commands = [];

const commandsPath = path.join(__dirname, "commands");

const commandFiles = fs.readdirSync(commandsPath)
    .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {

    const command = require(path.join(commandsPath, file));

    if (command.data) {
        commands.push(command.data.toJSON());
        console.log(`Loaded command: ${command.data.name}`);
    }

}

const rest = new REST({ version: "10" })
    .setToken(process.env.TOKEN);

(async () => {

    try {

        console.log(`Registering ${commands.length} commands...`);

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );

        console.log("✅ Slash commands registered.");

    } catch (err) {

        console.error(err);

    }

})();