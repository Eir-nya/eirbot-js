module.exports = {
	get_channel: async (client, id) => await client.channels.fetch(id),
	get_server: async (client, id) => await client.guilds.fetch(id),
	get_message_in_channel: async (channel, id) => await channel.messages.fetch(id),
	// This returns a Collection rather than a dict or array
	get_message_reactions: message => message.reactions.cache,
	get_reaction_users: async reaction => await reaction.users.fetch(),

	get_self_as_server_member: async server => await server.members.fetchMe(),

	/*
	const cache = message.reactions.cache;
	console.log(cache.size); // 6
	console.log(cache.firstKey()); // 🩷
	for (const e of cache)
		console.log(e); // [🩷, MessageReaction]
	console.log(cache.keyAt(3)); // 🐱
	console.log(cache["🐱"]); // undefined
	console.log(cache.at("🐱")); // MessageReaction
	*/
};
