const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");

module.exports = new Command({
	data: new SlashCommandBuilder()
		.setName("starboard_settings")
		.setDescription("Starboard config.")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
		.setContexts([ InteractionContextType.Guild ]),
});
