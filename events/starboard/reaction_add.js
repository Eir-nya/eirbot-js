const { Events } = require("discord.js");
const { Event } = require.main.require("./events/internal/class");
const command_queue = require.main.require("./modules/command_queue");
const starboard = require.main.require("./modules/starboard");

module.exports = new Event({
	name: Events.MessageReactionAdd,
	execute: async (client, reaction) => await command_queue.enqueue(new Promise(resolve => starboard.handle_message(client, reaction.message.channel, reaction.message).then(resolve))),
});
