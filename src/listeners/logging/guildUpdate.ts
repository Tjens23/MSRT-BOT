import { Listener } from '@sapphire/framework';
import { Guild } from 'discord.js';
import { sendAuditLog, truncateString } from '../../utils/auditLogger';

export class GuildUpdateListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'guildUpdate'
		});
	}

	public async run(oldGuild: Guild, newGuild: Guild): Promise<void> {
		const changes: Array<{ name: string; value: string; inline?: boolean }> = [];

		if (oldGuild.name !== newGuild.name) {
			changes.push({ name: 'Name', value: `${oldGuild.name} → ${newGuild.name}`, inline: true });
		}

		if (oldGuild.icon !== newGuild.icon) {
			changes.push({ name: 'Icon', value: 'Updated', inline: true });
		}

		if (oldGuild.banner !== newGuild.banner) {
			changes.push({ name: 'Banner', value: newGuild.banner ? 'Updated' : 'Removed', inline: true });
		}

		if (oldGuild.description !== newGuild.description) {
			changes.push({
				name: 'Description',
				value: truncateString(`${oldGuild.description || 'None'} → ${newGuild.description || 'None'}`),
				inline: false
			});
		}

		if (oldGuild.verificationLevel !== newGuild.verificationLevel) {
			changes.push({
				name: 'Verification Level',
				value: `${oldGuild.verificationLevel} → ${newGuild.verificationLevel}`,
				inline: true
			});
		}

		if (oldGuild.explicitContentFilter !== newGuild.explicitContentFilter) {
			changes.push({
				name: 'Explicit Content Filter',
				value: `${oldGuild.explicitContentFilter} → ${newGuild.explicitContentFilter}`,
				inline: true
			});
		}

		if (oldGuild.afkChannelId !== newGuild.afkChannelId) {
			changes.push({
				name: 'AFK Channel',
				value: `${oldGuild.afkChannel?.name || 'None'} → ${newGuild.afkChannel?.name || 'None'}`,
				inline: true
			});
		}

		if (oldGuild.afkTimeout !== newGuild.afkTimeout) {
			changes.push({
				name: 'AFK Timeout',
				value: `${oldGuild.afkTimeout / 60}min → ${newGuild.afkTimeout / 60}min`,
				inline: true
			});
		}

		if (oldGuild.systemChannelId !== newGuild.systemChannelId) {
			changes.push({
				name: 'System Channel',
				value: `${oldGuild.systemChannel?.name || 'None'} → ${newGuild.systemChannel?.name || 'None'}`,
				inline: true
			});
		}

		if (oldGuild.ownerId !== newGuild.ownerId) {
			changes.push({
				name: 'Owner',
				value: `<@${oldGuild.ownerId}> → <@${newGuild.ownerId}>`,
				inline: true
			});
		}

		if (changes.length === 0) return;

		await sendAuditLog({
			guild: newGuild,
			eventType: 'GUILD_UPDATE',
			title: 'Server Updated',
			fields: changes,
			thumbnail: newGuild.iconURL() || undefined,
			footer: `Guild ID: ${newGuild.id}`
		});
	}
}
