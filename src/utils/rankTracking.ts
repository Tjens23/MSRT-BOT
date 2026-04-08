import { GuildMember, Role } from 'discord.js';
import User from '../database/entities/User';
import { UserRankHistory } from '../database/entities/UserRankHistory';
import { excludedRoleIds } from './excludeRoleIds';

// Role ID threshold - any role below this in the hierarchy is considered a rank
const RANK_THRESHOLD_ROLE_ID = '1100345563876163705';

export interface LeaderboardEntry {
	user: User;
	roleName: string;
	receivedAt: Date;
	timeInRank: string;
}

/**
 * Check if a role is a rank (below the threshold role in hierarchy)
 */
export const isRankRole = (role: Role, guild: GuildMember['guild']): boolean => {
	const thresholdRole = guild.roles.cache.get(RANK_THRESHOLD_ROLE_ID);
	if (!thresholdRole) return false;

	// Role position is lower = lower in hierarchy
	// We want roles BELOW the threshold (lower position number)
	return role.position < thresholdRole.position && role.id !== guild.id; // Exclude @everyone
};

/**
 * Track rank changes for a user
 * @param member - The guild member whose ranks to track
 * @param oldRoles - Previous roles (for role updates)
 * @param newRoles - Current roles (for role updates)
 */
export const trackRankChanges = async (member: GuildMember, oldRoles?: Role[], newRoles?: Role[]) => {
	try {
		// Get or create user
		let user = await User.findOne({
			where: { userId: member.user.id },
			relations: ['rankHistory']
		});

		if (!user) {
			user = new User();
			user.userId = member.user.id;
			user.username = member.user.username;
			user.callsign = member.user.username;
			await user.save();
		}

		const currentRoles = member.roles.cache;
		const excludedRoles = await excludedRoleIds();

		// If this is initial tracking (no old roles provided), record current ranks
		if (!oldRoles && !newRoles) {
			for (const [roleId, role] of currentRoles) {
				if (isRankRole(role, member.guild) && !excludedRoles.includes(roleId)) {
					// Check if we already have an active record for this role
					const existingRecord = await UserRankHistory.findOne({
						where: {
							user: { userId: member.user.id },
							roleId: roleId,
							isActive: true
						}
					});

					if (!existingRecord) {
						const rankHistory = new UserRankHistory();
						rankHistory.user = user;
						rankHistory.roleId = roleId;
						rankHistory.roleName = role.name;
						rankHistory.receivedAt = member.joinedAt || new Date();
						rankHistory.isActive = true;
						await rankHistory.save();

						console.log(`Initial rank tracking: ${member.user.username} - ${role.name}`);
					}
				}
			}
			return;
		}

		// Handle role updates
		if (oldRoles && newRoles) {
			const oldRoleIds = oldRoles.map((role) => role.id);
			const newRoleIds = newRoles.map((role) => role.id);

			// Find added ranks
			const addedRoles = newRoles.filter(
				(role) => !oldRoleIds.includes(role.id) && isRankRole(role, member.guild) && !excludedRoles.includes(role.id)
			);

			// Find removed ranks
			const removedRoles = oldRoles.filter(
				(role) => !newRoleIds.includes(role.id) && isRankRole(role, member.guild) && !excludedRoles.includes(role.id)
			);

			// Process added ranks
			for (const role of addedRoles) {
				const rankHistory = new UserRankHistory();
				rankHistory.user = user;
				rankHistory.roleId = role.id;
				rankHistory.roleName = role.name;
				rankHistory.receivedAt = new Date();
				rankHistory.isActive = true;
				await rankHistory.save();

				console.log(`Rank added: ${member.user.username} received ${role.name}`);
			}

			// Process removed ranks
			for (const role of removedRoles) {
				const activeRecord = await UserRankHistory.findOne({
					where: {
						user: { userId: member.user.id },
						roleId: role.id,
						isActive: true
					}
				});

				if (activeRecord) {
					activeRecord.removedAt = new Date();
					activeRecord.isActive = false;
					await activeRecord.save();

					console.log(`Rank removed: ${member.user.username} lost ${activeRecord.roleName}`);
				}
			}
		}
	} catch (error) {
		console.error(`Error tracking rank changes for ${member.user.username}:`, error);
	}
};

/**
 * Get current active ranks for a user
 * @param userId - Discord user ID
 * @returns Array of active rank records
 */
export const getUserCurrentRanks = async (userId: string) => {
	return await UserRankHistory.find({
		where: {
			user: { userId },
			isActive: true
		},
		relations: ['user'],
		order: { receivedAt: 'DESC' }
	});
};

/**
 * Get full rank history for a user
 * @param userId - Discord user ID
 * @returns Array of all rank records (active and inactive)
 */
export const getUserRankHistory = async (userId: string) => {
	return await UserRankHistory.find({
		where: {
			user: { userId }
		},
		relations: ['user'],
		order: { receivedAt: 'DESC' }
	});
};

/**
 * Get users who have held a specific rank the longest
 * @param roleId - The role ID to check
 * @param limit - Number of results to return
 * @returns Array of users sorted by time in rank
 */
export const getRankLeaderboard = async (roleId: string, limit: number = 10): Promise<LeaderboardEntry[]> => {
	const activeRanks = await UserRankHistory.find({
		where: {
			roleId,
			isActive: true
		},
		relations: ['user'],
		order: { receivedAt: 'ASC' } // Oldest first = longest time in rank
	});

	return activeRanks.slice(0, limit).map((rank) => ({
		user: rank.user,
		roleName: rank.roleName,
		receivedAt: rank.receivedAt,
		timeInRank: rank.getFormattedDuration()
	}));
};
