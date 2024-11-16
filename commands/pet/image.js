/**
 * @import { ChatInputCommandInteraction } from "discord.js"
 */
const { SlashCommandSubcommandBuilder, EmbedBuilder } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");
const pet = require.main.require("./modules/pet");

module.exports = new Command({
	data: new SlashCommandSubcommandBuilder()
		.setName("image")
		.setDescription("Pet an image.")
		.addStringOption(option =>
			option.setName("url")
				.setDescription("Image url.")
				.setRequired(true)),
	interaction: async (/** @type ChatInputCommandInteraction */ interaction) => {
		await interaction.deferReply();

		const url = interaction.options.getString("url");
		try {
			new URL(url);
		} catch (e) {
			await interaction.editReply({
				"embeds": [
					new EmbedBuilder()
						.setDescription("Provided string was not a valid URL."),
				],
			});
			return;
		}

		await interaction.editReply(await pet.do_pet(url));
	},
});
