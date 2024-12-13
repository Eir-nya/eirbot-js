/**
 * @import { ChatInputCommandInteraction, TextChannel, Message, Webhook } from "discord.js";
 */
const { SlashCommandSubcommandBuilder, ChannelType, EmbedBuilder } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");
const starboard = require.main.require("./modules/starboard");
const webhook = require.main.require("./modules/webhook");

module.exports = new Command({
	data: new SlashCommandSubcommandBuilder()
		.setName("importoldmessages")
		.setDescription("Import old messages already in starboard.")
		.addChannelOption(option =>
			option.setName("channel")
				.setDescription("Channel to import from")
				.setRequired(true)
				.addChannelTypes([ ChannelType.GuildText, ChannelType.PublicThread, ChannelType.PrivateThread ]))
		.addStringOption(option =>
			option.setName("before")
				.setDescription("Message id to start fetching before")),
	interaction: async (/** @type ChatInputCommandInteraction */ interaction) => {
		await interaction.deferReply({ "ephemeral": true });

		// Fetch channel
		/** @type TextChannel */
		const channel = interaction.options.getChannel("channel") || interaction.channel;
		/** @type Webhook */
		const our_webhook = await webhook.get_our_webhook_in_server(interaction.guild);
		const before = interaction.options.getString("before");

		const fetch_data = { cache: true, limit: 100 };
		if (before)
			fetch_data.before = before;
		let messages = await channel.messages.fetch(fetch_data);
		const fetched_count = Array.from(messages.values()).length;
		messages = messages.filter((/** @type Message */ message) => message.author.id == interaction.client.user.id || (message.webhookId && our_webhook && message.webhookId == our_webhook.id));

		// Fetch existing data
		const settings = starboard.get_settings(interaction.guild);
		const new_messages = settings.message_lookup;
		const new_webhook_jump_messages = settings.webhook_jump_message_lookup;

		let added_message_count = 0;

		// For each message...
		const awaiting_operations = [];
		messages.each(message => {
			if (!message.embeds.length || message.embeds[message.embeds.length - 1].title != "Jump to message")
				return;

			const original_message_key = message.embeds[message.embeds.length - 1].url.split(`https://discord.com/channels/${interaction.guild.id}/`)[1];

			// Webhook
			if (message.webhookId == our_webhook.id) {
				// Update message ids
				new_webhook_jump_messages[original_message_key] = message.id;
				awaiting_operations.push(new Promise(resolve =>
					channel.messages.fetch({ cache: false, limit: 1, before: message.id })
						.then(message_before => {
							new_messages[original_message_key] = message_before.first().id;
							resolve();
						}),
				));
			// Not webhook
			} else
				new_messages[original_message_key] = message.id;

			added_message_count++;
		});
		await Promise.all(awaiting_operations);

		await starboard.set_setting(interaction.guild, "message_lookup", new_messages);
		await starboard.set_setting(interaction.guild, "webhook_jump_message_lookup", new_webhook_jump_messages);

		const last_message = new_messages[new_messages.length - 1];

		await interaction.editReply({
			"embeds": [
				new EmbedBuilder()
					.setDescription(`Fetched ${fetched_count} messages.\n${last_message ? `Last message id: \`${last_message.id}\`\n` : ""}${added_message_count} old messages imported to starboard.`),
			],
		});
	},
});
