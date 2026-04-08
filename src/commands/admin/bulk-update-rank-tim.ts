import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { AuditLogEvent, Message, PermissionFlagsBits, GuildAuditLogsEntry } from 'discord.js';
import { UserRankHistory } from '../../database/entities/UserRankHistory';
import User from '../../database/entities/User';

// Role ID threshold - any role below this in the hierarchy is considered a rank
const RANK_THRESHOLD_ROLE_ID = '1100345563876163705';

@ApplyOptions<Command.Options>({
	description: 'Admin command to bulk update rank history from audit logs',
	name: 'bulk-update-rank-time',
	aliases: ['bulk-update-rank-tim', 'burtime'],
	requiredUserPermissions: [PermissionFlagsBits.Administrator],
	fullCategory: ['Admin']
})
export class BulkUpdateRankTimCommand extends Command {
	public override async messageRun(message: Message) {
		const guildId = process.env.GUILD_ID;
		if (!guildId) return message.reply('❌ **Error:** GUILD_ID not configured in environment variables.');

		const guild = message.client.guilds.cache.get(guildId);
		if (!guild) return message.reply('❌ **Error:** Could not find the guild.');

		const thresholdRole = guild.roles.cache.get(RANK_THRESHOLD_ROLE_ID);
		if (!thresholdRole) return message.reply('❌ **Error:** Could not find the threshold role.');

		const statusMsg = await message.reply('🔄 Fetching audit logs and updating rank history... This may take a while.');

		try {
			let processedCount = 0;
			let updatedCount = 0;
			let lastAuditLogId: string | undefined;
			let hasMore = true;

			while (hasMore) {
				const auditLogs = await guild.fetchAuditLogs({
					type: AuditLogEvent.MemberRoleUpdate,
					before: lastAuditLogId
				});

				if (auditLogs.entries.size === 0) {
					hasMore = false;
					break;
				}

				for (const [logId, entry] of auditLogs.entries) {
					lastAuditLogId = logId;
					processedCount++;

					if (!entry.target) continue;
					const targetUserId = entry.target.id;

					const addedRoles = this.getAddedRoles(entry);

					for (const roleData of addedRoles) {
						// Check if role is below threshold (is a rank role)
						const role = guild.roles.cache.get(roleData.id);
						if (!role || role.position >= thresholdRole.position) continue;
						if (role.id === guild.id) continue; // Skip @everyone

						let user = await User.findOne({ where: { userId: targetUserId } });
						if (!user) {
							const member = guild.members.cache.get(targetUserId);
							user = new User();
							user.userId = targetUserId;
							user.username = member?.user.username || entry.target.username || 'Unknown';
							user.callsign = member?.user.username || entry.target.username || 'Unknown';
							await user.save();
						}

						const existingHistory = await UserRankHistory.findOne({
							where: {
								user: { userId: targetUserId },
								roleId: roleData.id,
								receivedAt: entry.createdAt
							}
						});

						if (!existingHistory) {
							const rankHistory = new UserRankHistory();
							rankHistory.user = user;
							rankHistory.roleId = roleData.id;
							rankHistory.roleName = roleData.name;
							rankHistory.receivedAt = entry.createdAt;
							rankHistory.isActive = true;
							await rankHistory.save();
							updatedCount++;
						}
					}

					// Check for removed roles and update existing records
					const removedRoles = this.getRemovedRoles(entry);

					for (const roleData of removedRoles) {
						const role = guild.roles.cache.get(roleData.id);
						if (!role || role.position >= thresholdRole.position) continue;
						if (role.id === guild.id) continue;

						const activeHistory = await UserRankHistory.findOne({
							where: {
								user: { userId: targetUserId },
								roleId: roleData.id,
								isActive: true
							},
							order: { receivedAt: 'DESC' }
						});

						if (activeHistory && !activeHistory.removedAt) {
							activeHistory.removedAt = entry.createdAt;
							activeHistory.isActive = false;
							await activeHistory.save();
						}
					}
				}

				if (processedCount % 100 === 0) {
					await statusMsg.edit(`🔄 Processed ${processedCount} audit log entries... (${updatedCount} rank records created)`);
				}

				await new Promise((resolve) => setTimeout(resolve, 500));
			}

			await statusMsg.edit(
				`✅ **Bulk rank history update complete!**\n` +
					`📊 Processed: ${processedCount} audit log entries\n` +
					`📝 Created: ${updatedCount} rank history records`
			);
		} catch (error) {
			console.error('Error in bulk rank time update:', error);
			await statusMsg.edit(`❌ **Error:** Failed to update rank history. Check console for details.`);
		}
	}

	private getAddedRoles(entry: GuildAuditLogsEntry): Array<{ id: string; name: string }> {
		const addedRoles: Array<{ id: string; name: string }> = [];

		if (!entry.changes) return addedRoles;

		for (const change of entry.changes) {
			if (change.key === '$add' && Array.isArray(change.new)) {
				for (const role of change.new as Array<{ id: string; name: string }>) {
					addedRoles.push(role);
				}
			}
		}

		return addedRoles;
	}

	private getRemovedRoles(entry: GuildAuditLogsEntry): Array<{ id: string; name: string }> {
		const removedRoles: Array<{ id: string; name: string }> = [];

		if (!entry.changes) return removedRoles;

		for (const change of entry.changes) {
			if (change.key === '$remove' && Array.isArray(change.new)) {
				for (const role of change.new as Array<{ id: string; name: string }>) {
					removedRoles.push(role);
				}
			}
		}

		return removedRoles;
	}
}
