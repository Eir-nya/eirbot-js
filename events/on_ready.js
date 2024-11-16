const { Events } = require("discord.js");
const { Event } = require.main.require("./events/internal/class");

module.exports = new Event({
	name: Events.ClientReady,
	once: true,
	execute: client => console.log(`Ready! Logged in as ${client.user.tag}`),
});
