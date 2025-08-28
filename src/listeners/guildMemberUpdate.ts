import { Listener } from '@sapphire/framework';
import { GuildMember } from 'discord.js';
import { trackRankChanges } from '../utils/rankTracking';

export class GuildMemberUpdateListener extends Listener {
    public constructor(context: Listener.LoaderContext, options: Listener.Options) {
        super(context, {
            ...options,
            event: 'guildMemberUpdate'
        });
    }

    public async run(oldMember: GuildMember, newMember: GuildMember): Promise<void> {
        // Only track if roles have changed
        if (oldMember.roles.cache.size !== newMember.roles.cache.size ||
            !oldMember.roles.cache.every(role => newMember.roles.cache.has(role.id))) {
            
            const oldRoles = Array.from(oldMember.roles.cache.values());
            const newRoles = Array.from(newMember.roles.cache.values());
            
            await trackRankChanges(newMember, oldRoles, newRoles);
        }
    }
}
