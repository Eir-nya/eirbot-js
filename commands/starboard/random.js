/**
 * @import { ChatInputCommandInteraction } from "discord.js";
 */
const { SlashCommandSubcommandBuilder, MessageCreateOptions, EmbedBuilder } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");
const starboard = require.main.require("./modules/starboard");

module.exports = new Command({
	data: new SlashCommandSubcommandBuilder()
		.setName("random")
		.setDescription("Get a random starred message from this server."),
	interaction: async (/** @type ChatInputCommandInteraction */ interaction) => {
		await interaction.deferReply({ "ephemeral": true });

		/* Get a random message */
		const settings = starboard.get_settings(interaction.guild);
		if (!settings || !settings.message_lookup || !settings.message_lookup.length) {
			// Throw error
			await interaction.editReply({
				"embeds": [
					new EmbedBuilder()
						.setTitle("Starboard")
						.setDescription("Failed to fetch starboard messages for this server.")
				],
			});
			return;
		}

		const starred_messages = Object.keys(settings.message_lookup);

		// Repeat this if message couldnt be fetched
		for (let i = 0; i < 3; i++) {
			const random_message_key = starred_messages[Math.floor(Math.random() * starred_messages.length)];

			/* Find original message's channel */
			const { server_id, channel_id, message_id } = random_message_key.split("/");

			/* Fetch message */
			try {
				const original_channel = await interaction.guild.channels.fetch(channel_id);
				const original_message = await original_channel.messages.fetch(message_id);

				/** @type MessageCreateOptions */
				const msg_contents = await starboard.create_starboard_message(interaction.client, original_message, true);
				await interaction.editReply(msg_contents);
			} catch (e) {
				console.error(`Starboard - random: FAILED to fetch message with key "${random_message_key}"\nReason: ${e}`);

				if (i == 2) {
					// Throw error
					await interaction.editReply({
						"embeds": [
							new EmbedBuilder()
								.setTitle("Starboard")
								.setDescription("Failed to fetch random starboard message.")
						],
					});
					return;
				}

				continue;
			}
			break;
		}
	},
});
