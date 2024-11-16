/**
 * @import { ChatInputCommandInteraction } from "discord.js";
 */
const { SlashCommandSubcommandBuilder, EmbedBuilder } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");
const starboard = require.main.require("./modules/starboard");

module.exports = new Command({
	data: new SlashCommandSubcommandBuilder()
		.setName("remove_when_deleted")
		.setDescription("Remove on message delete")
		.addBooleanOption(option =>
			option.setName("remove")
				.setDescription("Remove on message delete")
				.setRequired(true)),
	interaction: async (/** @type ChatInputCommandInteraction */ interaction) => {
		await interaction.deferReply({ "ephemeral": true });

		const bool = interaction.options.getBoolean("remove");
		starboard.set_setting(interaction.guild, "remove_when_deleted", bool);

		await interaction.editReply({
			"embeds": [
				new EmbedBuilder()
					.setDescription(`Starboard **will${!bool ? " not" : ""}** remove messages from the starboard after original messages are deleted.`),
			],
		});
	},
});
