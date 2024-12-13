/**
 * @import { Message, TextChannel, Guild, MessageCreateOptions, AttachmentBuilder, WebhookMessageCreateOptions, Client, Webhook } from "discord.js"
 */
const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");
const server_manager = require("./server_manager");
const webhook = require("./webhook");
const { get_self_as_server_member } = require.main.require("./util/convenience");

// Maximum size of attachments to attempt to download and reupload in starboard message
const max_file_size = 26_214_400;

/**
 * @typedef {StarboardSettings}
 */
const default_settings = {
	accepted_emoji: [ "⭐" ],
	min_stars: 2,
	allow_nsfw: false,
	allow_self_star: false,
	remove_when_deleted: true,
	remove_when_unstarred: true,
	use_webhook: true,

	/** @type string? */
	channel_id: null,
	/** @type Object.<string, string> */
	message_lookup: {}, // each key is the id of a starred message, each value is the id of its copy in the starboard channel
	/** @type Object.<string, string> */
	webhook_jump_message_lookup: {}, // each key is the id of a starred message, each value is the id of the associated jump message made in the starboard channel
	/** @type [string] */
	ignored_channels: [],
};

/**
 * Returns starboard settings for a server
 * @param {string|Guild} server_or_id
 * @returns {StarboardSettings}
 */
function get_settings(server_or_id) {
	const server_settings = server_manager.read(server_or_id);
	if (!server_settings["starboard_settings"])
		server_manager.write(server_or_id, "starboard_settings", JSON.parse(JSON.stringify(default_settings)));
	return server_manager.read(server_or_id)["starboard_settings"];
}

/**
 * Changes a setting in a server's starboard config
 * @param {string|Guild} server_or_id
 * @param {string} key
 * @param {any} value
 */
function set_setting(server_or_id, key, value) {
	const server_settings = get_settings(server_or_id);
	if (value == null || value == undefined)
		delete server_settings[key];
	else
		server_settings[key] = value;
	server_manager.write(server_or_id, "starboard_settings", server_settings);
}

/**
 * Returns true if a server has starboard enabled
 * @param {Guild} server
 * @returns {Promise<boolean>}
 */
async function starboard_enabled(server) {
	return await get_starboard_channel(server);
}

/**
 * Gets starboard channel for a server, if possible
 * @param {Guild} server
 * @returns {Promise<TextChannel?>}
 */
async function get_starboard_channel(server) {
	const settings = get_settings(server);
	const channel_id = settings.channel_id;

	if (!channel_id)
		return null;

	try {
		const channel = await server.channels.fetch(channel_id);
		return channel;
	} catch (e) {
		console.error(`Error while fetching starboard channel ${channel_id} in ${server.name}:\n${e}`);
		set_setting(server, "channel_id", null);
		return null;
	}
}

async function count_reacts(/** @type Client */ client, /** @type Message */ message, accepted_emoji = null) {
	const server = message.guild;
	const server_settings = get_settings(server);

	accepted_emoji = accepted_emoji || server_settings.accepted_emoji;

	let total_stars = 0;

	// Collect reactions
	const already_reacted = {};
	const reactions = message.reactions.cache;
	for (const reaction of reactions.filter(r => accepted_emoji.includes(r.emoji.toString()))) {
		const users_who_reacted = await reaction[1].users.fetch();
		for (const user of users_who_reacted.keys())
			already_reacted[user] = true;
	}

	total_stars = Object.keys(already_reacted).length;
	if (already_reacted[message.author.id] && !server_settings.allow_self_star)
		total_stars--;
	return total_stars;
}

async function should_ignore_channel(/** @type TextChannel */ channel) {
	const server = channel.guild;
	const server_settings = get_settings(server);

	return !(await starboard_enabled(server))
		|| (channel.nsfw && !server_settings.allow_nsfw)
		|| server_settings.ignored_channels.includes(channel.id)
		|| !channel.permissionsFor(await get_self_as_server_member(channel.guild)).has(PermissionsBitField.Flags.SendMessages);
}

async function get_message_in_starboard(/** @type Message */ message) {
	const server = message.guild;
	const server_settings = get_settings(server);

	const starboard_channel = await get_starboard_channel(server);
	const message_key = `${message.channel.id}/${message.id}`;
	const target_message = server_settings.message_lookup[message_key];
	if (starboard_channel && target_message) {
		try {
			return await starboard_channel.messages.fetch(target_message);
		} catch (e) {
			console.error(`Error while fetching starboard message for ${message.id}:\n${e}`);
			delete server_settings.message_lookup[message_key];
			set_setting(server, "message_lookup", server_manager.message_lookup);
			return null;
		}
	}
}

async function get_jump_message_in_starboard(/** @type Message */ message) {
	const server = message.guild;
	const server_settings = get_settings(server);

	const starboard_channel = await get_starboard_channel(server);
	const message_key = `${message.channel.id}/${message.id}`;
	const target_message = server_settings.webhook_jump_message_lookup[message_key];
	if (starboard_channel && target_message) {
		try {
			return await starboard_channel.messages.fetch(target_message);
		} catch (e) {
			console.error(`Error while fetching starboard jump message for ${message.id}:\n${e}`);
			delete server_settings.webhook_jump_message_lookup[message_key];
			set_setting(server, "webhook_jump_message_lookup", server_manager.webhook_jump_message_lookup);
			return null;
		}
	}
}

/**
 * Makes a starboard message if it doesn't exist. If it does, updates the star/emoji count. If count is less than min amount and set to delete, will be deleted
 * @param {Client} client
 * @param {TextChannel} channel
 * @param {Message} message
 */
async function handle_message(client, channel, message) {
	if (await should_ignore_channel(channel))
		return;

	const server_settings = get_settings(channel.guild);

	const starboard_channel = await get_starboard_channel(channel.guild);
	// Get or create webhook if possible
	/** @type Webhook */
	let hook;
	if (server_settings.use_webhook && webhook.has_webhook_perms(channel.guild))
		hook = await webhook.create_or_get_webhook(client, channel.guild, starboard_channel);

	// Supplied from events/starboard/message_removed
	if (message.partial && (!message.author || !message.channel || !message.guild))
		await message.fetch();
	const message_deleted = message.deleted;
	const message_key = `${message.channel.id}/${message.id}`;

	// See if message already exists in starboard
	let message_in_starboard = await get_message_in_starboard(message);

	// If message already exists and its webhook use is different from current webhook use, delete it and make a new one
	// Alternatively, delete the starboard message(s) here if original message was deleted and message is meant to delete
	if (message_in_starboard) {
		const was_sent_by_webhook = webhook.message_sent_by_webhook(message_in_starboard);
		const message_deleted_should_delete = message_deleted && server_settings.remove_when_deleted;

		// Was sent by webhook
		if (was_sent_by_webhook && (!server_settings.use_webhook || message_deleted_should_delete)) {
			const jump_message = await get_jump_message_in_starboard(message);
			if (jump_message)
				await jump_message.delete();
			await message_in_starboard.delete();
			message_in_starboard = null;

			delete server_settings.message_lookup[message_key];
			set_setting(message.guild, "message_lookup", server_settings.message_lookup);
			delete server_settings.webhook_jump_message_lookup[message_key];
			set_setting(message.guild, "webhook_jump_message_lookup", server_settings.webhook_jump_message_lookup);
		// Was not sent by webhook
		} else if (!was_sent_by_webhook && (server_settings.use_webhook || message_deleted_should_delete)) {
			await message_in_starboard.delete();
			delete server_settings.message_lookup[message_key];
			set_setting(message.guild, "message_lookup", server_settings.message_lookup);
		}

		if (message_deleted_should_delete)
			return;
	}

	const total_stars = await count_reacts(client, message);

	// Message already exists - update
	if (message_in_starboard) {
		// Delete because fallen below threshold
		if (total_stars < server_settings.min_stars && server_settings.remove_when_unstarred) {
			await message_in_starboard.delete();
			delete server_settings.message_lookup[message_key];
			set_setting(message.guild, "message_lookup", server_settings.message_lookup);

			const jump_message = await get_jump_message_in_starboard(message);
			if (jump_message) {
				await jump_message.delete();
				delete server_settings.webhook_jump_message_lookup[message_key];
				set_setting(message.guild, "webhook_jump_message_lookup", server_settings.webhook_jump_message_lookup);
			}
		// Edit
		} else {
			if (server_settings.use_webhook) {
				const jump_message = await get_jump_message_in_starboard(message);
				if (jump_message && hook)
					await update_starboard_jump_message(client, message, jump_message, hook);
			}
			// BOTH the jump message AND the original message need to be edited, in case the original message is edited
			await update_starboard_message(client, message, message_in_starboard, hook);
		}
	// Create starboard message
	} else if (total_stars >= server_settings.min_stars) {
		let jump_message;
		// Create webhook message + jump message
		if (server_settings.use_webhook && hook) {
			// No need to update webhook to starboard channel, that's already done in create_or_get_webhook
			const starboard_message_builder = await create_starboard_message_webhook(client, message, true);
			message_in_starboard = await hook.send(starboard_message_builder);
			const jump_message_builder = await create_starboard_jump_message(client, message, true);
			jump_message = await hook.send(jump_message_builder);
		// Just create normal message
		} else {
			const starboard_message_builder = await create_starboard_message(client, message, true);
			await starboard_channel.send(starboard_message_builder);
		}

		server_settings.message_lookup[message_key] = message_in_starboard.id;
		if (jump_message)
			server_settings.webhook_jump_message_lookup[message_key] = jump_message.id;

		set_setting(channel.guild, "message_lookup", server_settings.message_lookup);
		set_setting(channel.guild, "webhook_jump_message_lookup", server_settings.webhook_jump_message_lookup);
	}
}

/**
 * Generates message content for starboard post (no webhook)
 * @param {Client} client
 * @param {Message} message
 * @param {boolean} new_message
 * @returns MessageCreateOptions
 */
async function create_starboard_message(client, message, new_message) {
	const total_stars = await count_reacts(client, message);

	const has_stickers = message.stickers.size > 0;
	const has_non_guild_sticker = has_stickers && (message.stickers.first().guildId != message.guild.id || !message.stickers.first().guildId);
	let { attachment_string, files } = await handle_attachments(client, message, new_message, false);

	if (has_non_guild_sticker) {
		let to_add = "\n" + message.stickers.first().url;
		if (attachment_string.length + to_add.length > 2000 - 10)
			to_add = "\n:warning:";
		attachment_string += to_add;
	}

	// Build message content using MessageCreateOptions
	/** @type MessageCreateOptions */
	const message_out = {
		"content": attachment_string,
		"embeds": message.embeds.filter(embed => !embed.url || !attachment_string.contains(embed.url)),
	};
	if (new_message && files.length > 0)
		message_out.files = files;
	if (has_stickers && !has_non_guild_sticker)
		message_out.stickers = [ message.stickers.first() ];

	// Attempt to get author's display name in the server
	let name = message.author.displayName;
	let avatar_url = message.author.avatarURL({ extension: "png" });
	const member = await message.guild.members.fetch(message.author.id);
	if (member) {
		name = member.displayName || name;
		avatar_url = member.avatarURL({ extension: "png" }) || avatar_url;
	}

	// Create embed
	/** @type EmbedBuilder */
	const embed = new EmbedBuilder()
		.setColor((member && member.displayColor) ? member.displayColor : "Default")
		.setTitle("Jump to message")
		.setURL(message.url)
		.setAuthor({ "name": `${name}${message.author.bot ? " [BOT]" : ""} (⭐x${total_stars})`, "iconURL": avatar_url })
		.setDescription(message.content)
		.setTimestamp(message.createdAt);

	// Create message
	if (!message_out.embeds)
		message_out.embeds = [];
	message_out.embeds.push(embed);
	return message_out;
}

/**
 * Generates message content for starboard post (with webhook)
 * @param {Client} client
 * @param {Message} message
 * @param {boolean} new_message
 * @returns WebhookMessageCreateOptions
 */
async function create_starboard_message_webhook(client, message, new_message) {
	const has_sticker_and_files = message.stickers.size > 0 && message.attachments.size > 0;

	let { attachment_string, files } = await handle_attachments(client, message, new_message, true);
	if (has_sticker_and_files) {
		let to_add = "\n" + message.stickers.first().url;
		if (attachment_string.length + to_add.length > 2000 - 10)
			to_add = "\n:warning:";
		attachment_string += to_add;
	}

	// Start building webhook message
	/** @type WebhookMessageCreateOptions */
	const message_out = {
		"content": attachment_string,
		"embeds": message.embeds.filter(embed => !embed.url || !attachment_string.contains(embed.url)),
	};
	if (new_message && files.length > 0)
		message_out.files = files;
	if (message.stickers.size > 0 && !has_sticker_and_files) {
		message_out.files = message_out.files || [];
		const sticker = message.stickers.first();
		message_out.files.push(/** @type AttachmentBuilder */ {
			attachment: await fetch(sticker.url).body, // await client.rest.get(sticker.url),
			description: sticker.description,
			name: message,
			spoiler: sticker.name,
		});
	}

	// Attempt to apply member info
	if (new_message) {
		let name = message.author.displayName;
		let avatar_url = message.author.avatarURL({ extension: "png" });
		const member = await message.guild.members.fetch(message.author.id);
		if (member) {
			name = member.displayName || name;
			avatar_url = member.avatarURL({ extension: "png" }) || avatar_url;
		}

		message_out.username = name;
		message_out.avatarURL = avatar_url;
	}

	return message_out;
}

/**
 * Generates message content for a jump message, to be sent after a webhook message
 * @param {Client} client
 * @param {Message} message
 * @param {boolean} new_message
 * @returns WebhookMessageCreateOptions
 */
async function create_starboard_jump_message(client, message, new_message) {
	let name = message.author.displayName;
	let avatar_url = message.author.avatarURL({ extension: "png" });
	const member = await message.guild.members.fetch(message.author.id);
	if (member) {
		name = member.displayName || name;
		avatar_url = member.avatarURL({ extension: "png" }) || avatar_url;
	}

	// Emoji react string
	const server_settings = get_settings(message.guild);
	let react_description = "";
	if (server_settings) {
		react_description = "## ";
		for (const emoji of server_settings.accepted_emoji) {
			const reactions = await count_reacts(client, message, [emoji]);
			if (reactions > 0)
				react_description += emoji + " x" + reactions + " ";
		}
	}

	// Start building webhook message
	/** @type WebhookMessageCreateOptions */
	const message_out = {};
	if (new_message) {
		message_out.username = name;
		message_out.avatarURL = avatar_url;
	}
	const embed = new EmbedBuilder()
		.setColor((member && member.displayColor) ? member.displayColor : "Default")
		.setTitle("Jump to message")
		.setURL(message.url)
		.setAuthor({ "name": `${name}${message.author.bot ? " [BOT]" : ""}`, "iconURL": avatar_url })
		.setDescription(react_description)
		.setTimestamp(message.createdAt);

	// Create message
	if (!message_out.embeds)
		message_out.embeds = [];
	message_out.embeds.push(embed);
	return message_out;
}

/**
 * Updates message in starboard (not jump message)
 * @param {Client} client
 * @param {Message} message
 * @param {Message} message_in_starboard
 * @param {Webhook} hook
 */
async function update_starboard_message(client, message, message_in_starboard, hook = null) {
	// Webhook
	if (hook)
		await hook.editMessage(message_in_starboard, await create_starboard_message_webhook(client, message, false));
	// No webhook
	else
		await message_in_starboard.edit(await create_starboard_message(client, message, false));
}

/**
 * Updates jump message in starboard
 * @param {Client} client
 * @param {Message} message
 * @param {Message} jump_message
 * @param {Webhook} hook
 */
async function update_starboard_jump_message(client, message, jump_message, hook) {
	await hook.editMessage(jump_message, await create_starboard_jump_message(client, message, false));
}

/**
 * Parses original message's attachments and converts them to 1. a string that will embed them, and 2. a list of files to reupload manually, based on options
 * @param {Client} client
 * @param {Message} original_message
 * @param {bool} download_files
 * @param {bool} read_content
 * @returns {{attachment_string: string, files: [AttachmentBuilder]}}
 */
async function handle_attachments(client, original_message, download_files, read_content) {
	/** @type string */
	let attachment_string = read_content ? original_message.content : "";
	const files = {};

	original_message.attachments.each(attachment => {
		// Download
		if (attachment.size <= max_file_size && download_files) {
			files[attachment.name] = {
				attachment: attachment.url,
				description: attachment.description,
				name: attachment.name,
				spoiler: attachment.spoiler,
			};
		} else
			if (!attachment.spoiler)
				attachment_string += attachment.url + "\n";
			else
				attachment_string += `|| ${attachment.url} ||` + "\n";
	});

	// Fetch stream for all files
	await Promise.all(Object.values(files).map(file => async () => file.attachment = await fetch(file.attachment).body)); // await client.rest.get(file.attachment)));

	attachment_string = attachment_string.trim();
	return {
		attachment_string,
		files,
	};
}

module.exports = {
	get_settings,
	set_setting,
	starboard_enabled,
	get_starboard_channel,
	count_reacts,
	should_ignore_channel,
	get_message_in_starboard,
	get_jump_message_in_starboard,

	handle_message,
};
