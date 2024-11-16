/**
 * @import { Snowflake, Interaction } from "discord.js"
 */
const path = require("path");

/**
 * @typedef {{string, Date}} CooldownInfo
 */
/** @type {{Object.<Snowflake, CooldownInfo>}} */
const cooldowns = {};

function get_command_id(/** @type Interaction */ interaction) {
	let command_id = interaction.commandName;
	if (interaction.options._subcommand) {
		if (interaction.options._group)
			command_id = path.join(command_id, interaction.options._group, interaction.options._subcommand);
		else
			command_id = path.join(command_id, interaction.options._subcommand);
	}
	return command_id;
}

module.exports = {
	validate: (/** @type Interaction */ interaction) => {
		const user_id = interaction.user.id;
		const command_id = get_command_id(interaction);

		if (cooldowns[user_id] && cooldowns[user_id][command_id]) {
			const expiration_time = cooldowns[user_id][command_id];
			const now = Date.now();

			if (now >= expiration_time) {
				delete cooldowns[user_id][command_id];
				if (Object.keys(cooldowns[user_id]).length == 0)
					delete cooldowns[user_id];
			}
			return now >= expiration_time;
		} else
			return true;
	},
	handle_cooldown: async (/** @type Interaction */ interaction) => {
		const user_id = interaction.user.id;
		const command_id = get_command_id(interaction);

		await interaction.reply({
			content: `You are on a cooldown from using this command. You can use it again <t:${Math.round(cooldowns[user_id][command_id] / 1000)}:R>.`,
			ephemeral: true,
		});
	},
	call_with_cooldown: async (/** @type Interaction */ interaction, command) => {
		const user_id = interaction.user.id;
		const command_id = get_command_id(interaction);

		if (command.cooldown && command.cooldown > 0) {
			if (!cooldowns[user_id])
				cooldowns[user_id] = {};
			cooldowns[user_id][command_id] = Date.now() + command.cooldown;
		}

		await command.interaction(interaction);
	},
};
