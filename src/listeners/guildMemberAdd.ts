import { Listener } from '@sapphire/framework';
import { ChannelType, Colors, EmbedBuilder, GuildMember, TextChannel } from 'discord.js';
import { database } from '../database';
import User from '../database/entities/User';
import { UserActivity } from '../database/entities/UserActivity';
import { trackRankChanges } from '../utils/rankTracking';

export class Joinevent extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'guildMemberAdd'
		});
	}

	public async run(member: GuildMember): Promise<void> {
		// Initialize database if not connected
		if (!database.isInitialized) {
			await database.initialize();
		}

		// Save user join date to database
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
			} else if (!user.activity) {
				// User exists but no activity record
				const userActivity = new UserActivity();
				userActivity.user = user;
				userActivity.lastActive = new Date();
				userActivity.joinedServer = member.joinedAt || new Date();
				await userActivity.save();
			} else if (!user.activity.joinedServer) {
				// Update existing activity record with join date
				user.activity.joinedServer = member.joinedAt || new Date();
				await user.activity.save();
			}
		} catch (error) {
			console.error('Error saving user join data to database:', error);
		}

		// Track initial ranks for the new member
		await trackRankChanges(member);

		let welcomeChannel = member.guild.channels.cache.find((channel) => channel.type === ChannelType.GuildText && channel.name === 'welcome') as
			| TextChannel
			| undefined;
		const logChannel = member.guild.channels.cache.find((channel) => channel.type === ChannelType.GuildText && channel.name === 'logs') as
			| TextChannel
			| undefined;

		if (!welcomeChannel) {
			if (logChannel) {
				await logChannel.send('welcome channel was not found, creating one now.');
			}

			const createdChannel = await member.guild.channels.create({
				name: 'welcome',
				type: ChannelType.GuildText,
				parent: '1333202423619260417',
				permissionOverwrites: [
					{
						id: member.guild.roles.everyone.id,
						deny: ['SendMessages']
					}
				]
			});

			if (createdChannel.type === ChannelType.GuildText) {
				welcomeChannel = createdChannel;
			}
		}

		const welcomeEmbed = new EmbedBuilder()
			.setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
			.setColor(Colors.Blurple)
			.setDescription(`Welcome to ${member.guild.name}, ${member}!`);
		if (!welcomeChannel) {
			this.container.logger.warn(`Unable to send welcome message for ${member.user.tag}: welcome channel unavailable.`);
			return;
		}

		await welcomeChannel.send({ embeds: [welcomeEmbed] });

		const roleIdsToAdd = [
			'1329257834734555226',
			'1100345563876163705',
			'1100348729497751552',
			'1021665141164626001',
			'1100346569477345390',
			'1100346772854931537',
			'1100346987091603467',
			'1131329124338761919'
		];

		try {
			await member.roles.add(roleIdsToAdd);
			this.container.logger.info(`Added ${roleIdsToAdd.length} roles to new member ${member.user.tag}`);
		} catch (error) {
			this.container.logger.error(`Failed to add roles to ${member.user.tag}:`, error);
		}
	}
}
