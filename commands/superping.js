const { SlashCommandBuilder } = require("discord.js");
const { Command } = require.main.require("./commands/internal/class");

module.exports = new Command({
	data: new SlashCommandBuilder()
		.setName("superping")
		.setDescription("Replies with Superpong!"),
	interaction: async (interaction) => {
		/*
		const channel_id = "762852448930758705";
		const message_id = "1296245206554902649";
		const channel = await interaction.client.channels.fetch(channel_id);
		const message = await channel.messages.fetch(message_id);
		*/

		// console.log(await interaction.client.emojis.resolve("1202182954290524160")); // GuildEmoji {animated: false, name: "paws_up", id: "1202182954290524160", guild: Guild, requiresColons: true, ...}

		/*
		const cache = message.reactions.cache;
		console.log(cache.size); // 6 | 1
		console.log(cache.firstKey()); // 🩷 | 1202182954290524160
		for (const e of cache)
			console.log(e); // [🩷, MessageReaction] | ["1202182954290524160", MessageReaction]
		console.log(cache.keyAt(3)); // 🐱 | undefined
		console.log(cache["🐱"]); // undefined | undefined
		console.log(cache.at("🐱")); // MessageReaction | MessageReaction?!
		*/
		/*
		console.log(message);
		console.log(message.reactions.cache);
		console.log(message.reactions.cache.first());
		const users_who_reacted = message.reactions.cache.first().users;
		console.log(await users_who_reacted.fetch()); // another collection where each key is a user id and each value is a user
		*/

		/*
		const user_id = "983913305666113616";
		const users_who_reacted = await message.reactions.cache.first().users.fetch();
		console.log(users_who_reacted.first(u => u.id == user_id)); // []
		console.log(users_who_reacted.at(user_id)); // undefined
		*/

		await interaction.reply("Superpong");
	},
	guild_ids: [ "294341563683831819" ],
});
