/**
 * @import { ChatInputCommandInteraction } from "discord.js";
 */
const { SlashCommandSubcommandBuilder, EmbedBuilder } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");

const ranks = {
	[-4]: "Horrifying",
	[-3]: "Catastrophic",
	[-2]: "Terrible",
	[-1]: "Poor",
	[0]: "Mediocre",
	[1]: "Average",
	[2]: "Fair",
	[3]: "Good",
	[4]: "Great",
	[5]: "Superb",
	[6]: "Fantastic",
	[7]: "Epic",
	[8]: "Legendary",
};

module.exports = new Command({
	data: new SlashCommandSubcommandBuilder()
		.setName("fate")
		.setDescription("Roll Fate RPG dice (4).")
		.addIntegerOption(option =>
			option.setMinValue(-20)
				.setMaxValue(20)
				.setName("modifier")
				.setDescription("Modifier to add to roll result.")),
	interaction: async (/** @type ChatInputCommandInteraction */ interaction) => {
		await interaction.deferReply();

		const modifier = interaction.options.getInteger("modifier") || 0;
		let result_string = "Fate :game_die: **";

		let total = 0;
		for (let i = 0; i < 4; i++) {
			const roll = Math.floor((Math.random() * 3) - 1);
			if (roll == -1)
				result_string += "[-] ";
			else if (roll == 0)
				result_string += "[ ] ";
			else if (roll == 1)
				result_string += "[+] ";
			total += roll;
		}
		result_string = result_string.substring(0, result_string.length - 1); // Remove last extra space
		total += modifier;

		let rank = "";
		if (total >= -4 && total < 8)
			rank = ` (${ranks[total]})`;

		result_string += `** ${modifier >= 0 ? "+" : ""}${modifier} = **${total >= 0 ? "+" : ""}${total}${rank}**`;
		await interaction.editReply({
			"embeds": [
				new EmbedBuilder()
					.setDescription(result_string),
			],
		});
	},
});
