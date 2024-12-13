const { SlashCommandBuilder, InteractionContextType } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");

module.exports = new Command({
	data: new SlashCommandBuilder()
		.setName("starboard")
		.setDescription("Starboard commands.")
		.setContexts([ InteractionContextType.Guild ]),
});
