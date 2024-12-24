/**
 * @import { ChatInputCommandInteraction } from "discord.js";
 */
const fetch = require("node-fetch");
const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");
const fs = require("fs");
const path = require("path");
const https = require("https");
const { get_project_root } = require.main.require("./util/util.js");
const temp_folder = require.main.require("./util/temp_folder");

// BurningText's endpoint has an expired cert, so I need to handle it myself, like so:
const root_cas = require("ssl-root-cas").create();
root_cas.addFile(path.join(get_project_root(), "commands", "burning_text_cert.pem"));
const https_agent = new https.Agent({ ca: root_cas, rejectUnauthorized: false });

const text_url = "https://cooltext.com/PostChange";
const text_format = "LogoID=4&Text={0}&FontSize=70&Color1_color=%23FF0000&Integer1=15&Boolean1=on&Integer9=1&Integer13=on&Integer12=on&BackgroundColor_color=$23FFFFFF";

module.exports = new Command({
	data: new SlashCommandBuilder()
		.setName("burning_text")
		.setDescription("Generates burning text.")
		.addStringOption(option =>
			option.setName("text")
				.setDescription("Text to use.")
				.setRequired(true)),
	interaction: async (/** @type ChatInputCommandInteraction */ interaction) => {
		await interaction.deferReply();

		const response = await fetch(text_url, {
			"body": text_format.replace("{0}", interaction.options.getString("text")),
			"agent": https_agent,
			"headers": {
				"content-type": "application/x-www-form-urlencoded",
			},
			"method": "POST",
		});
		if (!response.ok) {
			// Throw error
			await interaction.editReply({
				"embeds": [
					new EmbedBuilder()
						.setDescription(`An error occured while fetching burning text.\n${response.status}: ${response.statusText}`),
				],
			});
		}

		const as_text = await response.text();
		let as_json;
		try {
			as_json = JSON.parse(as_text);
		} catch (e) {
			console.error(e);
			// Throw error
			await interaction.editReply({
				"embeds": [
					new EmbedBuilder()
						.setDescription(`An error occured while fetching burning text.\n${e}`),
				],
			});
		}

		// Text generated! Just need to fetch it...
		const text_request = await fetch(as_json["renderLocation"], {
			"agent": https_agent,
			"headers": {
				"content-type": "application/json",
			},
		});

		await temp_folder.download("burningtext.gif", text_request);

		// New message
		const new_stream = fs.createReadStream(temp_folder.get_full_path("burningtext.gif"));
		new_stream.on("finish", () => temp_folder.remove("burningtext.gif"));
		await interaction.editReply({
			"files": [
				new AttachmentBuilder()
					.setFile(new_stream),
			],
		});
	},
});
