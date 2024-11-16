const { Events } = require("discord.js");
const { Event } = require.main.require("./events/internal/class");
const command_queue = require.main.require("./modules/command_queue");
const starboard = require.main.require("./modules/starboard");

module.exports = new Event({
	name: Events.MessageDelete,
	execute: async (client, message) => {
		message.deleted = true;
		// Ignore messages that aren't in the starboard
		if (await starboard.get_message_in_starboard(message))
			await command_queue.enqueue(new Promise(resolve => starboard.handle_message(client, message.channel, message).then(resolve)));
	},
});
