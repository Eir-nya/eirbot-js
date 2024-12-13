/**
 * @import { ChatInputCommandInteraction } from "discord.js";
 */
const { SlashCommandSubcommandBuilder, EmbedBuilder } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");
const starboard = require.main.require("./modules/starboard");

module.exports = new Command({
	data: new SlashCommandSubcommandBuilder()
		.setName("disable")
		.setDescription("Disable starboard."),
	interaction: async (/** @type ChatInputCommandInteraction */ interaction) => {
		await interaction.deferReply({ "ephemeral": true });

		starboard.set_setting(interaction.guild, "channel_id", null);

		await interaction.editReply({
			"embeds": [
				new EmbedBuilder()
					.setDescription("Starboard disabled."),
			],
		});
	},
});
