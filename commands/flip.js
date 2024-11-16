/**
 * @import { ChatInputCommandInteraction } from "discord.js";
 */
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");

module.exports = new Command({
	data: new SlashCommandBuilder()
		.setName("flip")
		.setDescription("Flip a coin."),
	interaction: async (/** @type ChatInputCommandInteraction */ interaction) => {
		const flip = Math.random() < 0.5;
		await interaction.reply({
			"embeds": [
				new EmbedBuilder()
					.setDescription(`:coin: **${flip ? "Heads" : "Tails"}**`),
			],
		});
	},
});
