import { 
	ButtonInteraction, 
	ChannelType, 
	PermissionFlagsBits, 
	ModalBuilder, 
	TextInputBuilder, 
	TextInputStyle, 
	ActionRowBuilder,
	ModalSubmitInteraction,
	EmbedBuilder
} from 'discord.js';
import User from '../database/entities/User';
import Ticket from '../database/entities/Ticket';
import EnlistmentTicket from '../database/entities/EnlistmentTicket';
import HRTicket from '../database/entities/HRTicket';
import LOATicket from '../database/entities/LOATicket';
import { TIcketTypes } from './enums/TicketTypes';
import { UserRankHistory } from '../database/entities/UserRankHistory';
import { database } from '../database';

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
	ticket_enlistment: TIcketTypes.ENLISTMENT,
	ticket_staff: TIcketTypes.STAFF,
	ticket_loa: TIcketTypes.LOA,
	ticket_hr: TIcketTypes.HR
};

export async function handleButton(interaction: ButtonInteraction) {
	const typeKey = interaction.customId;
	const ticketType = TICKET_TYPE_MAP[typeKey as keyof typeof TICKET_TYPE_MAP];

	if (!ticketType) {
		return interaction.reply({ content: 'Invalid ticket type.', ephemeral: true });
	}

	if (!interaction.guild) {
		return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
	}

	// If it's an enlistment ticket, show modal first
	if (ticketType === TIcketTypes.ENLISTMENT) {
		const modal = new ModalBuilder()
			.setCustomId('enlistment_modal')
			.setTitle('MSRT Enlistment Application');

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
			.setLabel('"Ready or Not" or "Ground Branch"?')
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

	// For other ticket types, proceed with original logic
	return await createTicketChannel(interaction, ticketType);
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
	return await createTicketChannel(interaction, TIcketTypes.ENLISTMENT, {
		callsign,
		age,
		timezone,
		foundOut,
		game
	});
}

async function createTicketChannel(
	interaction: ButtonInteraction | ModalSubmitInteraction, 
	ticketType: TIcketTypes,
	enlistmentData?: {
		callsign: string;
		age: string;
		timezone: string;
		foundOut: string;
		game: string;
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
			allow: [
				PermissionFlagsBits.ViewChannel,
				PermissionFlagsBits.SendMessages,
				PermissionFlagsBits.ReadMessageHistory
			]
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
	const channel = await interaction.guild.channels.create({
		name: `ticket-${interaction.user.username}`.toLowerCase(),
		type: ChannelType.GuildText,
		permissionOverwrites
	});

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
			callsign: enlistmentData?.callsign || interaction.user.username
		});
		await user.save();
	} else if (enlistmentData?.callsign) {
		// Update callsign if provided in modal
		user.callsign = enlistmentData.callsign;
		await user.save();
	}

	// Check if user already has an open ticket of the same type
	const existingTicket = user.tickets?.find(ticket => 
		ticket.ticketType === ticketType && !ticket.closed
	);

	if (existingTicket) {
		const ticketTypeName = Object.keys(TIcketTypes)[Object.values(TIcketTypes).indexOf(ticketType)];
		return interaction.editReply({ 
			content: `❌ You already have an open ${ticketTypeName.toLowerCase()} ticket. Please close your existing ticket before creating a new one.`
		});
	}

	// Create correct ticket subclass based on type
	let ticket: Ticket;

	switch (ticketType) {
		case TIcketTypes.ENLISTMENT:
			const enlistment = new EnlistmentTicket();
			enlistment.user = user;
			enlistment.ticketType = TIcketTypes.ENLISTMENT;
			enlistment.closed = false;
			enlistment.title = `Enlistment Ticket - ${enlistmentData?.callsign || interaction.user.username}`;
			enlistment.description = enlistmentData ? 
				`**Age:** ${enlistmentData.age}\n**Timezone:** ${enlistmentData.timezone}\n**Found MSRT through:** ${enlistmentData.foundOut}\n**Game Preference:** ${enlistmentData.game}` :
				'New enlistment request';
			enlistment.timezone = enlistmentData?.timezone || 'Unknown';
			enlistment.game = enlistmentData?.game || 'Unknown';
			ticket = enlistment;
			break;
		case TIcketTypes.HR:
			const hrTicket = new HRTicket();
			hrTicket.user = user;
			hrTicket.ticketType = TIcketTypes.HR;
			hrTicket.closed = false;
			hrTicket.title = `HR Ticket - ${interaction.user.username}`;
			hrTicket.description = 'New HR request';
			hrTicket.reason = 'Unknown'; // Update later via modal or form
			ticket = hrTicket;
			break;

		case TIcketTypes.LOA:
			const loaTicket = new LOATicket();
			loaTicket.user = user;
			loaTicket.ticketType = TIcketTypes.LOA;
			loaTicket.closed = false;
			loaTicket.title = `LOA Ticket - ${interaction.user.username}`;
			loaTicket.description = 'New LOA request';
			// Set default dates (user can update later)
			loaTicket.startDate = new Date();
			loaTicket.endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 1 week
			loaTicket.reason = 'Unknown'; // Update later via modal or form
			ticket = loaTicket;
			break;
		case TIcketTypes.STAFF:
			const staffTicket = new Ticket();
			staffTicket.user = user;
			staffTicket.ticketType = TIcketTypes.STAFF;
			staffTicket.closed = false;
			staffTicket.title = `Staff Ticket - ${interaction.user.username}`;
			staffTicket.description = 'New staff request';
			ticket = staffTicket;
			break;
		// Optional: other ticket subclasses
		default:
			ticket = Ticket.create({
				user,
				ticketType,
				closed: false,
				title: `Ticket - ${interaction.user.username}`,
				description: 'New ticket request'
			});
	}

	await ticket.save();

	// Create and send embed with ticket information
	if (ticketType === TIcketTypes.ENLISTMENT && enlistmentData) {
		const enlistmentEmbed = new EmbedBuilder()
			.setColor('#00ff00')
			.setTitle('🪖 MSRT Enlistment Application')
			.setDescription(`Welcome to your enlistment ticket, **${enlistmentData.callsign}**!`)
			.addFields(
				{ name: '👤 Callsign', value: enlistmentData.callsign, inline: true },
				{ name: '🎂 Age', value: enlistmentData.age, inline: true },
				{ name: '🌍 Timezone', value: enlistmentData.timezone, inline: true },
				{ name: '🔍 Found MSRT through', value: enlistmentData.foundOut, inline: false },
				{ name: '🎮 Game Preference', value: enlistmentData.game, inline: true }
			)
			.setThumbnail(interaction.user.displayAvatarURL())
			.setTimestamp()
			.setFooter({ 
				text: `Ticket ID: ${ticket.id} | User ID: ${interaction.user.id}`,
				iconURL: interaction.guild?.iconURL() || undefined
			});

		await channel.send({ 
			content: `<@${interaction.user.id}> Your enlistment application has been submitted!`,
			embeds: [enlistmentEmbed]
		});

		// Send additional instructions
		await channel.send({
			content: `📝 **Next Steps:**\n` +
				`• Our staff will review your application\n` +
				`• Please be patient as we have staff across multiple timezones\n` +
				`• A staff member will be with you shortly\n` +
				`• Do not create additional tickets for the same purpose\n\n` +
				`Thank you for your interest in joining MSRT! 🎖️`
		});
	} else {
		// For other ticket types, send a simpler embed
		const ticketTypeName = Object.keys(TIcketTypes)[Object.values(TIcketTypes).indexOf(ticketType)];
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
			embeds: [ticketEmbed]
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
export async function getAllUsersServerTime() {
	// Initialize database if not connected
	if (!database.isInitialized) {
		await database.initialize();
	}

	const users = await User.find({
		relations: ['activity']
	});

	return users.map(user => {
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
	}).sort((a, b) => {
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

	const activeRecords = allRankRecords.filter(record => record.isActive);
	const inactiveRecords = allRankRecords.filter(record => !record.isActive);

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
		longestServing: longestServing ? {
			user: longestServing.user,
			timeInRank: longestServing.getFormattedDuration(),
			since: longestServing.receivedAt
		} : null
	};
}
