/**
 * @import { ChatInputCommandInteraction } from "discord.js";
 */
const { SlashCommandSubcommandBuilder, EmbedBuilder } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");
const starboard = require.main.require("./modules/starboard");

module.exports = new Command({
	data: new SlashCommandSubcommandBuilder()
		.setName("min_stars")
		.setDescription("Minimum unique reacts")
		.addIntegerOption(option =>
			option.setMinValue(1)
				.setName("min")
				.setDescription("Minimum unique reacts")
				.setRequired(true)),
	interaction: async (/** @type ChatInputCommandInteraction */ interaction) => {
		await interaction.deferReply({ "ephemeral": true });

		const int = interaction.options.getInteger("min");
		starboard.set_setting(interaction.guild, "min_stars", int);

		await interaction.editReply({
			"embeds": [
				new EmbedBuilder()
					.setDescription(`Set minimum unique react count to **${int}**.`),
			],
		});
	},
});
