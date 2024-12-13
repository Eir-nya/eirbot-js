const { SlashCommandSubcommandGroupBuilder } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");

module.exports = new Command({
	data: new SlashCommandSubcommandGroupBuilder()
		.setName("set")
		.setDescription("Edit starboard config."),
});
