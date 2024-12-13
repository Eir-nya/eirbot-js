/**
 * @import { ChatInputCommandInteraction } from "discord.js";
 */
const { SlashCommandSubcommandBuilder, EmbedBuilder } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");
const starboard = require.main.require("./modules/starboard");

module.exports = new Command({
	data: new SlashCommandSubcommandBuilder()
		.setName("use_webhook")
		.setDescription("Use webhook for starboard messages (requires \"Manage Webhooks\" perm)")
		.addBooleanOption(option =>
			option.setName("use")
				.setDescription("Use webhook for starboard messages")
				.setRequired(true)),
	interaction: async (/** @type ChatInputCommandInteraction */ interaction) => {
		await interaction.deferReply({ "ephemeral": true });

		const bool = interaction.options.getBoolean("use");
		starboard.set_setting(interaction.guild, "use_webhook", bool);

		await interaction.editReply({
			"embeds": [
				new EmbedBuilder()
					.setDescription(`Starboard **will${!bool ? " not" : ""}** use a webhook when posting.`),
			],
		});
	},
});
