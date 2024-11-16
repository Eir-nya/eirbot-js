/**
 * @import { ChatInputCommandInteraction } from "discord.js";
 */
const { EmbedBuilder } = require("discord.js");

module.exports = {
	/**
	 *
	 * @param {ChatInputCommandInteraction} interaction
	 * @param {Number} num_sides
	 */
	rollDice: async (interaction, num_sides) => {
		await interaction.deferReply();

		let result_string = "";

		const total_dice = interaction.options.getInteger("number") || 1;
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
};
