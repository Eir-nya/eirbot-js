const { Events } = require("discord.js");
const { Event } = require.main.require("./events/internal/class");
const command_queue = require.main.require("./modules/command_queue");
const starboard = require.main.require("./modules/starboard");

module.exports = new Event({
	name: Events.MessageUpdate,
	execute: async (client, old_message, new_message) => {
		// Ignore updates from self
		if (new_message.author.id != client.user.id) {
			// Ignore messages that aren't in the starboard
			if (await starboard.get_message_in_starboard(new_message))
				await command_queue.enqueue(new Promise(resolve => starboard.handle_message(client, new_message.channel, new_message).then(resolve)));
		}
	},
});
