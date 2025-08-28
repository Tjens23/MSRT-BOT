import { GuildMember, Role } from "discord.js";
import { database } from "../database";
import User from "../database/entities/User";
import { UserRankHistory } from "../database/entities/UserRankHistory";
import { excludedRoleIds } from "./excludeRoleIds";
import { getRankRoleIds } from "./rankRoleIds";

/**
 * Track rank changes for a user
 * @param member - The guild member whose ranks to track
 * @param oldRoles - Previous roles (for role updates)
 * @param newRoles - Current roles (for role updates)
 */
export const trackRankChanges = async (
    member: GuildMember, 
    oldRoles?: Role[], 
    newRoles?: Role[]
) => {
    // Initialize database if not connected
    if (!database.isInitialized) {
        await database.initialize();
    }

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
        const rankRoleIds = await getRankRoleIds();

        // If this is initial tracking (no old roles provided), record current ranks
        if (!oldRoles && !newRoles) {
            for (const [roleId, role] of currentRoles) {
                if (rankRoleIds.includes(roleId) && !excludedRoles.includes(roleId)) {
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
            const oldRoleIds = oldRoles.map(role => role.id);
            const newRoleIds = newRoles.map(role => role.id);
            const rankRoleIds = await getRankRoleIds();

            // Find added ranks
            const addedRankIds = newRoleIds.filter(roleId => 
                !oldRoleIds.includes(roleId) && 
                rankRoleIds.includes(roleId) && 
                !excludedRoles.includes(roleId)
            );

            // Find removed ranks
            const removedRankIds = oldRoleIds.filter(roleId => 
                !newRoleIds.includes(roleId) && 
                rankRoleIds.includes(roleId) && 
                !excludedRoles.includes(roleId)
            );

            // Process added ranks
            for (const roleId of addedRankIds) {
                const role = member.guild.roles.cache.get(roleId);
                if (role) {
                    const rankHistory = new UserRankHistory();
                    rankHistory.user = user;
                    rankHistory.roleId = roleId;
                    rankHistory.roleName = role.name;
                    rankHistory.receivedAt = new Date();
                    rankHistory.isActive = true;
                    await rankHistory.save();
                    
                    console.log(`Rank added: ${member.user.username} received ${role.name}`);
                }
            }

            // Process removed ranks
            for (const roleId of removedRankIds) {
                const activeRecord = await UserRankHistory.findOne({
                    where: {
                        user: { userId: member.user.id },
                        roleId: roleId,
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
    if (!database.isInitialized) {
        await database.initialize();
    }

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
    if (!database.isInitialized) {
        await database.initialize();
    }

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
export const getRankLeaderboard = async (roleId: string, limit: number = 10) => {
    if (!database.isInitialized) {
        await database.initialize();
    }

    const activeRanks = await UserRankHistory.find({
        where: {
            roleId,
            isActive: true
        },
        relations: ['user'],
        order: { receivedAt: 'ASC' } // Oldest first = longest time in rank
    });

    return activeRanks.slice(0, limit).map(rank => ({
        user: rank.user,
        roleName: rank.roleName,
        receivedAt: rank.receivedAt,
        timeInRank: rank.getFormattedDuration()
    }));
};
