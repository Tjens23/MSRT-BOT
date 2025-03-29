import { Listener } from '@sapphire/framework';
import { Message } from 'discord.js';

export class MessageCreateEvent extends Listener {
    public constructor(context: Listener.LoaderContext, options: Listener.Options) {
        super(context, {
            ...options,
            event: 'messageCreate'
        });
    }

    public async run(message: Message): Promise<void> {
        if (message.author.bot) return;
        const roleId = [
            "",
            "",
        ]

        if(message.member?.roles.cache.some(role => roleId.includes(role.id))) return;
   }
}