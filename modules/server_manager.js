const fs = require("fs");
const path = require("path");
const { get_project_root } = require("../util/util");

const project_root = get_project_root();
const cache_folder = path.join(project_root, "cache", "servers");

if (!fs.existsSync(cache_folder))
	fs.mkdirSync(cache_folder, { "recursive": true });

const server_cache = {}; // Server cache data is read into memory as-needed instead of on boot

const default_settings = {
	server_id: null,
};

function write_server_cache() {
	for (const id of Object.keys(server_cache)) {
		const destination_path = path.join(cache_folder, `${id}.json`);
		fs.writeFileSync(destination_path, JSON.stringify(server_cache[id]));
	}
}

function read(server_or_id) {
	const id = typeof server_or_id == "number" ? server_or_id.toString() : (typeof server_or_id == "string" ? server_or_id : server_or_id.id);

	// Pass 1: Read from json
	if (!server_cache[id]) {
		const read_from_path = path.join(cache_folder, `${id}.json`);
		if (fs.existsSync(read_from_path))
			server_cache[id] = JSON.parse(fs.readFileSync(read_from_path));
	}
	// Pass 2: Clone tepmlate settings
	if (!server_cache[id]) {
		server_cache[id] = JSON.parse(JSON.stringify(default_settings));
		server_cache[id].server_id = id;
		write_server_cache();
	}

	return server_cache[id];
}

function write(server_or_id, key, value) {
	const in_cache = read(server_or_id);
	in_cache[key] = value;
	write_server_cache();
}

module.exports = {
	read,
	write,
};
