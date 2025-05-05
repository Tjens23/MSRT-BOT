import { Guild } from 'discord.js';
import User from '../database/entities/User';
import UserPromotion from '../database/entities/UserPromotion';

export const checkPromotion = async (guild: Guild | undefined) => {
    if (!guild) return;

    const users = await User.find();
    const now = new Date();

    for (const user of users) {
        const timeInRank = now.getTime() - new Date(user.promotionTimestamp).getTime();
        let eligibleForPromotion = false;
        let newRank = user.rank;

        switch (user.rank) {
            case 'Private':
                if (timeInRank >= 2 * 7 * 24 * 60 * 60 * 1000) { // 2 weeks
                    eligibleForPromotion = true;
                    newRank = 'Private First Class';
                }
                break;
            case 'Private First Class':
                if (timeInRank >= 4 * 7 * 24 * 60 * 60 * 1000) { // 4 weeks
                    eligibleForPromotion = true;
                    newRank = 'Lance Corporal';
                }
                break;
            case 'Lance Corporal':
                if (timeInRank >= 6 * 7 * 24 * 60 * 60 * 1000) { // 6 weeks
                    eligibleForPromotion = true;
                    newRank = 'Corporal';
                }
                break;
            // Add more cases for higher ranks if needed
        }

        if (eligibleForPromotion) {
            user.rank = newRank;
            user.promotionTimestamp = now;
            await user.save();

            const promotion = new UserPromotion();
            promotion.user = user;
            promotion.rank = newRank;
            promotion.timestamp = now;
            await promotion.save();

            const member = await guild.members.fetch(user.userId);
            if (member) {
                await member.send(`Congratulations! You have been promoted to ${newRank}.`);
            }
        }
    }
};
