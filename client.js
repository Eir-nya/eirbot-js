const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { token } = require("./config.json");

const client = new Client({
	intents: [
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMembers,
	],
	partials: [
		Partials.Channel,
		Partials.Message,
		Partials.Reaction,
	],
});

// Register application commands
require("./commands/internal/register")(client);
console.log("Application commands registered.");

// Register events
require("./events/internal/register")(client);
console.log("Events registered.");

// Login
client.login(token);
