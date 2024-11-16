/**
 * @import { ChatInputCommandInteraction, TextChannel, ThreadChannel } from "discord.js";
 */
const { SlashCommandSubcommandBuilder, ChannelType, ThreadChannel, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");
const { get_self_as_server_member } = require.main.require("./util/convenience");
const starboard = require.main.require("./modules/starboard");

module.exports = new Command({
	data: new SlashCommandSubcommandBuilder()
		.setName("channel")
		.setDescription("Starboard channel")
		.addChannelOption(option =>
			option.setName("channel")
				.setDescription("Channel to use")
				.setRequired(true)
				.addChannelTypes([ ChannelType.GuildText, ChannelType.PublicThread, ChannelType.PrivateThread ])),
	interaction: async (/** @type ChatInputCommandInteraction */ interaction) => {
		await interaction.deferReply({ "ephemeral": true });

		/** @type TextChannel|ThreadChannel */
		const channel = interaction.options.getChannel("channel", true);

		// Validate channel
		const channel_perms = channel.permissionsFor(await get_self_as_server_member(interaction.guild));
		if (channel_perms.has(PermissionFlagsBits.SendMessages) && (!(channel instanceof ThreadChannel) || channel_perms.has(PermissionFlagsBits.SendMessagesInThreads))) {
			// Valid!
			starboard.set_setting(interaction.guild, "channel_id", channel.id);
			await interaction.editReply({
				"embeds": [
					new EmbedBuilder()
						.setDescription(`Starboard channel set to ${channel.toString()}.`),
				],
			});
		} else {
			// Invalid
			await interaction.editReply({
				"embeds": [
					new EmbedBuilder()
						.setDescription(`Lacking permissions to post in channel ${channel.toString()}. Cancelled.`),
				],
			});
		}
	},
});
