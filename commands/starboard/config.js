const { SlashCommandSubcommandBuilder } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");

module.exports = new Command({
	data: new SlashCommandSubcommandBuilder()
		.setName("config")
		.setDescription("View starboard config."),
	interaction: require("./settings").interaction,
});
