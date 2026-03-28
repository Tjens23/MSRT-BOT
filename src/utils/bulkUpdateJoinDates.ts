import { client } from "../index";
import { database, initializeDatabase } from "../database";
import User from "../database/entities/User";
import { UserActivity } from "../database/entities/UserActivity";

/**
 * Extract callsign from nickname format: "Callsign | Rank | Paygrade"
 * Falls back to username if nickname is not set
 */
function extractCallsign(nickname: string | null, username: string): string {
    if (!nickname) return username;
    const callsign = nickname.split('|')[0].trim();
    return callsign || username;
}

/**
 * Ensure callsign is unique by appending a counter if it already exists
 */
async function ensureUniqueCallsign(baseCallsign: string): Promise<string> {
    let callsign = baseCallsign;
    let counter = 2;
    
    while (await User.findOne({ where: { callsign } })) {
        callsign = `${baseCallsign}#${counter}`;
        counter++;
    }
    
    return callsign;
}

/**
 * Bulk update join dates for all existing members in the guild
 * This should be run once to populate the database with existing member data
 */
export const bulkUpdateJoinDates = async (guildId: string) => {
    console.log('Starting bulk update of join dates...');
    
    // Initialize database if not connected
    if (!database.isInitialized) {
        await initializeDatabase();
    }

    const guild = client.guilds.cache.get(guildId) ?? await client.guilds.fetch(guildId).catch(() => null);
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

        const baseCallsign = extractCallsign(member.nickname, member.user.username);
        if (baseCallsign === 'Guest' || baseCallsign === 'Reserve') {
            continue;
        }

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
                user.callsign = await ensureUniqueCallsign(baseCallsign);
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
