/**
 * @import { InteractionReplyOptions } from "discord.js"
 */
const { EmbedBuilder } = require("discord.js");

const petpet_url = "https://api.obamabot.me/v2/image/petpet?image={0}";

module.exports = {
	/**
	 * @param {string} url
	 * @returns {InteractionReplyOptions}
	 */
	do_pet: async url => {
		// First, verify this is an image
		const initial_response = await fetch(url, { method: "HEAD" });
		/*if (!initial_response.ok) {
			return {
				"embeds": [
					new EmbedBuilder()
						.setDescription(`Failed to retrieve petpet:\n${initial_response.status}: ${initial_response.statusText}`),
				],
				"ephemeral": true,
			};
		}*/
		if (!initial_response.headers.get("content-type").includes("image/")) {
			return {
				"embeds": [
					new EmbedBuilder()
						.setDescription("Supplied URL is not a valid image."),
				],
				"ephemeral": true,
			};
		}

		// Second, send real request
		const pet_response = await fetch(petpet_url.replace("{0}", encodeURIComponent(url)));
		if (!initial_response.ok) {
			return {
				"embeds": [
					new EmbedBuilder()
						.setDescription(`Failed to retrieve petpet:\n${initial_response.status}: ${initial_response.statusText}`),
				],
				"ephemeral": true,
			};
		}

		const as_json = await pet_response.json();
		if (!as_json.error && as_json.url) {
			return {
				"files": [{
					attachment: (await fetch(as_json.url)).body,
					name: "petpet.gif",
				}],
			};
		}
	},
};
