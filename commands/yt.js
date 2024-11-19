/**
 * @import { ChatInputCommandInteraction, TextChannel } from "discord.js";
 */
// const yt = require("youtube-search-api");
const https = require("https");
const { google } = require("googleapis");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");
const youtube_search = require.main.require("./modules/youtube_search");

const { youtube_api_key } = require.main.require("./config.json");
const youtube = google.youtube({
	version: "v3",
	auth: youtube_api_key,
	agent: new https.Agent({ rejectUnauthorized: false }),
});

module.exports = new Command({
	data: new SlashCommandBuilder()
		.setName("yt")
		.setDescription("Search youtube")
		.addStringOption(option =>
			option.setName("search")
				.setDescription("Search text")
				.setRequired(true)),
	interaction: async (/** @type ChatInputCommandInteraction */ interaction) => {
		const interaction_response = await interaction.deferReply();

		const videoReq = await youtube.search.list({
			part: "id,snippet",
			q: interaction.options.getString("search"),
			type: "video",
			videoDuration: "long",
		});

		const videoData = videoReq.data.items;

		if (videoData.length == 0) {
			await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setDescription(`No results found for \`${interaction.options.getString("search")}.\``),
				],
			});
			return;
		}

		const message_content = youtube_search.yt_message_content(interaction_response.id, videoData, 0);

		await interaction.editReply(message_content);
	},
});
