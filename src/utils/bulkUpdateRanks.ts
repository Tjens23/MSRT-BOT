import { client } from "../index";
import { trackRankChanges } from "./rankTracking";

/**
 * Bulk update rank data for all existing members in the guild
 * This should be run once to populate the database with existing member rank data
 */
export const bulkUpdateRanks = async (guildId: string = '1253817742054654075') => {
    console.log('Starting bulk update of member ranks...');
    
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
        console.error(`Guild with ID ${guildId} not found`);
        return;
    }

    const members = await guild.members.fetch();
    let processed = 0;
    let errors = 0;

    console.log(`Found ${members.size} members to process...`);

    for (const [, member] of members) {
        if (member.user.bot) continue;

        try {
            // Track initial ranks for each member
            await trackRankChanges(member);
            processed++;
            
            if (processed % 10 === 0) {
                console.log(`Processed ${processed} members...`);
            }
        } catch (error) {
            console.error(`Error processing ${member.user.username}:`, error);
            errors++;
        }

        // Add a small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Bulk rank update completed!`);
    console.log(`- Processed: ${processed} members`);
    console.log(`- Errors: ${errors}`);
    
    return { processed, errors };
};
