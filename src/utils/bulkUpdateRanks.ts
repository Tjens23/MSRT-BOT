import { client } from '../index';
import { trackRankChanges } from './rankTracking';
import { getRankRoleIds } from './rankRoleIds';
import { excludedRoleIds } from './excludeRoleIds';

/**
 * Bulk update rank data for all existing members in the guild
 * This should be run once to populate the database with existing member rank data
 */
export const bulkUpdateRanks = async (guildId: string = '1253817742054654075') => {
	console.log('Starting bulk update of member ranks...');

	const guild = client.guilds.cache.get(guildId);
	if (!guild) {
		console.error(`Guild with ID ${guildId} not found`);
		return;
	}

	const members = await guild.members.fetch();
	const rankRoleIds = await getRankRoleIds();
	const excludedRoles = await excludedRoleIds();

	let processed = 0;
	let errors = 0;
	let ranksTracked = 0;

	console.log(`Found ${members.size} members to process...`);
	console.log(`Tracking roles: ${rankRoleIds.length} rank roles configured`);
	console.log(`Excluding roles: ${excludedRoles.length} roles excluded`);

	for (const [, member] of members) {
		if (member.user.bot) continue;

		try {
			// Count rank roles this member has
			const memberRankRoles = member.roles.cache.filter((role) => rankRoleIds.includes(role.id) && !excludedRoles.includes(role.id));

			if (memberRankRoles.size > 0) {
				console.log(`${member.user.username} has ${memberRankRoles.size} rank roles: ${memberRankRoles.map((r) => r.name).join(', ')}`);
			}

			// Track initial ranks for each member (this saves to UserRankHistory)
			await trackRankChanges(member);
			processed++;
			ranksTracked += memberRankRoles.size;

			if (processed % 10 === 0) {
				console.log(`Processed ${processed} members, tracked ${ranksTracked} total ranks...`);
			}
		} catch (error) {
			console.error(`Error processing ${member.user.username}:`, error);
			errors++;
		}

		// Add a small delay to avoid rate limits
		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	console.log(`Bulk rank update completed!`);
	console.log(`- Processed: ${processed} members`);
	console.log(`- Total ranks tracked: ${ranksTracked}`);
	console.log(`- Errors: ${errors}`);

	return { processed, errors, ranksTracked };
};
