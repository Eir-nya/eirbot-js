const fs = require("fs");
const path = require("path");
const { get_project_root } = require("../util/util");

const project_root = get_project_root();
const temp_path = path.join(project_root, "tmp");

if (!fs.existsSync(temp_path))
	fs.mkdirSync(temp_path, { "recursive": true });

// Clear temp folder on startup
for (const f of fs.readdirSync(temp_path, { "withFileTypes": true })) {
	if (f.isDirectory())
		fs.rmdirSync(path.join(temp_path, f.name));
	else
		fs.unlinkSync(path.join(temp_path, f.name));
}

async function download(filename, response) {
	const stream = fs.createWriteStream(path.join(temp_path, filename));

	await new Promise((resolve, reject) => {
		response.body.pipe(stream);
		response.body.on("error", reject);
		response.body.on("finish", resolve);
	});
}

function create_file_stream(filename) {
	return fs.createWriteStream(path.join(temp_path, filename));
}

function remove(filename) {
	fs.unlinkSync(path.join(temp_path, filename));
}

function get_full_path(filename) {
	return path.join(temp_path, filename);
}

module.exports = {
	download,
	create_file_stream,
	remove,
	get_full_path,
};
