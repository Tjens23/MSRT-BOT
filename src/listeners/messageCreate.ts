import { Listener } from '@sapphire/framework';
import { Message } from 'discord.js';
import { differenceInDays } from 'date-fns';
import { UserActivity } from '../database/entities/UserActivity';

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
        const userId = message.author.id;
        const now = new Date();
        let userActivity = await UserActivity.findOne({ where: { user: message.author } });
        if (!userActivity) {
            userActivity = UserActivity.create({ user: message.author, lastActive: now });
        } else {
            userActivity.lastActive = now;
        }
        await userActivity.save();

        const daysInactive = differenceInDays(now, userActivity.lastActive);

        switch (daysInactive) {
            case 14:
                await message.author.send('You have been inactive for 2 weeks. Please be more active.');
                break;
            case 30:
                await message.author.send('You have been inactive for 1 month. You will be kicked from the server.').catch((error: Error) => console.error(error));
                const member = message.guild?.members.cache.get(userId);
                if(!member) return;
                await UserActivity.delete({ user: message.author }).catch((err: Error) => console.error(err));
                await member.kick('Discharged due to inactivity.');
                break;
        }
    }
}