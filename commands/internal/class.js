class Command {
	data = null;
	// In milliseconds
	cooldown = 0;
	// interaction(CommandInteractionOptionResolver interaction)
	// only called if no subcommand was called
	interaction = null;
	/** @type [String|Number] */
	guild_ids = null;
	// if true, interaction executes instantly. if false, interaction is placed in the async queue for performance reasons
	bypass_enqueue = false;

	constructor(args = {}) {
		const new_this = {...this, ...args};
		return new_this;
	}
}

module.exports = {
	Command: Command
}
