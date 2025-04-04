import { ButtonInteraction, ChannelType, GuildMember, PermissionFlagsBits } from 'discord.js';
import User from '../database/entities/User';
import Ticket from '../database/entities/Ticket';
import EnlistmentTicket from '../database/entities/EnlistmentTicket';
import HRTicket from '../database/entities/HRTicket';


export const trimArray = (arr: any, maxLen = 10) => {
	if (arr.length > maxLen) {
		const len = arr.length - maxLen;
		arr = arr.slice(0, maxLen);
		arr.push(`${len} more...`);
	}
	return arr;
};

export function removeDuplicates<T extends Array<T>>(arr: T) {
	return [...new Set(arr)];
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

export enum TIcketTypes {
	LOA,
	ENLISTMENT,
	STAFF,
	HR
}

export interface ITicket {
	id: number;
	closed: boolean;
	ticketType: TIcketTypes;
	userId: User;
}





const TICKET_TYPE_MAP = {
	ticket_enlistment: TIcketTypes.ENLISTMENT,
	ticket_staff: TIcketTypes.STAFF,
	ticket_loa: TIcketTypes.LOA
};

export async function handleButton(interaction: ButtonInteraction) {
	const typeKey = interaction.customId;
	const ticketType = TICKET_TYPE_MAP[typeKey as keyof typeof TICKET_TYPE_MAP];

	if (!ticketType) {
		return interaction.reply({ content: 'Invalid ticket type.', ephemeral: true });
	}

	const member = interaction.member as GuildMember;

	// Create private ticket channel
	const channel = await interaction.guild?.channels.create({
		name: `ticket-${interaction.user.username}`.toLowerCase(),
		type: ChannelType.GuildText,
		permissionOverwrites: [
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
			},
			{
				id: member.roles.botRole?.id ??  '', // Optional: allow mod role
				allow: [PermissionFlagsBits.ViewChannel]
			}
		]
	});

	if (!channel) {
		return interaction.reply({ content: 'Failed to create ticket channel.', ephemeral: true });
	}

	// Find or create user
	let user = await User.findOne({ where: { userId: interaction.user.id } });

	if (!user) {
		user = User.create({
			userId: interaction.user.id,
			username: interaction.user.username,
			callsign: interaction.user.username
		});
		await user.save();
	}

	// Create correct ticket subclass based on type
	let ticket: Ticket;

	switch (ticketType) {
		case TIcketTypes.ENLISTMENT:
			const enlistment = new EnlistmentTicket();
			enlistment.user = user;
			enlistment.ticketType = TIcketTypes.ENLISTMENT;
			enlistment.closed = false;
			enlistment.timezone = 'Unknown'; // Update later via modal or form
			enlistment.game = 'Unknown';
			ticket = enlistment;
			break;
    case TIcketTypes.STAFF:
      ticket = HRTicket.create({
        user,
        ticketType,
        closed: false,
        report: 'Unknown', // Update later via modal or form
        reason: 'Unknown' // Update later via modal or form
      });
      break;
    case TIcketTypes.HR:
      // Optional: create a HR ticket subclass
      ticket = Ticket.create({
        user,
        ticketType,
        closed: false
      });
      break;

		// Optional: other ticket subclasses
		default:
			ticket = Ticket.create({
				user,
				ticketType,
				closed: false
			});
	}

	await ticket.save();

	await channel.send(`<@${interaction.user.id}> Your ticket has been created!`);
	return await interaction.reply({ content: `✅ Ticket created: <#${channel.id}>`, ephemeral: true });
}

