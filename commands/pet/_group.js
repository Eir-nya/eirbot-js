const { SlashCommandBuilder } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");

module.exports = new Command({
	data: new SlashCommandBuilder()
		.setName("pet")
		.setDescription("Pet a user or an image."),
});