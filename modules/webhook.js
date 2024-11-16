/**
 * @import { Client, TextChannel, Guild, Webhook } from "discord.js"
 */
const { PermissionsBitField } = require("discord.js");
const { client_id } = require.main.require("./config.json");
const { get_self_as_server_member } = require.main.require("./util/convenience");

const default_webhook_name = "{0} - General purpose webhook";

const has_webhook_perms = async server => (await get_self_as_server_member(server)).permissions.has(PermissionsBitField.Flags.ManageWebhooks);

/**
 * Retrieves webhook in active server if it exists
 * @param {Guild} server
 * @returns Promise<Webhook?>
 */
async function get_our_webhook_in_server(server) {
	const all_webhooks = await server.fetchWebhooks();
	return all_webhooks.find(webhook => webhook.applicationId == client_id);
}

/**
 * Gets or creates webhook in server
 * @param {Client} client
 * @param {Guild} server
 * @param {TextChannel} channel
 * @returns Promise<Webhook?>
 */
async function create_or_get_webhook(client, server, channel) {
	if (!await has_webhook_perms(server))
		return null;

	/** @type Webhook */
	let webhook = await get_our_webhook_in_server(server);
	if (webhook) {
		if (channel.id != webhook.channelId)
			await webhook.edit({ "channel": channel });
		return webhook;
	}

	webhook = await channel.createWebhook({
		name: default_webhook_name.replace("{0}", client.user.displayName),
		avatar: client.user.avatarURL({ extension: "png" }),
		reason: "General purpose webhook",
	});
	return webhook;
}

/**
 * Returns true if a message was sent by our webhook
 * @param {Message} message
 * @returns {boolean}
 */
async function message_sent_by_webhook(message) {
	if (!await has_webhook_perms(message.guild))
		return false;
	const webhook = await get_our_webhook_in_server(message.guild);
	return message.webhookId && message.webhookId == webhook.id;
}

module.exports = {
	has_webhook_perms,
	get_our_webhook_in_server,
	create_or_get_webhook,
	message_sent_by_webhook,
};
