import {
    CategoryChannel,
    TextChannel,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    EmbedBuilder,
    ComponentType,
} from "discord.js";
import { client } from "../index";
import { excludedRoleIds } from "./excludeRoleIds";
import { database } from "../database";
import User from "../database/entities/User";
import { UserActivity } from "../database/entities/UserActivity";

const staffRoleId = "1277312995558690935"; // Replace with actual staff role ID
const devNotifyChannelId = "1328502110253482105"; // Channel ID for dev-notify

export const CheckActivity = async () => {
    const guild = client.guilds.cache.get('1253817742054654075');
    if (!guild) return console.log("Couldn't find guild with ID: " + '1253817742054654075');

    const members = await guild.members.fetch();
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const excludedRoles = await excludedRoleIds();

    // Initialize database connection if not already connected
    if (!database.isInitialized) {
        await database.initialize();
    }

    for (const member of Array.from(members.values())) {
        if (member.user.bot) continue;

        const hasExcludedRole = member.roles.cache.some((role) => excludedRoles.includes(role.id));
        if (hasExcludedRole) continue;

        // Check if user exists in database, if not create them
        let user = await User.findOne({ 
            where: { userId: member.user.id },
            relations: ['activity']
        });

        if (!user) {
            // Create new user
            user = new User();
            user.userId = member.user.id;
            user.username = member.user.username;
            user.callsign = member.user.username; // You might want to set this differently
            await user.save();

            // Create user activity record
            const userActivity = new UserActivity();
            userActivity.user = user;
            userActivity.lastActive = new Date();
            userActivity.joinedServer = member.joinedAt || new Date();
            await userActivity.save();
        } else if (!user.activity) {
            // User exists but no activity record
            const userActivity = new UserActivity();
            userActivity.user = user;
            userActivity.lastActive = new Date();
            userActivity.joinedServer = member.joinedAt || new Date();
            await userActivity.save();
        } else if (!user.activity.joinedServer && member.joinedAt) {
            // Update existing activity record with join date if missing
            user.activity.joinedServer = member.joinedAt;
            await user.activity.save();
        }

        let lastMessageTimestamp = 0;

        for (const channel of Array.from(guild.channels.cache.values())) {
            if (channel.isTextBased() && !(channel instanceof CategoryChannel)) {
                const textChannel = channel as TextChannel;
                try {
                    const messages = await textChannel.messages.fetch({ limit: 10 });
                    const userMessage = messages.find((msg) => msg.author.id === member.user.id);
                    if (userMessage) {
                        lastMessageTimestamp = Math.max(lastMessageTimestamp, userMessage.createdTimestamp);
                    }
                } catch (error) {
                    console.error(`Failed to fetch messages from ${textChannel.name}:`, error);
                }
            }
        }

        const lastVoiceActivity = member.voice.channelId ? Date.now() : 0;
        const lastActivity = Math.max(lastMessageTimestamp, lastVoiceActivity);

        // Update last activity in database if there was recent activity
        if (lastActivity > 0 && user && user.activity) {
            user.activity.lastActive = new Date(lastActivity);
            await user.activity.save();
        }

        if (lastActivity === 0 || lastActivity < twoWeeksAgo) {
            try {
                await member.send("You've been inactive for 2 weeks. Please be more active or you will be kicked.");
            } catch (err) {
                console.error(`Failed to send DM to ${member.user.tag}:`, err);

                const devNotifyChannel = await client.channels.fetch(devNotifyChannelId) as TextChannel;
                if (!devNotifyChannel || !devNotifyChannel.isTextBased()) {
                    console.error(`Dev-notify channel not found.`);
                    continue;
                }

                const embed = new EmbedBuilder()
                    .setTitle("Inactive Member Alert")
                    .setDescription(
                        `👤 **User:** ${member.user.tag} (${member.id})\n` +
                        `⏳ **Last Activity:** ${lastActivity === 0 ? "No activity detected" : `<t:${Math.floor(lastActivity / 1000)}:R>`}\n\n` +
                        `🔍 **Should this user be kicked for inactivity?**`
                    )
                    .setColor("Red")
                    .setThumbnail(member.user.displayAvatarURL())
                    .setTimestamp()
                    .setFooter({ text: "Staff Decision Required" });

                // Create buttons
                const yesButton = new ButtonBuilder()
                    .setCustomId(`kick_${member.id}`)
                    .setLabel("✅ Yes, Kick")
                    .setStyle(ButtonStyle.Danger);

                const noButton = new ButtonBuilder()
                    .setCustomId(`no_kick_${member.id}`)
                    .setLabel("❌ No, Keep")
                    .setStyle(ButtonStyle.Success);

                const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(yesButton, noButton);

                const message = await devNotifyChannel.send({
                    content: `🔔 <@&${staffRoleId}> **Staff Decision Needed**`,
                    embeds: [embed],
                    components: [actionRow],
                });

                const collector = message.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: 60 * 1000, 
                });

                collector.on("collect", async (interaction) => {
                    if (!interaction.member || !("roles" in interaction.member)) return;
                    if (!(interaction.member.roles as any).cache.has(staffRoleId)) {
                        return interaction.reply({ content: "❌ You are not authorized to make this decision!", ephemeral: true });
                    }

                    if (interaction.customId === `kick_${member.id}`) {
                        try {
                            await member.kick("Inactive for over 2 weeks (Approved by staff)");
                            await interaction.update({
                                content: `✅ **User ${member.user.tag} was kicked for inactivity.**`,
                                components: [],
                            });
                        } catch (err) {
                            console.error(`Failed to kick ${member.user.tag}:`, err);
                            return await interaction.reply({ content: "❌ Failed to kick the user.", ephemeral: true });
                        }
                    } else if (interaction.customId === `no_kick_${member.id}`) {
                        return await interaction.update({
                            content: `❌ **User ${member.user.tag} will NOT be kicked.**`,
                            components: [],
                        });
                    }
                    
                    // Handle any unexpected customId
                    return await interaction.reply({ content: "❌ Invalid button interaction.", ephemeral: true });
                });

                return collector.on("end", async (collected) => {
                    if (collected.size === 0) {
                        await message.edit({
                            content: "⌛ **No decision was made. The user will NOT be kicked.**",
                            components: [],
                        });
                        console.log(`No decision made for ${member.user.tag}.`);
                    }
                });

            }
        }
    }
};
