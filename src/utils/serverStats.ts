import { client } from '../index';
import { ChannelType, VoiceChannel } from 'discord.js';

/**
 * Mapping of rank roles to their stats voice channels.
 * Each entry maps a role ID to a voice channel ID that displays the member count.
 */
const STATS_CONFIG = [
	{ roleId: '1019122765921521745', channelId: '1098371457664438345', displayName: 'Recruit' },
	{ roleId: '1020122444029243482', channelId: '1098371352320299100', displayName: 'Marine' },
	{ roleId: '1257059231245275186', channelId: '1279057380482748476', displayName: 'Cerberus Platoon' },
	{ roleId: '1221479782538022942', channelId: '1279057510271287328', displayName: 'Specter Platoon' }
];

/**
 * Updates all server stats voice channels with current member counts.
 */
export const updateServerStats = async () => {
	const guild = client.guilds.cache.get(process.env.GUILD_ID!);
	if (!guild) return;

	// Ensure members are cached with timeout and error handling
	try {
		await guild.members.fetch({ time: 120_000, withPresences: false });
	} catch (error) {
		client.logger.warn(`Failed to fetch guild members for stats update: ${error}. Using cached members.`);
	}

	for (const stat of STATS_CONFIG) {
		const role = guild.roles.cache.get(stat.roleId);
		const channel = guild.channels.cache.get(stat.channelId);

		if (!role || !channel || channel.type !== ChannelType.GuildVoice) continue;

		const count = role.members.size;
		const newName = `${stat.displayName}: ${count}`;

		// Only update if name actually changed to avoid unnecessary API calls
		if ((channel as VoiceChannel).name !== newName) {
			try {
				await (channel as VoiceChannel).setName(newName);
			} catch (err) {
				client.logger.error(`Failed to update stats channel for ${stat.displayName}: ${err}`);
			}
		}
	}
};

/**
 * Starts the server stats update loop.
 * Updates every 10 minutes to stay within Discord rate limits.
 */
export const startServerStats = async () => {
	// Initial update
	await updateServerStats();

	// Update every 10 minutes (Discord rate limits channel name changes to 2 per 10 min)
	setInterval(updateServerStats, 10 * 60 * 1000);
};
