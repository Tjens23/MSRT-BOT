import { Listener } from '@sapphire/framework';
import { Invite } from 'discord.js';
import { sendAuditLog } from '../../utils/auditLogger';

export class InviteCreateListener extends Listener {
    public constructor(context: Listener.LoaderContext, options: Listener.Options) {
        super(context, {
            ...options,
            event: 'inviteCreate'
        });
    }

    public async run(invite: Invite): Promise<void> {
        if (!invite.guild) return;

        const guild = invite.client.guilds.cache.get(invite.guild.id) ?? (await invite.client.guilds.fetch(invite.guild.id).catch(() => null));
        if (!guild) return;

        const expiresAt = invite.expiresAt ? `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:R>` : 'Never';

        await sendAuditLog({
            guild,
            eventType: 'INVITE_CREATE',
            title: 'Invite Created',
            fields: [
                { name: 'Code', value: invite.code, inline: true },
                { name: 'Channel', value: invite.channel?.name || 'Unknown', inline: true },
                { name: 'Created By', value: invite.inviter?.tag || 'Unknown', inline: true },
                { name: 'Max Uses', value: invite.maxUses?.toString() || 'Unlimited', inline: true },
                { name: 'Expires', value: expiresAt, inline: true },
                { name: 'Temporary', value: invite.temporary ? 'Yes' : 'No', inline: true }
            ],
            footer: `Invite Code: ${invite.code}`
        });
    }
}
