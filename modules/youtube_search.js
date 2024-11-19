/**
 * @import { Message, MessageCreateOptions } from "discord.js"
 */

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const youtube_video_format = "https://www.youtube.com/watch?v={0}";

const button_emojis = [
	"1️⃣",
	"2️⃣",
	"3️⃣",
	"4️⃣",
	"5️⃣",
];

module.exports = {
	/**
	 * @param {[string]} youtube_video_ids
	 * @param {number} selected
	 * @returns {MessageCreateOptions}
	 */
	yt_message_content: (message_id, youtube_videos, selected) => {
		return {
			content: youtube_video_format.replace("{0}", youtube_videos[selected].id.videoId),
			components: youtube_videos.map((video, i) => new ActionRowBuilder().addComponents(new ButtonBuilder()
				.setCustomId(`yt_${video.id.videoId}`)
				.setLabel(video.snippet.title.length > 80 ? `${video.snippet.title.substring(0, 77)}...` : video.snippet.title)
				.setEmoji(button_emojis[i])
				.setDisabled(i == selected)
				.setStyle(i == 0 ? ButtonStyle.Primary : ButtonStyle.Secondary),
			)),
		};
	},

	/**
	 * @param {Message} message
	 * @param {string} new_video_id
	 * @returns {MessageCreateOptions}
	 */
	message_content_from_button: (message, new_video_id) => {
		return {
			content: youtube_video_format.replace("{0}", new_video_id),
			components: message.components.map(row => new ActionRowBuilder().addComponents(new ButtonBuilder()
				.setCustomId(row.components[0].customId)
				.setLabel(row.components[0].label)
				.setEmoji(row.components[0].emoji)
				.setDisabled(row.components[0].customId == `yt_${new_video_id}`)
				.setStyle(row.components[0].style),
			)),
		};
	},
};
