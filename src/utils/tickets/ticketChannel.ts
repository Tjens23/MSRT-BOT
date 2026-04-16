import { ButtonInteraction, ChannelType, PermissionFlagsBits, ModalSubmitInteraction } from 'discord.js';
import User from '../../database/entities/User';
import Ticket from '../../database/entities/Ticket';
import EnlistmentTicket from '../../database/entities/EnlistmentTicket';
import SupportTicket from '../../database/entities/SupportTicket';
import HRTicket from '../../database/entities/HRTicket';
import LOATicket from '../../database/entities/LOATicket';
import { TicketTypes } from '../enums/TicketTypes';
import { TicketData } from '../types/ticket';
import { sendTicketEmbed } from './ticketEmbeds';

export const TICKET_TYPE_MAP = {
	ticket_enlistment: TicketTypes.ENLISTMENT,
	ticket_staff: TicketTypes.STAFF,
	ticket_support: TicketTypes.SUPPORT,
	ticket_loa: TicketTypes.LOA,
	ticket_hr: TicketTypes.HR
} as const;

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

/**
 * Get the staff role IDs that should have access to a ticket type
 * @param ticketType - The type of ticket
 * @returns Array of role IDs that can view this ticket type
 */
function getTicketStaffRoleIds(ticketType: TicketTypes): string[] {
	const roleIds: string[] = [];

	switch (ticketType) {
		case TicketTypes.ENLISTMENT:
			if (process.env.S1_ROLE_ID) roleIds.push(process.env.S1_ROLE_ID);
			break;
		case TicketTypes.LOA:
			if (process.env.S1_ROLE_ID) roleIds.push(process.env.S1_ROLE_ID);
			break;
		case TicketTypes.SUPPORT:
			if (process.env.S1_ROLE_ID) roleIds.push(process.env.S1_ROLE_ID);
			if (process.env.S2_ROLE_ID) roleIds.push(process.env.S2_ROLE_ID);
			break;
		case TicketTypes.HR:
			if (process.env.HR_ROLE_ID) roleIds.push(process.env.HR_ROLE_ID);
			break;
		case TicketTypes.STAFF:
			if (process.env.S1_ROLE_ID) roleIds.push(process.env.S1_ROLE_ID);
			break;
		default:
			break;
	}

	return roleIds;
}

export async function createTicketChannel(interaction: ButtonInteraction | ModalSubmitInteraction, ticketType: TicketTypes, data?: TicketData) {
	if (!interaction.guild) {
		if (!interaction.deferred && !interaction.replied) {
			return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
		} else {
			return interaction.editReply({ content: 'This command can only be used in a server.' });
		}
	}

	if (!interaction.deferred && !interaction.replied) {
		await interaction.deferReply({ ephemeral: true });
	}

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

	// Add staff role permissions based on ticket type
	const staffRoleIds = getTicketStaffRoleIds(ticketType);
	for (const roleId of staffRoleIds) {
		permissionOverwrites.push({
			id: roleId,
			allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
		});
	}

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
		user = await User.findOne({
			where: { userId: interaction.user.id },
			relations: ['tickets']
		});

		if (!user) {
			console.error('Failed to create or reload user');
			return interaction.editReply({ content: '❌ Failed to create user. Please try again.' });
		}
	} else if (data?.callsign) {
		user.callsign = data.callsign;
		await user.save();
	}

	// Check for existing open ticket of same type
	const existingTicket = user.tickets?.find((ticket) => ticket.ticketType === ticketType && !ticket.closed);

	if (existingTicket) {
		let channelExists = false;
		try {
			const allChannels = await interaction.guild.channels.fetch();
			const usernameLower = interaction.user.username.toLowerCase();
			const userChannels = allChannels.filter(
				(ch) => ch && ch.isTextBased() && (ch.name === `ticket-${usernameLower}` || ch.name === `closed-${usernameLower}`)
			);
			channelExists = userChannels.size > 0;
		} catch (error) {
			console.error('Error checking ticket channels:', error);
		}

		if (!channelExists) {
			existingTicket.closed = true;
			try {
				await existingTicket.save();
			} catch (saveError) {
				console.error('Error closing ticket:', saveError);
				return interaction.editReply({
					content: `❌ Error updating old ticket: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`
				});
			}
		} else {
			const ticketTypeName = Object.keys(TicketTypes)[Object.values(TicketTypes).indexOf(ticketType)];
			return interaction.editReply({
				content: `❌ You already have an open ${ticketTypeName.toLowerCase()} ticket. Please close your existing ticket before creating a new one.`
			});
		}
	}

	// Create correct ticket subclass
	const ticket = buildTicket(ticketType, user, interaction.user.username, data);

	try {
		await ticket.save();
		console.log('Ticket saved with ID:', ticket.id);
	} catch (error) {
		console.error('Error saving ticket:', error);
		return interaction.editReply({
			content: `❌ Failed to save ticket to database: ${error instanceof Error ? error.message : 'Unknown error'}`
		});
	}

	if (!ticket.id) {
		console.error('Ticket ID is undefined after save');
		return interaction.editReply({ content: '❌ Ticket ID is undefined. Please try again.' });
	}

	await sendTicketEmbed(channel, interaction, ticket, ticketType, data);

	return await interaction.editReply({ content: `✅ Ticket created: <#${channel.id}>` });
}

function buildTicket(ticketType: TicketTypes, user: User, username: string, data?: TicketData): Ticket {
	switch (ticketType) {
		case TicketTypes.ENLISTMENT: {
			const t = new EnlistmentTicket();
			t.user = user;
			t.ticketType = TicketTypes.ENLISTMENT;
			t.closed = false;
			t.title = `Enlistment Ticket - ${data?.callsign || username}`;
			t.description = data
				? `**Age:** ${data.age}\n**Timezone:** ${data.timezone}\n**Found MSRT through:** ${data.foundOut}\n**Game Preference:** ${data.game}`
				: 'New enlistment request';
			t.timezone = data?.timezone || 'Unknown';
			t.game = data?.game || 'Unknown';
			return t;
		}
		case TicketTypes.LOA: {
			const t = new LOATicket();
			t.user = user;
			t.ticketType = TicketTypes.LOA;
			t.closed = false;
			t.title = `LOA Ticket - ${username}`;
			t.description = data?.reason || 'New LOA request';
			t.startDate = data?.startDate ? new Date(data.startDate) : new Date();
			t.endDate = data?.endDate ? new Date(data.endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
			t.reason = data?.reason || 'Unknown';
			return t;
		}
		case TicketTypes.SUPPORT: {
			const t = new SupportTicket();
			t.user = user;
			t.ticketType = TicketTypes.SUPPORT;
			t.closed = false;
			t.title = `Support Ticket - ${username}`;
			t.description = data?.issue || 'New support request';
			t.issue = data?.issue || 'Unknown';
			return t;
		}
		case TicketTypes.HR: {
			const t = new HRTicket();
			t.user = user;
			t.ticketType = TicketTypes.HR;
			t.closed = false;
			t.title = `HR Ticket - ${username}`;
			t.description = 'New HR request';
			t.reason = 'Unknown';
			return t;
		}
		case TicketTypes.STAFF: {
			const t = new Ticket();
			t.user = user;
			t.ticketType = TicketTypes.STAFF;
			t.closed = false;
			t.title = `Staff Ticket - ${username}`;
			t.description = 'New staff request';
			return t;
		}
		default: {
			const t = new Ticket();
			t.user = user;
			t.ticketType = ticketType;
			t.closed = false;
			t.title = `Ticket - ${username}`;
			t.description = 'New ticket request';
			return t;
		}
	}
}
