/**
 * @import { Client } from "discord.js"
 */
const fs = require("fs");
const path = require("path");
const { get_project_root, should_exclude } = require.main.require("./util/util.js");

const project_root = get_project_root();
const event_folder = path.join(project_root, "events");

// Get all JS files to require
const event_scripts = {};
/**
 * @param {string} folder
 */
function recurse(folder) {
	for (const fdirent of fs.readdirSync(folder, { "withFileTypes": true }).filter(fdirent => !should_exclude(path.join(folder, fdirent.name)))) {
		if (fdirent.isDirectory())
			recurse(path.join(folder, fdirent.name));
		else
			event_scripts[path.join(folder, fdirent.name)] = require(path.join(folder, fdirent.name));
	}
}
recurse(event_folder);

// Register all events
module.exports = (/** @type Client */ client) => {
	for (const event of Object.values(event_scripts)) {
		if (event.once)
			client.once(event.name, (...args) => event.execute(client, ...args));
		else
			client.on(event.name, (...args) => event.execute(client, ...args));
	}
};
