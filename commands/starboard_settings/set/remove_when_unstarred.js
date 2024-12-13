/**
 * @import { ChatInputCommandInteraction } from "discord.js";
 */
const { SlashCommandSubcommandBuilder, EmbedBuilder } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");
const starboard = require.main.require("./modules/starboard");

module.exports = new Command({
	data: new SlashCommandSubcommandBuilder()
		.setName("remove_when_unstarred")
		.setDescription("Remove when react count falls below minimum")
		.addBooleanOption(option =>
			option.setName("remove")
				.setDescription("Remove when react count falls below minimum")
				.setRequired(true)),
	interaction: async (/** @type ChatInputCommandInteraction */ interaction) => {
		await interaction.deferReply({ "ephemeral": true });

		const bool = interaction.options.getBoolean("remove");
		starboard.set_setting(interaction.guild, "remove_when_unstarred", bool);

		await interaction.editReply({
			"embeds": [
				new EmbedBuilder()
					.setDescription(`Starboard **will${!bool ? " not" : ""}** remove messages from the starboard that fall below the minimum reaction count.`),
			],
		});
	},
});
