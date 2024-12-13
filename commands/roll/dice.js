/**
 * @import { ChatInputCommandInteraction, TextChannel } from "discord.js";
 */
const { SlashCommandSubcommandBuilder, EmbedBuilder } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");

module.exports = new Command({
	data: new SlashCommandSubcommandBuilder()
		.setName("dice")
		.setDescription("Roll dice.")
		.addStringOption(option =>
			option.setName("dice")
				.setDescription("Type of dice to roll.")
				.setRequired(true)
				.addChoices(
					{ name: "D4", value: "4" },
					{ name: "D6", value: "6" },
					{ name: "D8", value: "8" },
					{ name: "D10", value: "10" },
					{ name: "D20", value: "20" },
					{ name: "D100", value: "100" },
				))
		.addIntegerOption(option =>
			option.setName("number")
				.setDescription("Amount of dice to roll.")
				.setMinValue(1)),
	interaction: async (/** @type ChatInputCommandInteraction */ interaction) => {
		await interaction.deferReply();

		const num_sides = Number(interaction.options.getString("dice") || "6");
		const total_dice = interaction.options.getInteger("number") || 1;

		let result_string = "";

		const values = [];
		for (let i = 0; i < total_dice; i++) {
			const new_value = Math.floor((Math.random() * num_sides) + 1);
			values.push(new_value);
			result_string += `D${num_sides} :game_die: **${new_value}**\n`;
		}
		if (total_dice > 1)
			result_string += `Total: **${values.reduce((a, b) => a + b)}**`;

		await interaction.editReply({
			"embeds": [
				new EmbedBuilder()
					.setDescription(result_string),
			],
		});
	},
});
