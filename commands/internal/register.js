/**
 * @import { Client } from "discord.js"
 */
const { REST, Routes, Events, SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } = require("discord.js");
const { token, client_id } = require.main.require("./config.json");
const fs = require("fs");
const path = require("path");
const { get_project_root, should_exclude } = require.main.require("./util/util");
const cooldown_manager = require("./cooldowns");
const command_queue = require.main.require("./modules/command_queue");

const project_root = get_project_root();
const command_folder = path.join(project_root, "commands");

const commands = {};
const subcommand_groups = {};
const subcommands = {};

/**
 * @param {string} fullpath
 * @returns string
 */
function get_basename(fullpath) {
	// return path.basename(fullpath.split(command_folder)[1]);
	return fullpath.split(command_folder + "/")[1];
}

/**
 * Normal add command
 * @param {string} filepath
 * @param {string} name
 * @returns command?
 */
function add_command(filepath, name) {
	const command = require(filepath);
	if (command.data) {
		commands[name] = command;
		// commands[command.data.name] = command;
		return command;
	} else
		console.error(`Command at "${filepath}" not registered correctly!`);
}

// Add all commands in the root directory
for (const filedirent of fs.readdirSync(command_folder, { "withFileTypes": true }).filter(filedirent => filedirent.name.endsWith(".js") && !should_exclude(path.join(command_folder, filedirent.name)))) {
	const filepath = path.join(command_folder, filedirent.name);
	if (filedirent.isDirectory())
		continue;

	add_command(filepath, filedirent.name.split(".js")[0]);
}

/**
 * Add all commands in subfolders
 * @param {string} folder
 * @param {number} depth
 */
function add_subcommands_recursive(folder, depth) {
	const _grouppath = path.join(folder, "_group.js");
	// Needs a "_group.js" file to describe subcommand group
	if (!fs.existsSync(_grouppath)) {
		console.error(`Subcommand group "${get_basename(folder)}" missing "_group.js" definition!`);
		return;
	}

	// Get parent command or subcommand group
	const root_command = commands[get_basename(path.join(folder, ".."))];
	const root_subcommand_group = subcommand_groups[get_basename(path.join(folder, ".."))];
	const parent = root_command || root_subcommand_group;

	const is_command = depth == 0;
	console.log("[REGISTERING]", `${"-".repeat(get_basename(folder).length - get_basename(folder).replaceAll("/", "").length)}` + get_basename(folder));
	const subcommand_group = require(_grouppath);
	// If parent folder is immediately inside commands, ie. commands/test, type should be SlashCommandBuilder instead
	if (subcommand_group.data instanceof (is_command ? SlashCommandBuilder : SlashCommandSubcommandGroupBuilder)) {
		(is_command ? commands : subcommand_groups)[get_basename(folder)] = subcommand_group;
		// (is_command ? commands : subcommand_groups)[subcommand_group.data.name] = subcommand_group;
		if (!is_command)
			parent.data.addSubcommandGroup(subcommand_group.data);
	} else {
		console.error(`Subcommand group "${get_basename(folder)}"'s "_group.js" did not return a ${(is_command ? "SlashCommandBuilder" : "SlashCommandSubcommandGroupBuilder")}!`);
		return;
	}

	// Parse all other files and folders in this path.
	for (const fdirent of fs.readdirSync(folder, { "withFileTypes": true }).filter(fdirent => fdirent.name != "_group.js")) {
		const fpath = path.join(folder, fdirent.name);
		if (should_exclude(fpath))
			continue;

		// If directory, treat as subcommand group, and recurse
		if (fdirent.isDirectory()) {
			if (depth < 1) // Discord's limit on subcommand nesting is 1 layer
				add_subcommands_recursive(path.join(folder, fdirent.name), depth + 1);
			else
				console.error(`Nested subcommand groups can not go more than 1 layer deep. Offending subcommand group: "${path.join(folder, fdirent.name)}"`);
		// Otherwise, add as subcommand
		} else {
			console.log("[REGISTERING]", `${"-".repeat(get_basename(fpath).length - get_basename(fpath).replaceAll("/", "").length)}` + get_basename(fpath).split(".js")[0]);
			const subcommand = require(fpath);
			if (subcommand.data instanceof SlashCommandSubcommandBuilder) {
				subcommands[get_basename(fpath).split(".js")[0]] = subcommand;
				// subcommands[subcommand.data.name] = subcommand;
				subcommand_group.data.addSubcommand(subcommand.data);
			} else {
				console.error(`Subcommand "${get_basename(fpath)}" did not return a SlashCommandSubcommandBuilder!`);
				continue;
			}
		}
	}
}

// Start recursing subfolders
for (const folderdirent of fs.readdirSync(command_folder, { "withFileTypes": true }).filter(folderdirent => folderdirent.isDirectory())) {
	const folderpath = path.join(command_folder, folderdirent.name);
	if (should_exclude(folderpath))
		continue;
	add_subcommands_recursive(folderpath, 0);
}

// Only register commands if we need to.
const command_cache_path = path.join(project_root, "command_cache.json");
let command_cache = {};
if (fs.existsSync(command_cache_path))
	command_cache = require(command_cache_path);

const old_command_cache_json = JSON.stringify(command_cache);
const new_command_cache_json = JSON.stringify({ commands, subcommand_groups, subcommands });
if (new_command_cache_json != old_command_cache_json) {
	// Update command cache json
	fs.writeFileSync(command_cache_path, new_command_cache_json);

	// Construct and prepare an instance of the REST module
	const rest = new REST().setToken(token);

	// and deploy your commands!
	(async () => {
		try {
			console.log(`Started refreshing ${Object.values(commands).length} application (/) commands.`);

			// Register guild commands
			const guilds = {};
			for (const command of Object.values(commands).filter(command => command.guild_ids)) {
				for (const guild_id of command.guild_ids)
					guilds[guild_id.toString()] = true;
			}

			for (const guild_id of Object.keys(guilds)) {
				await rest.put(
					Routes.applicationGuildCommands(client_id, guild_id.toString()),
					{ body: Object.values(commands).filter(command => command.guild_ids && (command.guild_ids.includes(guild_id) || command.guild_ids.includes(Number(guild_id)))).map(command => command.data.toJSON()) },
				);
			}

			// Register global commands
			await rest.put(
				Routes.applicationCommands(client_id),
				{ body: Object.values(commands).filter(command => !command.guild_ids).map(command => command.data.toJSON()) },
			);

			console.log(`Successfully reloaded all application (/) commands.`);
		} catch (error) {
			// And of course, make sure you catch and log any errors!
			console.error(error);
		}
	})();
}

module.exports = (/** @type Client */ client) => {
	// Register command interactions
	client.on(Events.InteractionCreate, async interaction => {
		if (!interaction.isChatInputCommand()) return;

		const command = commands[interaction.commandName];

		// No command found
		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		// Run command or subcommand
		try {
			// Run subcommand if applicable
			let target;
			const subcommand_name = interaction.options._subcommand;
			if (subcommand_name) {
				let subcommand = subcommands[path.join(interaction.commandName, subcommand_name)];
				if (interaction.options._group)
					subcommand = subcommands[path.join(interaction.commandName, interaction.options._group, subcommand_name)];

				if (subcommand) {
					if (subcommand.interaction)
						target = subcommand; // await subcommand.interaction(interaction);
					else
						console.error(`Command "${interaction.commandName}" was executed with subcommand "${subcommand_name}", subcommand had no interaction registered!`);
				} else
					console.error(`Command "${interaction.commandName}" was executed with subcommand "${subcommand_name}", but no matching subcommand was found!`);
			} else if (command.interaction)
				target = command; // await command.interaction(interaction);
			else
				console.error(`Command "${interaction.commandName}" was executed, but command had no interaction registered!`);

			// Run interaction
			if (cooldown_manager.validate(interaction)) {
				if (target.bypass_enqueue)
					await cooldown_manager.call_with_cooldown(interaction, target);
				else {
					await command_queue.enqueue(new Promise(resolve => {
						cooldown_manager.call_with_cooldown(interaction, target)
							.then(resolve);
					}));
				}
			} else
				await cooldown_manager.handle_cooldown(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred)
				await interaction.followUp({ content: "There was an error while executing this command!", ephemeral: true });
			else
				await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
		}
	});
};
