/**
 * @import { ChatInputCommandInteraction, User } from "discord.js"
 */
const { SlashCommandSubcommandBuilder } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");
const pet = require.main.require("./modules/pet");

module.exports = new Command({
	data: new SlashCommandSubcommandBuilder()
		.setName("user")
		.setDescription("Pet a user.")
		.addUserOption(option =>
			option.setName("user")
				.setDescription("User to pet.")
				.setRequired(true)),
	interaction: async (/** @type ChatInputCommandInteraction */ interaction) => {
		await interaction.deferReply();

		await interaction.editReply(await pet.do_pet(interaction.options.getUser("user").avatarURL({ extension: "png" })));
	},
});
