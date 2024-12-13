/**
 * @import { ChatInputCommandInteraction, TextChannel } from "discord.js";
 */
const { SlashCommandSubcommandBuilder, EmbedBuilder } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");
const starboard = require.main.require("./modules/starboard");

module.exports = new Command({
	data: new SlashCommandSubcommandBuilder()
		.setName("view")
		.setDescription("View starboard settings."),
	interaction: async (/** @type ChatInputCommandInteraction */ interaction) => {
		await interaction.deferReply({ "ephemeral": true });

		const settings = starboard.get_settings(interaction.guild);

		const starboard_enabled = await starboard.starboard_enabled(interaction.guild);

		/** @type TextChannel */
		const starboard_channel = await starboard.get_starboard_channel(interaction.guild);

		/** @type [TextChannel] */
		const ignored_channels = [];
		for (const channel_id of settings.ignored_channels) {
			try {
				const ignored_channel = await interaction.guild.channels.fetch(channel_id);
				ignored_channels.push(ignored_channel.id);
			} catch (e) {
				console.log(`Error while fetching ignored channel ${channel_id}: ${e}`);
			}
		}
		// Error checking
		if (ignored_channels.length != settings.ignored_channels.length)
			starboard.set_setting(interaction.guild, "ignored_channels", ignored_channels.map(channel => channel.id));
		const ignored_channel_string = ignored_channels.map(channel => channel.toString()).join(", ") || ":x:";

		await interaction.editReply({
			"embeds": [
				new EmbedBuilder()
					.setTitle("Starboard settings")
					.setAuthor({ "name": interaction.guild.name, "iconURL": interaction.guild.iconURL() })
					/*
					.setDescription(
						`:gear: Enabled: ${starboard_enabled ? ":white_check_mark:" : ":x:"}
						:hash: Starboard channel: ${starboard_channel ? starboard_channel.toString() : ":x:"}
						:no_bell: Ignored channels: ${ignored_channel_string}
						:underage: Allow posts from NSFW channels: ${settings.allow_nsfw ? ":white_check_mark:" : ":x:"}

						:star: Emojis to check for: ${settings.accepted_emoji.join(", ")}
						:1234: Minimum unique reacts: ${settings.min_stars}
						:index_pointing_at_the_viewer: Count reacts from message author: ${settings.allow_self_star ? ":white_check_mark:" : ":x:"}

						:robot: Use webhook for starboard messages (requires "Manage Webhooks" perm): ${settings.use_webhook ? ":white_check_mark:" : ":x:"}
						:dizzy: Remove when react count falls below minimum: ${settings.remove_when_unstarred ? ":white_check_mark:" : ":x:"}
						:hammer: Remove on message delete: ${settings.remove_when_deleted ? ":white_check_mark:" : ":x:"}`
					)
					*/
					.addFields([
						{ inline: true, name: ":gear: Enabled", value: starboard_enabled ? ":white_check_mark:" : ":x:" },
						{ inline: true, name: ":hash: Starboard channel", value: starboard_channel ? starboard_channel.toString() : ":x:" },
						{ inline: true, name: ":no_bell: Ignored channels", value: ignored_channel_string },
						{ inline: true, name: ":underage: Allow posts from NSFW channels", value: settings.allow_nsfw ? ":white_check_mark:" : ":x:" },
					])
					.addFields([{ name: "\u200b", value: "\u200b" }]) // Blank
					.addFields([
						{ inline: true, name: ":star: Emojis to check for", value: settings.accepted_emoji.join(", ") },
						{ inline: true, name: ":1234: Minimum unique reacts", value: settings.min_stars.toString() },
						{ inline: true, name: ":index_pointing_at_the_viewer: Count reacts from message author", value: settings.allow_self_star ? ":white_check_mark:" : ":x:" },
					])
					.addFields([{ name: "\u200b", value: "\u200b" }]) // Blank
					.addFields([
						{ inline: true, name: ":robot: Use webhook for starboard messages (requires \"Manage Webhooks\" perm)", value: settings.use_webhook ? ":white_check_mark:" : ":x:" },
						{ inline: true, name: ":dizzy: Remove when react count falls below minimum", value: settings.remove_when_unstarred ? ":white_check_mark:" : ":x:" },
						{ inline: true, name: ":hammer: Remove on message delete", value: settings.remove_when_deleted ? ":white_check_mark:" : ":x:" },
					]),
			],
		});
	},
});
