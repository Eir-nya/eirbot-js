/**
 * @import { ChatInputCommandInteraction, TextChannel, ThreadChannel } from "discord.js";
 */
const { SlashCommandSubcommandBuilder, ChannelType, EmbedBuilder } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");
const starboard = require.main.require("./modules/starboard");

module.exports = new Command({
	data: new SlashCommandSubcommandBuilder()
		.setName("ignored_channels")
		.setDescription("Ignored channels")
		.addChannelOption(option =>
			option.setName("channel")
				.setDescription("Channel to (un)ignore")
				.setRequired(true)
				.addChannelTypes([ ChannelType.GuildText, ChannelType.PublicThread, ChannelType.PrivateThread ]))
		.addBooleanOption(option =>
			option.setName("ignore")
				.setDescription("Ignore this channel?")
				.setRequired(true)),
	interaction: async (/** @type ChatInputCommandInteraction */ interaction) => {
		await interaction.deferReply({ "ephemeral": true });

		/** @type TextChannel|ThreadChannel */
		const channel = interaction.options.getChannel("channel");
		const should_ignore = interaction.options.getBoolean("ignore");

		// Get existing ignored_channels
		const settings = starboard.get_settings(interaction.guild);
		/** @type [string] */
		let ignored_channels = settings.ignored_channels;

		if (should_ignore && !ignored_channels.includes(channel.id)) {
			ignored_channels.push(channel.id);
			starboard.set_setting(interaction.guild, "ignored_channels", ignored_channels);

			await interaction.editReply({
				"embeds": [
					new EmbedBuilder()
						.setDescription(`Channel ${channel.toString()} is now **ignored** for starboard.`),
				],
			});
			return;
		} else if (!should_ignore && ignored_channels.includes(channel.id)) {
			ignored_channels = ignored_channels.filter(channel_id => channel_id != channel.id);
			starboard.set_setting(interaction.guild, "ignored_channels", ignored_channels);

			await interaction.editReply({
				"embeds": [
					new EmbedBuilder()
						.setDescription(`Channel ${channel.toString()} is now **not ignored** for starboard.`),
				],
			});
			return;
		}

		await interaction.editReply({
			"embeds": [
				new EmbedBuilder()
					.setDescription(`No changes were made.`),
			],
		});
	},
});
