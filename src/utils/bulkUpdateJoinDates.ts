import { client } from "../index";
import { database } from "../database";
import User from "../database/entities/User";
import { UserActivity } from "../database/entities/UserActivity";

/**
 * Bulk update join dates for all existing members in the guild
 * This should be run once to populate the database with existing member data
 */
export const bulkUpdateJoinDates = async (guildId: string = '1253817742054654075') => {
    console.log('Starting bulk update of join dates...');
    
    // Initialize database if not connected
    if (!database.isInitialized) {
        await database.initialize();
    }

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
        console.error(`Guild with ID ${guildId} not found`);
        return;
    }

    const members = await guild.members.fetch();
    let updated = 0;
    let created = 0;
    let errors = 0;

    console.log(`Found ${members.size} members to process...`);

    for (const [, member] of members) {
        if (member.user.bot) continue;

        try {
            let user = await User.findOne({ 
                where: { userId: member.user.id },
                relations: ['activity']
            });

            if (!user) {
                // Create new user
                user = new User();
                user.userId = member.user.id;
                user.username = member.user.username;
                user.callsign = member.user.username;
                await user.save();

                // Create user activity record with join date
                const userActivity = new UserActivity();
                userActivity.user = user;
                userActivity.lastActive = new Date();
                userActivity.joinedServer = member.joinedAt || new Date();
                await userActivity.save();
                
                created++;
                console.log(`Created user record for ${member.user.username}`);
            } else if (!user.activity) {
                // User exists but no activity record
                const userActivity = new UserActivity();
                userActivity.user = user;
                userActivity.lastActive = new Date();
                userActivity.joinedServer = member.joinedAt || new Date();
                await userActivity.save();
                
                updated++;
                console.log(`Created activity record for ${member.user.username}`);
            } else if (!user.activity.joinedServer && member.joinedAt) {
                // Update existing activity record with join date
                user.activity.joinedServer = member.joinedAt;
                await user.activity.save();
                
                updated++;
                console.log(`Updated join date for ${member.user.username}`);
            }
        } catch (error) {
            console.error(`Error processing ${member.user.username}:`, error);
            errors++;
        }
    }

    console.log(`Bulk update completed!`);
    console.log(`- Created: ${created} new user records`);
    console.log(`- Updated: ${updated} existing records`);
    console.log(`- Errors: ${errors}`);
    
    return { created, updated, errors };
};
