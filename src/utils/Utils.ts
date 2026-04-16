import {
	ButtonInteraction,
	ChannelType,
	PermissionFlagsBits,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
	ModalSubmitInteraction,
	EmbedBuilder,
	ButtonStyle,
	ButtonBuilder,
	TextChannel
} from 'discord.js';
import User from '../database/entities/User';
import Ticket from '../database/entities/Ticket';
import EnlistmentTicket from '../database/entities/EnlistmentTicket';
import SupportTicket from '../database/entities/SupportTicket';
import HRTicket from '../database/entities/HRTicket';
import LOATicket from '../database/entities/LOATicket';
import { TicketTypes } from './enums/TicketTypes';
import { UserRankHistory } from '../database/entities/UserRankHistory';
import { database } from '../database';

export interface UserServerTime {
	userId: string;
	username: string;
	joinedDate: Date | null;
	timeInServer: {
		total: number;
		days: number;
		formatted: string;
	} | null;
}

export const trimArray = (arr: any, maxLen = 10) => {
	if (arr.length > maxLen) {
		const len = arr.length - maxLen;
		arr = arr.slice(0, maxLen);
		arr.push(`${len} more...`);
	}
	return arr;
};

export function removeDuplicates<T extends Array<T>>(arr: T) {
	return Array.from(new Set(arr));
}

export const capitalise = (string: any) => {
	if (!string || typeof string !== 'string') {
		return ''; // Return an empty string if input is null, undefined, or not a string
	}
	return string
		.split(' ')
		.map((str: any) => str.slice(0, 1).toUpperCase() + str.slice(1))
		.join(' ');
};

const TICKET_TYPE_MAP = {
	ticket_enlistment: TicketTypes.ENLISTMENT,
	ticket_staff: TicketTypes.STAFF,
	ticket_support: TicketTypes.SUPPORT,
	ticket_loa: TicketTypes.LOA,
	ticket_hr: TicketTypes.HR
} as const;

/**
 * Get the parent category ID for a ticket type
 * @param ticketType - The type of ticket
 * @returns The parent category ID from environment variables
 */
function getTicketParentId(ticketType: TicketTypes): string | undefined {
	switch (ticketType) {
		case TicketTypes.ENLISTMENT:
			return process.env.ENLISTMENT_PARENT_ID;
		case TicketTypes.SUPPORT:
			return process.env.SUPPORT_PARENT_ID;
		case TicketTypes.LOA:
			return process.env.LOA_PARENT_ID;
		case TicketTypes.HR:
			return process.env.HR_PARENT_ID;
		case TicketTypes.STAFF:
			return process.env.STAFF_PARENT_ID;
		default:
			return undefined;
	}
}

export async function handleButton(interaction: ButtonInteraction) {
	const typeKey = interaction.customId;
	const ticketType = TICKET_TYPE_MAP[typeKey as keyof typeof TICKET_TYPE_MAP] as TicketTypes | undefined;

	if (ticketType === undefined) {
		return interaction.reply({ content: 'Invalid ticket type.', ephemeral: true });
	}

	if (!interaction.guild) {
		return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
	}

	// Handle different ticket types with modals
	switch (ticketType) {
		case TicketTypes.ENLISTMENT: {
			const modal = new ModalBuilder().setCustomId('enlistment_modal').setTitle('MSRT Enlistment Application');

			// Callsign input
			const callsignInput = new TextInputBuilder()
				.setCustomId('callsign')
				.setLabel('What would be your callsign?')
				.setStyle(TextInputStyle.Short)
				.setRequired(true)
				.setMaxLength(50);

			// Age input
			const ageInput = new TextInputBuilder()
				.setCustomId('age')
				.setLabel('How old are you?')
				.setStyle(TextInputStyle.Short)
				.setRequired(true)
				.setMaxLength(3);

			// Timezone input
			const timezoneInput = new TextInputBuilder()
				.setCustomId('timezone')
				.setLabel('What timezone are you in?')
				.setStyle(TextInputStyle.Short)
				.setRequired(true)
				.setMaxLength(50)
				.setPlaceholder('e.g., EST, PST, GMT+1, etc.');

			// How they found MSRT
			const foundOutInput = new TextInputBuilder()
				.setCustomId('found_out')
				.setLabel('Where did you find out about MSRT?')
				.setStyle(TextInputStyle.Paragraph)
				.setRequired(true)
				.setMaxLength(500);

			// Game preference
			const gameInput = new TextInputBuilder()
				.setCustomId('game')
				.setLabel('"Ready or Not", "Phoenix" or "Ground Branch"?')
				.setStyle(TextInputStyle.Short)
				.setRequired(true)
				.setMaxLength(50);

			// Create action rows for each input
			const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(callsignInput);
			const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(ageInput);
			const thirdActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(timezoneInput);
			const fourthActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(foundOutInput);
			const fifthActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(gameInput);

			modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow, fifthActionRow);

			return await interaction.showModal(modal);
		}
		
		case TicketTypes.SUPPORT: {
			const modal = new ModalBuilder().setCustomId('support_modal').setTitle('MSRT Help Desk');

			const issue = new TextInputBuilder()
				.setCustomId('issue')
				.setLabel('What issue are you experiencing?')
				.setStyle(TextInputStyle.Paragraph)
				.setRequired(true)
				.setMaxLength(500);
			
			modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(issue));

			return await interaction.showModal(modal);

		}

		case TicketTypes.LOA: {
			const modal = new ModalBuilder().setCustomId('loa_modal').setTitle('MSRT Leave of Absence Request');

			// Start date input
			const startDateInput = new TextInputBuilder()
				.setCustomId('start_date')
				.setLabel('Start Date of LOA (YYYY-MM-DD)')
				.setStyle(TextInputStyle.Short)
				.setRequired(true)
				.setMaxLength(10)
				.setPlaceholder('e.g., 2025-09-22');

			// End date input
			const endDateInput = new TextInputBuilder()
				.setCustomId('end_date')
				.setLabel('End Date of LOA (YYYY-MM-DD)')
				.setStyle(TextInputStyle.Short)
				.setRequired(true)
				.setMaxLength(10)
				.setPlaceholder('e.g., 2025-09-30');

			// Reason input
			const reasonInput = new TextInputBuilder()
				.setCustomId('reason')
				.setLabel('Reason for Leave of Absence')
				.setStyle(TextInputStyle.Paragraph)
				.setRequired(true)
				.setMaxLength(500)
				.setPlaceholder('Please provide the reason for your LOA...');

			// Create action rows for each input
			const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(startDateInput);
			const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(endDateInput);
			const thirdActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput);

			modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

			return await interaction.showModal(modal);
		}

		default:
			// For other ticket types, proceed with original logic
			return await createTicketChannel(interaction, ticketType);
	}
}

export async function handleEnlistmentModal(interaction: ModalSubmitInteraction) {
	if (!interaction.guild) {
		return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
	}

	// Get the form data
	const callsign = interaction.fields.getTextInputValue('callsign');
	const age = interaction.fields.getTextInputValue('age');
	const timezone = interaction.fields.getTextInputValue('timezone');
	const foundOut = interaction.fields.getTextInputValue('found_out');
	const game = interaction.fields.getTextInputValue('game');

	// Create the ticket channel
	return await createTicketChannel(interaction, TicketTypes.ENLISTMENT, {
		callsign,
		age,
		timezone,
		foundOut,
		game
	});
}

export async function handleLOAModal(interaction: ModalSubmitInteraction) {
	if (!interaction.guild) {
		return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
	}

	// Get the form data
	const startDate = interaction.fields.getTextInputValue('start_date');
	const endDate = interaction.fields.getTextInputValue('end_date');
	const reason = interaction.fields.getTextInputValue('reason');

	// Create the ticket channel
	return await createTicketChannel(interaction, TicketTypes.LOA, {
		startDate,
		endDate,
		reason
	});
}

export async function handleSupportModal(interaction: ModalSubmitInteraction) {
    if (!interaction.guild) {
        return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }

    const issue = interaction.fields.getTextInputValue('issue');

    return await createTicketChannel(interaction, TicketTypes.SUPPORT, { issue });
}

async function createTicketChannel(
	interaction: ButtonInteraction | ModalSubmitInteraction,
	ticketType: TicketTypes,
	data?: {
		callsign?: string;
		age?: string;
		timezone?: string;
		foundOut?: string;
		game?: string;
		startDate?: string;
		endDate?: string;
		reason?: string;
		issue?: string;
	}
) {
	if (!interaction.guild) {
		if (!interaction.deferred && !interaction.replied) {
			return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
		} else {
			return interaction.editReply({ content: 'This command can only be used in a server.' });
		}
	}

	// Defer the reply immediately to prevent timeout
	if (!interaction.deferred && !interaction.replied) {
		await interaction.deferReply({ ephemeral: true });
	}

	// Define permission overwrites array
	const permissionOverwrites: any[] = [
		{
			id: interaction.guild.id,
			deny: [PermissionFlagsBits.ViewChannel]
		},
		{
			id: interaction.user.id,
			allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
		}
	];

	// Add bot permissions if bot role exists
	const botMember = interaction.guild.members.me;
	if (botMember) {
		permissionOverwrites.push({
			id: botMember.id,
			allow: [
				PermissionFlagsBits.ViewChannel,
				PermissionFlagsBits.SendMessages,
				PermissionFlagsBits.ReadMessageHistory,
				PermissionFlagsBits.ManageChannels
			]
		});
	}

	// Create private ticket channel
	let channel;
	try {
		const parentId = getTicketParentId(ticketType);
		channel = await interaction.guild.channels.create({
			name: `ticket-${interaction.user.username}`.toLowerCase(),
			type: ChannelType.GuildText,
			parent: parentId,
			permissionOverwrites
		});
	} catch (error: any) {
		console.error('Error creating ticket channel:', error);
		return interaction.editReply({ 
			content: `❌ Failed to create ticket channel. The bot may not have permission to create channels. Error: ${error.message}` 
		});
	}

	if (!channel) {
		return interaction.editReply({ content: 'Failed to create ticket channel.' });
	}

	// Find or create user
	let user = await User.findOne({
		where: { userId: interaction.user.id },
		relations: ['tickets']
	});

	if (!user) {
		user = User.create({
			userId: interaction.user.id,
			username: interaction.user.username,
			callsign: data?.callsign || interaction.user.username
		});
		await user.save();
		// Reload user to get fresh relations
		user = await User.findOne({
			where: { userId: interaction.user.id },
			relations: ['tickets']
		});
		
		if (!user) {
			console.error('Failed to create or reload user');
			return interaction.editReply({ content: '❌ Failed to create user. Please try again.' });
		}
	} else if (data?.callsign) {
		// Update callsign if provided in modal
		user.callsign = data.callsign;
		await user.save();
	}

	// Check if user already has an open ticket of the same type
	const existingTicket = user.tickets?.find((ticket) => ticket.ticketType === ticketType && !ticket.closed);

	if (existingTicket) {
		// Try to verify the ticket channel still exists by checking all guild channels
		let channelExists = false;
		try {
			const allChannels = await interaction.guild.channels.fetch();
			const usernameLower = interaction.user.username.toLowerCase();
			// Look for active (ticket-username) or closed (closed-username) channels
			const userChannels = allChannels.filter(
				(ch) => ch && ch.isTextBased() && 
				(ch.name === `ticket-${usernameLower}` || 
				 ch.name === `closed-${usernameLower}`)
			);
			channelExists = userChannels.size > 0;
			console.log(`Channel exists check for ${interaction.user.username}: ${channelExists}, Found ${userChannels.size} channels, ticket ID: ${existingTicket.id}`);
			userChannels.forEach(ch => {
				if (ch) console.log(`  - Found channel: ${ch.name}`);
			});
		} catch (error) {
			console.error('Error checking ticket channels:', error);
		}

		if (!channelExists) {
			// Channel doesn't exist, mark the ticket as closed
			console.log(`Channel for ticket ${existingTicket.id} not found, marking as closed in database`);
			existingTicket.closed = true;
			try {
				const result = await existingTicket.save();
				console.log(`Ticket ${existingTicket.id} closed successfully, closed value is now: ${result.closed}`);
				// Continue to create new ticket
			} catch (saveError) {
				console.error('Error closing ticket:', saveError);
				return interaction.editReply({ content: `❌ Error updating old ticket: ${saveError instanceof Error ? saveError.message : 'Unknown error'}` });
			}
		} else {
			// Channel exists, so it really is an open ticket
			const ticketTypeName = Object.keys(TicketTypes)[Object.values(TicketTypes).indexOf(ticketType)];
			console.log(`User ${interaction.user.username} already has an open ${ticketTypeName} ticket:`, existingTicket);
			return interaction.editReply({
				content: `❌ You already have an open ${ticketTypeName.toLowerCase()} ticket. Please close your existing ticket before creating a new one.`
			});
		}
	}

	// Create correct ticket subclass based on type
	let ticket: Ticket;

	switch (ticketType) {
		case TicketTypes.ENLISTMENT:
			const enlistment = new EnlistmentTicket();
			enlistment.user = user;
			enlistment.ticketType = TicketTypes.ENLISTMENT;
			enlistment.closed = false;
			enlistment.title = `Enlistment Ticket - ${data?.callsign || interaction.user.username}`;
			enlistment.description = data
				? `**Age:** ${data.age}\n**Timezone:** ${data.timezone}\n**Found MSRT through:** ${data.foundOut}\n**Game Preference:** ${data.game}`
				: 'New enlistment request';
			enlistment.timezone = data?.timezone || 'Unknown';
			enlistment.game = data?.game || 'Unknown';
			ticket = enlistment;
			break;

		case TicketTypes.LOA:
			const loaTicket = new LOATicket();
			loaTicket.user = user;
			loaTicket.ticketType = TicketTypes.LOA;
			loaTicket.closed = false;
			loaTicket.title = `LOA Ticket - ${interaction.user.username}`;
			loaTicket.description = data?.reason || 'New LOA request';

			// Parse and set dates from modal data
			if (data?.startDate) {
				try {
					loaTicket.startDate = new Date(data.startDate);
				} catch (error) {
					console.error('Error parsing start date:', error);
					loaTicket.startDate = new Date();
				}
			} else {
				loaTicket.startDate = new Date();
			}

			if (data?.endDate) {
				try {
					loaTicket.endDate = new Date(data.endDate);
				} catch (error) {
					console.error('Error parsing end date:', error);
					loaTicket.endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 1 week
				}
			} else {
				loaTicket.endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 1 week
			}

			loaTicket.reason = data?.reason || 'Unknown';
			ticket = loaTicket;
			break;

		case TicketTypes.SUPPORT:
			const supportTicket = new SupportTicket();
			supportTicket.user = user;
			supportTicket.ticketType = TicketTypes.SUPPORT;
			supportTicket.closed = false;
			supportTicket.title = `Support Ticket - ${interaction.user.username}`;
			supportTicket.description = data?.issue || 'New support request';
			supportTicket.issue = data?.issue || 'Unknown';
			ticket = supportTicket;
			break;

		case TicketTypes.HR:
			const hrTicket = new HRTicket();
			hrTicket.user = user;
			hrTicket.ticketType = TicketTypes.HR;
			hrTicket.closed = false;
			hrTicket.title = `HR Ticket - ${interaction.user.username}`;
			hrTicket.description = 'New HR request';
			hrTicket.reason = 'Unknown';
			ticket = hrTicket;
			break;

		case TicketTypes.STAFF:
			const staffTicket = new Ticket();
			staffTicket.user = user;
			staffTicket.ticketType = TicketTypes.STAFF;
			staffTicket.closed = false;
			staffTicket.title = `Staff Ticket - ${interaction.user.username}`;
			staffTicket.description = 'New staff request';
			ticket = staffTicket;
			break;

		default:
			const defaultTicket = new Ticket();
			defaultTicket.user = user;
			defaultTicket.ticketType = ticketType;
			defaultTicket.closed = false;
			defaultTicket.title = `Ticket - ${interaction.user.username}`;
			defaultTicket.description = 'New ticket request';
			ticket = defaultTicket;
	}

	try {
		await ticket.save();
		console.log('Ticket saved with ID:', ticket.id);
	} catch (error) {
		console.error('Error saving ticket:', error);
		console.error('Ticket object:', ticket);
		return interaction.editReply({ content: `❌ Failed to save ticket to database: ${error instanceof Error ? error.message : 'Unknown error'}` });
	}

	// Verify ticket ID exists before proceeding
	if (!ticket.id) {
		console.error('Ticket ID is undefined after save');
		return interaction.editReply({ content: '❌ Ticket ID is undefined. Please try again.' });
	}
	// Create and send embed with ticket information
	if (ticketType === TicketTypes.ENLISTMENT && data?.callsign && data?.age && data?.timezone && data?.foundOut && data?.game) {
		const transcriptButton = new ButtonBuilder()
			.setCustomId(`transcript_${ticket.id}`)
			.setLabel('📜 View Transcript')
			.setStyle(ButtonStyle.Primary);

		const CloseTicketButton = new ButtonBuilder().setCustomId(`close_${ticket.id}`).setLabel('🔒 Close Ticket').setStyle(ButtonStyle.Danger);

		const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(transcriptButton, CloseTicketButton);

		const enlistmentEmbed = new EmbedBuilder()
			.setColor('#00ff00')
			.setTitle('🪖 MSRT Enlistment Application')
			.setDescription(`Welcome to your enlistment ticket, **${data.callsign}**!`)
			.addFields(
				{ name: '👤 Callsign', value: data.callsign, inline: true },
				{ name: '🎂 Age', value: data.age, inline: true },
				{ name: '🌍 Timezone', value: data.timezone, inline: true },
				{ name: '🔍 Found MSRT through', value: data.foundOut, inline: false },
				{ name: '🎮 Game Preference', value: data.game, inline: true }
			)
			.setThumbnail(interaction.user.displayAvatarURL())
			.setTimestamp()
			.setFooter({
				text: `Ticket ID: ${ticket.id} | User ID: ${interaction.user.id}`,
				iconURL: interaction.guild?.iconURL() || undefined
			});

		await channel.send({
			content: `<@${interaction.user.id}> Your enlistment application has been submitted!`,
			embeds: [enlistmentEmbed],
			components: [actionRow]
		});

		// Send additional instructions
		await channel.send({
			content:
				`📝 **Next Steps:**\n` +
				`• Our staff will review your application\n` +
				`• Please be patient as we have staff across multiple timezones\n` +
				`• A staff member will be with you shortly\n` +
				`• Do not create additional tickets for the same purpose\n\n` +
				`Thank you for your interest in joining MSRT! 🎖️`
		});
	} else if (ticketType === TicketTypes.LOA && data?.reason && data?.startDate && data?.endDate) {
		// Create LOA-specific embed
		const transcriptButton = new ButtonBuilder()
			.setCustomId(`transcript_${ticket.id}`)
			.setLabel('📜 View Transcript')
			.setStyle(ButtonStyle.Primary);

		const closeTicketButton = new ButtonBuilder().setCustomId(`close_${ticket.id}`).setLabel('🔒 Close Ticket').setStyle(ButtonStyle.Danger);

		const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(transcriptButton, closeTicketButton);

		// Calculate duration with proper type checking
		const startDate = data.startDate;
		const endDate = data.endDate;
		const durationDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));

		const loaEmbed = new EmbedBuilder()
			.setColor('#ffa500')
			.setTitle('🏖️ MSRT Leave of Absence Request')
			.setDescription(`Your LOA request has been submitted, **${interaction.user.username}**!`)
			.addFields(
				{ name: '📅 Start Date', value: startDate, inline: true },
				{ name: '📅 End Date', value: endDate, inline: true },
				{ name: '⏱️ Duration', value: `${durationDays} days`, inline: true },
				{ name: '📝 Reason', value: data.reason, inline: false }
			)
			.setThumbnail(interaction.user.displayAvatarURL())
			.setTimestamp()
			.setFooter({
				text: `Ticket ID: ${ticket.id} | User ID: ${interaction.user.id}`,
				iconURL: interaction.guild?.iconURL() || undefined
			});

		await channel.send({
			content: `<@${interaction.user.id}> Your Leave of Absence request has been submitted!`,
			embeds: [loaEmbed],
			components: [actionRow]
		});

		// Send additional instructions for LOA
		await channel.send({
			content:
				`📋 **LOA Request Information:**\n` +
				`• Staff will review your request shortly\n` +
				`• Please ensure your dates are accurate\n` +
				`• You will be notified once your LOA is approved/denied\n` +
				`• Keep this channel open until your request is processed\n\n` +
				`**Note:** Your LOA will be effective from the approved start date. 📆`
		});
	} else if (ticketType === TicketTypes.SUPPORT && data?.issue) {
		// Create Support-specific embed
	   const transcriptButton = new ButtonBuilder()
        .setCustomId(`transcript_${ticket.id}`)
        .setLabel('📜 View Transcript')
        .setStyle(ButtonStyle.Primary);

    const closeTicketButton = new ButtonBuilder()
        .setCustomId(`close_${ticket.id}`)
        .setLabel('🔒 Close Ticket')
        .setStyle(ButtonStyle.Danger);

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(transcriptButton, closeTicketButton);

    const supportEmbed = new EmbedBuilder()
        .setColor('#ff6b6b')
        .setTitle('🛠️ MSRT Help Desk')
        .setDescription(`Your support ticket has been submitted, **${interaction.user.username}**!`)
        .addFields(
            { name: '🔧 Issue', value: data.issue, inline: false }
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp()
        .setFooter({
            text: `Ticket ID: ${ticket.id} | User ID: ${interaction.user.id}`,
            iconURL: interaction.guild?.iconURL() || undefined
        });

    await channel.send({
        content: `<@${interaction.user.id}> Your support ticket has been submitted!`,
        embeds: [supportEmbed],
        components: [actionRow]
    });

    await channel.send({
        content:
            `📋 **Support Ticket Information:**\n` +
            `• Staff will review your issue shortly\n` +
            `• Please provide any additional details if needed\n` +
            `• Do not create duplicate tickets for the same issue\n\n` +
            `**Note:** A staff member will be with you as soon as possible. 🛠️`
    });

	} else {
		// For other ticket types, send a simpler embed
		const transcriptButton = new ButtonBuilder()
			.setCustomId(`transcript_${ticket.id}`)
			.setLabel('📜 View Transcript')
			.setStyle(ButtonStyle.Primary);

		const closeTicketButton = new ButtonBuilder().setCustomId(`close_${ticket.id}`).setLabel('🔒 Close Ticket').setStyle(ButtonStyle.Danger);

		const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(transcriptButton, closeTicketButton);

		const ticketTypeName = Object.keys(TicketTypes)[Object.values(TicketTypes).indexOf(ticketType)];
		const ticketEmbed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle(`🎫 ${ticketTypeName} Ticket Created`)
			.setDescription(`Your ticket has been created successfully!`)
			.addFields(
				{ name: '👤 User', value: `<@${interaction.user.id}>`, inline: true },
				{ name: '📋 Type', value: ticketTypeName, inline: true },
				{ name: '📅 Created', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
			)
			.setThumbnail(interaction.user.displayAvatarURL())
			.setTimestamp()
			.setFooter({
				text: `Ticket ID: ${ticket.id}`,
				iconURL: interaction.guild?.iconURL() || undefined
			});

		await channel.send({
			content: `<@${interaction.user.id}> Your ticket has been created!`,
			embeds: [ticketEmbed],
			components: [actionRow]
		});
	}

	return await interaction.editReply({ content: `✅ Ticket created: <#${channel.id}>` });
}

/**
 * Get user's server join time and time spent in server
 * @param userId - Discord user ID
 * @returns Object containing join date and time in server
 */
export async function getUserServerTime(userId: string) {
	// Initialize database if not connected
	if (!database.isInitialized) {
		await database.initialize();
	}

	const user = await User.findOne({
		where: { userId },
		relations: ['activity']
	});

	if (!user || !user.activity || !user.activity.joinedServer) {
		return null;
	}

	const joinedDate = user.activity.joinedServer;
	const now = new Date();
	const timeInServer = now.getTime() - joinedDate.getTime();

	// Convert to readable format
	const days = Math.floor(timeInServer / (1000 * 60 * 60 * 24));
	const hours = Math.floor((timeInServer % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	const minutes = Math.floor((timeInServer % (1000 * 60 * 60)) / (1000 * 60));

	return {
		joinedDate,
		timeInServer: {
			total: timeInServer,
			days,
			hours,
			minutes,
			formatted: `${days} days, ${hours} hours, ${minutes} minutes`
		}
	};
}

/**
 * Get all users and their server time statistics
 * @returns Array of users with their server time data
 */
export async function getAllUsersServerTime(): Promise<UserServerTime[]> {
	// Initialize database if not connected
	if (!database.isInitialized) {
		await database.initialize();
	}

	const users = await User.find({
		relations: ['activity']
	});

	return users
		.map((user) => {
			if (!user.activity || !user.activity.joinedServer) {
				return {
					userId: user.userId,
					username: user.username,
					joinedDate: null,
					timeInServer: null
				};
			}

			const joinedDate = user.activity.joinedServer;
			const now = new Date();
			const timeInServer = now.getTime() - joinedDate.getTime();
			const days = Math.floor(timeInServer / (1000 * 60 * 60 * 24));

			return {
				userId: user.userId,
				username: user.username,
				joinedDate,
				timeInServer: {
					total: timeInServer,
					days,
					formatted: `${days} days`
				}
			};
		})
		.sort((a, b) => {
			if (!a.timeInServer || !b.timeInServer) return 0;
			return b.timeInServer.total - a.timeInServer.total; // Sort by most time in server
		});
}

/**
 * Get rank statistics for a specific role
 * @param roleId - The role ID to get statistics for
 * @returns Statistics about the rank
 */
export async function getRankStatistics(roleId: string) {
	// Initialize database if not connected
	if (!database.isInitialized) {
		await database.initialize();
	}

	const allRankRecords = await UserRankHistory.find({
		where: { roleId },
		relations: ['user']
	});

	const activeRecords = allRankRecords.filter((record) => record.isActive);
	const inactiveRecords = allRankRecords.filter((record) => !record.isActive);

	// Calculate average time in rank for those who left the rank
	let averageTimeInRank = 0;
	if (inactiveRecords.length > 0) {
		const totalTime = inactiveRecords.reduce((sum, record) => sum + record.getDurationInRole(), 0);
		averageTimeInRank = totalTime / inactiveRecords.length;
	}

	// Find longest serving current member
	let longestServing = null;
	if (activeRecords.length > 0) {
		longestServing = activeRecords.reduce((longest, current) => {
			return current.receivedAt < longest.receivedAt ? current : longest;
		});
	}

	return {
		totalEverHeld: allRankRecords.length,
		currentlyHolding: activeRecords.length,
		totalWhoLeft: inactiveRecords.length,
		averageTimeInRank: Math.floor(averageTimeInRank / (1000 * 60 * 60 * 24)), // days
		longestServing: longestServing
			? {
					user: longestServing.user,
					timeInRank: longestServing.getFormattedDuration(),
					since: longestServing.receivedAt
				}
			: null
	};
}

/**
 * Handle transcript button interaction
 * @param interaction - Button interaction
 */
export async function handleTranscriptButton(interaction: ButtonInteraction) {
	if (!interaction.guild || !interaction.channel) {
		return interaction.reply({ content: 'This command can only be used in a server channel.', ephemeral: true });
	}

	// Extract ticket ID from custom ID
	const customIdParts = interaction.customId.split('_');
	const ticketIdStr = customIdParts[1];
	const ticketId = parseInt(ticketIdStr);

	console.log('Transcript button pressed - customId:', interaction.customId, 'parts:', customIdParts, 'ticketIdStr:', ticketIdStr, 'ticketId:', ticketId);

	if (!ticketId || isNaN(ticketId)) {
		return interaction.reply({ content: 'Invalid ticket ID. Please contact an administrator.', ephemeral: true });
	}

	// Defer the reply to prevent timeout
	await interaction.deferReply({ ephemeral: true });

	try {
		// Find the ticket in database
		const ticket = await Ticket.findOne({
			where: { id: ticketId },
			relations: ['user']
		});

		if (!ticket) {
			return interaction.editReply({ content: 'Ticket not found.' });
		}

		// Generate a reliable text-based transcript (bypassing the problematic library)
		const channel = interaction.channel as TextChannel;

		// Fetch messages from the channel
		const messageCollection = await channel.messages.fetch({ limit: 100 });
		const messages = Array.from(messageCollection.values()).reverse(); // Oldest first

		let transcriptContent = `TICKET TRANSCRIPT\n`;
		transcriptContent += `=================\n`;
		transcriptContent += `Ticket ID: ${ticket.id}\n`;
		transcriptContent += `Ticket Type: ${ticket.ticketType}\n`;
		transcriptContent += `User: ${ticket.user.username} (${ticket.user.userId})\n`;
		transcriptContent += `Channel: #${channel.name}\n`;
		transcriptContent += `Generated: ${new Date().toISOString()}\n`;
		transcriptContent += `Total Messages: ${messages.length}\n`;
		transcriptContent += `=================\n\n`;

		for (const message of messages) {
			const timestamp = new Date(message.createdTimestamp).toLocaleString();
			const author = message.author.username;
			const authorId = message.author.id;
			const content = message.content || '[No text content]';

			// Add message header
			transcriptContent += `[${timestamp}] ${author} (${authorId})\n`;

			// Add message content
			if (content.trim()) {
				transcriptContent += `${content}\n`;
			}

			// Add embed information if present
			if (message.embeds.length > 0) {
				transcriptContent += `--- EMBEDS ---\n`;
				for (const embed of message.embeds) {
					if (embed.title) transcriptContent += `Title: ${embed.title}\n`;
					if (embed.description) transcriptContent += `Description: ${embed.description}\n`;
					if (embed.fields && embed.fields.length > 0) {
						embed.fields.forEach((field) => {
							transcriptContent += `${field.name}: ${field.value}\n`;
						});
					}
					if (embed.footer) transcriptContent += `Footer: ${embed.footer.text}\n`;
				}
				transcriptContent += `--- END EMBEDS ---\n`;
			}

			// Add attachment information if present
			if (message.attachments.size > 0) {
				transcriptContent += `--- ATTACHMENTS ---\n`;
				for (const attachment of message.attachments.values()) {
					transcriptContent += `📎 ${attachment.name} (${attachment.size} bytes)\n`;
					transcriptContent += `   URL: ${attachment.url}\n`;
				}
				transcriptContent += `--- END ATTACHMENTS ---\n`;
			}

			// Add reactions if present
			if (message.reactions.cache.size > 0) {
				transcriptContent += `--- REACTIONS ---\n`;
				for (const reaction of message.reactions.cache.values()) {
					transcriptContent += `${reaction.emoji.name || reaction.emoji.toString()}: ${reaction.count}\n`;
				}
				transcriptContent += `--- END REACTIONS ---\n`;
			}

			transcriptContent += `\n`; // Empty line between messages
		}

		transcriptContent += `\n=================\n`;
		transcriptContent += `End of Transcript\n`;
		transcriptContent += `Generated by MSRT Bot on ${new Date().toLocaleString()}\n`;

		// Get ticket type name for filename
		const ticketTypeName = Object.keys(TicketTypes)[Object.values(TicketTypes).indexOf(ticket.ticketType)].toLowerCase();

		// Get count of tickets of the same type for numbering
		const ticketCountOfType = await Ticket.count({
			where: { ticketType: ticket.ticketType }
		});

		// Create text file attachment with ticket type in filename
		const buffer = Buffer.from(transcriptContent, 'utf-8');
		const textAttachment = {
			attachment: buffer,
			name: `${ticketTypeName}-${ticketCountOfType}-transcript.txt`
		};

		// Get transcripts channel from environment variable
		const transcriptsChannelId = process.env.TRANSCRIPTS_CHANNEL_ID;
		if (!transcriptsChannelId) {
			return interaction.editReply({
				content: '❌ Transcripts channel ID is not configured in the environment variables.'
			});
		}

		// Fetch the transcripts channel
		let transcriptsChannel;
		try {
			transcriptsChannel = await interaction.guild.channels.fetch(transcriptsChannelId);
		} catch (error) {
			console.error('Error fetching transcripts channel:', error);
			return interaction.editReply({
				content: '❌ Failed to find the transcripts channel. Please check the TRANSCRIPTS_CHANNEL_ID configuration.'
			});
		}

		if (!transcriptsChannel || !transcriptsChannel.isTextBased()) {
			return interaction.editReply({
				content: '❌ The transcripts channel is not a valid text channel.'
			});
		}

		// Send transcript to the transcripts channel
		try {
			const transcriptMessage = await transcriptsChannel.send({
				content: `**Ticket Transcript - ${ticketTypeName.charAt(0).toUpperCase() + ticketTypeName.slice(1)} #${ticketCountOfType}**\n📋 Messages: ${messages.length}\n🎫 Ticket Type: ${ticket.ticketType}\n👤 User: ${ticket.user.username} (${ticket.user.userId})\n📅 Generated: ${new Date().toLocaleString()}`,
				files: [textAttachment]
			});

			// Notify user in ticket channel with link to transcript
			await interaction.editReply({
				content: `✅ Transcript generated and sent to <#${transcriptsChannelId}>!\n[View Transcript](${transcriptMessage.url})`
			});
		} catch (error) {
			console.error('Error sending transcript to channel:', error);
			return interaction.editReply({
				content: '❌ Failed to send transcript to the transcripts channel. Please try again or contact an administrator.'
			});
		}

		return; // Success path
	} catch (error) {
		console.error('Error generating transcript:', error);
		return interaction.editReply({
			content: 'An error occurred while generating the transcript. Please try again or contact an administrator.'
		});
	}
}

/**
 * Handle close ticket button interaction
 * @param interaction - Button interaction
 */
export async function handleCloseTicketButton(interaction: ButtonInteraction) {
	if (!interaction.guild || !interaction.channel) {
		return interaction.reply({ content: 'This command can only be used in a server channel.', ephemeral: true });
	}

	// Extract ticket ID from custom ID
	const ticketId = parseInt(interaction.customId.split('_')[1]);

	if (!ticketId) {
		return interaction.reply({ content: 'Invalid ticket ID.', ephemeral: true });
	}

	// Defer the reply to prevent timeout
	await interaction.deferReply({ ephemeral: true });

	try {
		// Find the ticket in database
		const ticket = await Ticket.findOne({
			where: { id: ticketId },
			relations: ['user']
		});

		if (!ticket) {
			return interaction.editReply({ content: 'Ticket not found.' });
		}

		// Check if user has permission to close the ticket
		const isTicketOwner = ticket.user.userId === interaction.user.id;
		const hasStaffPermission = interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels);

		if (!isTicketOwner && !hasStaffPermission) {
			return interaction.editReply({
				content: 'You do not have permission to close this ticket. Only the ticket owner or staff members can close tickets.'
			});
		}

		// Mark ticket as closed in database
		ticket.closed = true;
		await ticket.save();

		// Create closed ticket embed with delete button
		const deleteButton = new ButtonBuilder().setCustomId(`delete_${ticket.id}`).setLabel('🗑️ Delete Channel').setStyle(ButtonStyle.Danger);

		const deleteActionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(deleteButton);

		const closedEmbed = new EmbedBuilder()
			.setColor('#ff0000')
			.setTitle('🔒 Ticket Closed')
			.setDescription(`This ticket has been closed by <@${interaction.user.id}>`)
			.addFields(
				{ name: '📋 Ticket ID', value: ticket.id.toString(), inline: true },
				{ name: '👤 Original User', value: `<@${ticket.user.userId}>`, inline: true },
				{ name: '📅 Closed At', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
			)
			.setTimestamp()
			.setFooter({
				text: `Closed by ${interaction.user.username} • Channel will auto-delete in 5 minutes`,
				iconURL: interaction.user.displayAvatarURL()
			});

		// Update channel with closed status and delete button
		const channel = interaction.channel as TextChannel;
		await channel.send({
			embeds: [closedEmbed],
			components: [deleteActionRow]
		});

		// Rename channel to indicate it's closed
		try {
			await channel.setName(`closed-${channel.name.replace('ticket-', '')}`);
		} catch (error) {
			console.error('Error renaming channel:', error);
		}

		// Remove permissions for the ticket owner (but keep for staff)
		try {
			await channel.permissionOverwrites.edit(ticket.user.userId, {
				ViewChannel: false,
				SendMessages: false
			});
		} catch (error) {
			console.error('Error updating permissions:', error);
		}

		await interaction.editReply({
			content: `✅ Ticket #${ticket.id} has been closed successfully.`
		});

		// Auto-delete channel after 5 minutes (gives time for manual deletion or transcript generation)
		setTimeout(async () => {
			try {
				// Check if the channel still exists and is accessible
				const channelToDelete = await interaction.guild?.channels.fetch(channel.id).catch(() => null);

				if (channelToDelete) {
					await channelToDelete.delete();
					console.log(`Auto-deleted closed ticket channel: ${channel.name} (Ticket #${ticket.id})`);
				}
			} catch (error: any) {
				// Only log if it's not a "Unknown Channel" error (channel already deleted)
				if (error.code !== 10003) {
					console.error(`Error auto-deleting channel ${channel.name}:`, error.message);
				}
			}
		}, 300000); // Delete after 5 minutes (300,000ms)

		return; // Success path
	} catch (error) {
		console.error('Error closing ticket:', error);
		return interaction.editReply({ content: 'An error occurred while closing the ticket.' });
	}
}

/**
 * Handle delete channel button interaction
 * @param interaction - Button interaction
 */
export async function handleDeleteChannelButton(interaction: ButtonInteraction) {
	if (!interaction.guild || !interaction.channel) {
		return interaction.reply({ content: 'This command can only be used in a server channel.', ephemeral: true });
	}

	// Check if user has permission to delete the channel
	const hasStaffPermission = interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels);

	if (!hasStaffPermission) {
		return interaction.reply({
			content:
				'You do not have permission to delete this channel. Only staff members with "Manage Channels" permission can delete ticket channels.',
			ephemeral: true
		});
	}

	// Confirm deletion
	await interaction.reply({
		content: '🗑️ Deleting this ticket channel in 3 seconds...',
		ephemeral: true
	});

	// Delete channel after a short delay
	setTimeout(async () => {
		try {
			const channel = interaction.channel as TextChannel;
			await channel.delete();
			console.log(`Manually deleted ticket channel: ${channel.name}`);
		} catch (error: any) {
			console.error('Error manually deleting channel:', error.message);
		}
	}, 3000); // 3 seconds delay

	return; // Function completes successfully
}
