import { Listener } from '@sapphire/framework';
import { Collection, GuildMember, PartialGuildMember, Role } from 'discord.js';
import { sendAuditLog, truncateString } from '../../utils/auditLogger';
import { UserRankHistory } from '../../database/entities/UserRankHistory';
import User from '../../database/entities/User';

// Role ID thresholds - ranks are roles BETWEEN these two in hierarchy
const RANK_UPPER_THRESHOLD_ROLE_ID = '1100345563876163705'; // Must be below this
const RANK_LOWER_THRESHOLD_ROLE_ID = '1100348729497751552'; // Must be above this

export class GuildMemberUpdateLogListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'guildMemberUpdate'
		});
	}

	public async run(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember): Promise<void> {
		if (!newMember.guild) return;

		const changes: Array<{ name: string; value: string; inline?: boolean }> = [];

		// Nickname change
		if (oldMember.nickname !== newMember.nickname) {
			changes.push({
				name: 'Nickname',
				value: `${oldMember.nickname || 'None'} → ${newMember.nickname || 'None'}`,
				inline: true
			});
		}

		// Role changes
		const oldRoles = oldMember.roles?.cache || new Map();
		const newRoles = newMember.roles.cache;

		const addedRoles = newRoles.filter((role) => !oldRoles.has(role.id) && role.id !== newMember.guild.id);
		const removedRoles = oldRoles.filter((role) => !newRoles.has(role.id) && role.id !== newMember.guild.id);

		if (addedRoles.size > 0) {
			changes.push({
				name: 'Roles Added',
				value: truncateString(addedRoles.map((r) => r.name).join(', ')),
				inline: true
			});

			// Track rank roles added
			await this.trackAddedRanks(newMember, addedRoles);
		}

		if (removedRoles.size > 0) {
			changes.push({
				name: 'Roles Removed',
				value: truncateString(removedRoles.map((r) => r.name).join(', ')),
				inline: true
			});

			// Track rank roles removed
			await this.trackRemovedRanks(newMember, removedRoles);
		}

		// Timeout change
		if (oldMember.communicationDisabledUntilTimestamp !== newMember.communicationDisabledUntilTimestamp) {
			if (newMember.communicationDisabledUntil) {
				changes.push({
					name: 'Timed Out Until',
					value: `<t:${Math.floor(newMember.communicationDisabledUntil.getTime() / 1000)}:F>`,
					inline: true
				});
			} else if (oldMember.communicationDisabledUntil) {
				changes.push({
					name: 'Timeout',
					value: 'Removed',
					inline: true
				});
			}
		}

		// Avatar change
		if (oldMember.avatar !== newMember.avatar) {
			changes.push({
				name: 'Server Avatar',
				value: newMember.avatar ? 'Updated' : 'Removed',
				inline: true
			});
		}

		if (changes.length === 0) return;

		await sendAuditLog({
			guild: newMember.guild,
			eventType: 'MEMBER_UPDATE',
			title: 'Member Updated',
			description: `${newMember.user.tag}'s profile was updated.`,
			fields: [
				{ name: 'User', value: `${newMember} (${newMember.user.tag})`, inline: true },
				{ name: 'ID', value: newMember.id, inline: true },
				...changes
			],
			thumbnail: newMember.displayAvatarURL(),
			footer: `User ID: ${newMember.id}`
		});
	}

	private isRankRole(role: Role, guild: GuildMember['guild']): boolean {
		const upperThreshold = guild.roles.cache.get(RANK_UPPER_THRESHOLD_ROLE_ID);
		const lowerThreshold = guild.roles.cache.get(RANK_LOWER_THRESHOLD_ROLE_ID);
		if (!upperThreshold || !lowerThreshold) return false;

		// Role must be between upper and lower thresholds
		return role.position < upperThreshold.position && role.position > lowerThreshold.position && role.id !== guild.id;
	}

	private async trackAddedRanks(member: GuildMember, addedRoles: Collection<string, Role>): Promise<void> {
		try {
			for (const [roleId, role] of addedRoles) {
				if (!this.isRankRole(role, member.guild)) continue;

				let user = await User.findOne({ where: { userId: member.user.id } });
				if (!user) {
					user = new User();
					user.userId = member.user.id;
					user.username = member.user.username;
					user.callsign = member.user.username;
					await user.save();
				}

				const rankHistory = new UserRankHistory();
				rankHistory.user = user;
				rankHistory.roleId = roleId;
				rankHistory.roleName = role.name;
				rankHistory.receivedAt = new Date();
				rankHistory.isActive = true;
				await rankHistory.save();

				console.log(`Rank added: ${member.user.username} received ${role.name}`);
			}
		} catch (error) {
			console.error(`Error tracking added ranks for ${member.user.username}:`, error);
		}
	}

	private async trackRemovedRanks(member: GuildMember, removedRoles: Collection<string, Role>): Promise<void> {
		try {
			for (const [roleId, role] of removedRoles) {
				if (!this.isRankRole(role, member.guild)) continue;

				const activeRecord = await UserRankHistory.findOne({
					where: {
						user: { userId: member.user.id },
						roleId: roleId,
						isActive: true
					},
					order: { receivedAt: 'DESC' }
				});

				if (activeRecord) {
					activeRecord.removedAt = new Date();
					activeRecord.isActive = false;
					await activeRecord.save();

					console.log(`Rank removed: ${member.user.username} lost ${role.name}`);
				}
			}
		} catch (error) {
			console.error(`Error tracking removed ranks for ${member.user.username}:`, error);
		}
	}
}
