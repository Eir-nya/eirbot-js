const { Events } = require("discord.js");
const { Event } = require.main.require("./events/internal/class");
const command_queue = require.main.require("./modules/command_queue");
const starboard = require.main.require("./modules/starboard");

module.exports = new Event({
	name: Events.MessageReactionRemove,
	execute: async (client, reaction) => {
		// Ignore messages that aren't in the starboard
		if (await starboard.get_message_in_starboard(reaction.message))
			await command_queue.enqueue(new Promise(resolve => starboard.handle_message(client, reaction.message.channel, reaction.message).then(resolve)));
	},
});
