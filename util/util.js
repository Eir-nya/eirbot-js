const fs = require("fs");
const path = require("path");

const get_project_root = () => path.join(__dirname, "../");
const get_excluded = p => {
	if (!p.startsWith(get_project_root()))
		p = path.join(get_project_root(), p);

	const exclude_path = path.join(p, "_exclude.json");
	if (fs.existsSync(exclude_path))
		return require(exclude_path);
	else {
		return {
			"folders": [],
			"files": [],
		};
	}
};
const should_exclude = fpath => {
	if (!fpath.startsWith(get_project_root()))
		fpath = path.join(get_project_root(), fpath);

	const excluded = get_excluded(path.join(fpath, ".."));
	return excluded.folders.includes(path.basename(fpath)) || excluded.files.includes(path.basename(fpath)) || fpath.endsWith("_exclude.json");
};

module.exports = {
	get_project_root,
	get_excluded,
	should_exclude,
};
