/**
 * @import { ChatInputCommandInteraction, TextChannel, ThreadChannel } from "discord.js";
 */
const { SlashCommandSubcommandBuilder, EmbedBuilder } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");
const starboard = require.main.require("./modules/starboard");

module.exports = new Command({
	data: new SlashCommandSubcommandBuilder()
		.setName("emoji")
		.setDescription("Emojis to check for")
		.addStringOption(option =>
			option.setName("emojis")
				.setDescription("Emoji identifiers, eg. ':star: :heart: :custom_emoji:'")),
	interaction: async (/** @type ChatInputCommandInteraction */ interaction) => {
		await interaction.deferReply({ "ephemeral": true });

		const emoji_string = interaction.options.getString("emojis") || ":star:";
		//const emoji_identifiers = emoji_string.split(" ").filter(identifier => (identifier.startsWith(":") && identifier.endsWith(":")) || ((identifier.startsWith("<:") || identifier.startsWith("<a:")) && identifier.endsWith(">")));
		const emoji_identifiers = emoji_string.split(" ");

		const valid_emojis = [];
		for (const identifier of emoji_identifiers) {
			const emoji = interaction.client.emojis.resolveIdentifier(identifier);
			if (emoji)
				valid_emojis.push(identifier);
		}

		// Validate results
		if (valid_emojis.length) {
			// Valid!
			starboard.set_setting(interaction.guild, "accepted_emoji", valid_emojis);
			await interaction.editReply({
				"embeds": [
					new EmbedBuilder()
						.setDescription(`Accepted emojis updated (${valid_emojis.join(", ")}).`),
				],
			});
		} else {
			// Invalid
			await interaction.editReply({
				"embeds": [
					new EmbedBuilder()
						.setDescription("At leat one emoji identifier is required."),
				],
			});
		}
	},
});
