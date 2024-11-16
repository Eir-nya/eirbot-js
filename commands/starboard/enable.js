const { SlashCommandSubcommandBuilder, ChannelType } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");

module.exports = new Command({
	data: new SlashCommandSubcommandBuilder()
		.setName("enable")
		.setDescription("Enable starboard.")
		.addChannelOption(option =>
			option.setName("channel")
				.setDescription("Channel to use")
				.setRequired(true)
				.addChannelTypes([ ChannelType.GuildText, ChannelType.PublicThread, ChannelType.PrivateThread ])),
	interaction: require("./set/channel").interaction,
});
