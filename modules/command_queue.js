const command_queue = [];
let is_updating = false;

function update() {
	is_updating = true;

	const next_task = command_queue.pop();
	if (next_task) {
		next_task.method.then(() => {
			is_updating = false;
			next_task.resolve();
			update();
		});
	}
	is_updating = false;
}

module.exports = {
	enqueue: async method => {
		await new Promise(resolve => {
			command_queue.push({ method, resolve });

			if (!is_updating)
				update();
		});
	},
};
