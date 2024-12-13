/**
 * @import { ChatInputCommandInteraction } from "discord.js";
 */
const { SlashCommandSubcommandBuilder, EmbedBuilder } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");
const starboard = require.main.require("./modules/starboard");

module.exports = new Command({
	data: new SlashCommandSubcommandBuilder()
		.setName("allow_nsfw")
		.setDescription("Allow posts from NSFW channels")
		.addBooleanOption(option =>
			option.setName("allow")
				.setDescription("Allow posts from NSFW channels")
				.setRequired(true)),
	interaction: async (/** @type ChatInputCommandInteraction */ interaction) => {
		await interaction.deferReply({ "ephemeral": true });

		const bool = interaction.options.getBoolean("allow");
		starboard.set_setting(interaction.guild, "allow_nsfw", bool);

		await interaction.editReply({
			"embeds": [
				new EmbedBuilder()
					.setDescription(`Starboard **will${!bool ? " not" : ""}** include posts from NSFW channels.`),
			],
		});
	},
});
