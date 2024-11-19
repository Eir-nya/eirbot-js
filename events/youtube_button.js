/**
 * @import { Interaction } from "discord.js"
 */
const { Events } = require("discord.js");
const { Event } = require.main.require("./events/internal/class");
const youtube_search = require.main.require("./modules/youtube_search");

module.exports = new Event({
	name: Events.InteractionCreate,
	execute: async (client, /** @type Interaction */ interaction) => {
		if (!interaction.isButton())
			return;

		await interaction.deferUpdate();

		/** @type string */
		const button_id = interaction.component.customId;

		if (!button_id.startsWith("yt_"))
			return;

		const video_id = button_id.split("yt_")[1];

		await interaction.message.edit(youtube_search.message_content_from_button(interaction.message, video_id));
	},
});
