/**
 * @import { ChatInputCommandInteraction } from "discord.js";
 */
const { SlashCommandSubcommandBuilder } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");
const random = require("./random");

module.exports = new Command({
	data: new SlashCommandSubcommandBuilder()
		.setName("d8")
		.setDescription("Roll one or more D8s.")
		.addIntegerOption(option =>
			option.setMinValue(1)
				.setName("number")
				.setDescription("Amount of dice to roll.")),
	interaction: async (/** @type ChatInputCommandInteraction */ interaction) => random.rollDice(interaction, 8),
});
