class Event {
	name = null;
	once = false;
	// execute(Client, ...)
	execute = null;
	constructor(args) {
		const new_this = {...this, ...args};
		return new_this;
	}
}

module.exports = {
	Event: Event
}
