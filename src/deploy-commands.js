const { REST, Routes } = require("discord.js");
const { clientId, guildId } = require("./config/config.json");
require("dotenv").config();

const commands = [
    {
        name: "tournament",
        description: "Show tournament information"
    },
    {
        name: "dashboard",
        description: "Create the live tournament dashboard"
    }
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {

        console.log("Registering slash commands...");

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );

        console.log("✅ Slash commands registered.");

    } catch (error) {
        console.error(error);
    }
})();