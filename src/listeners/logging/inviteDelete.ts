import { Listener } from '@sapphire/framework';
import { Guild, Invite } from 'discord.js';
import { sendAuditLog } from '../../utils/auditLogger';

export class InviteDeleteListener extends Listener {
    public constructor(context: Listener.LoaderContext, options: Listener.Options) {
        super(context, {
            ...options,
            event: 'inviteDelete'
        });
    }

    public async run(invite: Invite): Promise<void> {
        if (!invite.guild) return;

        const guild = invite.guild instanceof Guild ? invite.guild : await this.container.client.guilds.fetch(invite.guild.id).catch(() => null);

        if (!guild) return;

        await sendAuditLog({
            guild,
            eventType: 'INVITE_DELETE',
            title: 'Invite Deleted',
            fields: [
                { name: 'Code', value: invite.code, inline: true },
                { name: 'Channel', value: invite.channel?.name || 'Unknown', inline: true },
                { name: 'Uses', value: invite.uses?.toString() || 'Unknown', inline: true }
            ],
            footer: `Invite Code: ${invite.code}`
        });
    }
}