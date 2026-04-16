import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder, ModalSubmitInteraction } from 'discord.js';
import { TicketTypes } from '../enums/TicketTypes';
import Ticket from '../../database/entities/Ticket';
import { TicketData } from '../types/ticket';

function makeActionRow(ticketId: number) {
	const transcriptButton = new ButtonBuilder().setCustomId(`transcript_${ticketId}`).setLabel('📜 View Transcript').setStyle(ButtonStyle.Primary);

	const closeButton = new ButtonBuilder().setCustomId(`close_${ticketId}`).setLabel('🔒 Close Ticket').setStyle(ButtonStyle.Danger);

	return new ActionRowBuilder<ButtonBuilder>().addComponents(transcriptButton, closeButton);
}

export async function sendTicketEmbed(
	channel: any,
	interaction: ButtonInteraction | ModalSubmitInteraction,
	ticket: Ticket,
	ticketType: TicketTypes,
	data?: TicketData
) {
	const actionRow = makeActionRow(ticket.id);
	const footerIcon = interaction.guild?.iconURL() || undefined;

	if (ticketType === TicketTypes.ENLISTMENT && data?.callsign && data?.age && data?.timezone && data?.foundOut && data?.game) {
		await sendEnlistmentEmbed(channel, interaction, ticket, actionRow, footerIcon, data);
	} else if (ticketType === TicketTypes.LOA && data?.reason && data?.startDate && data?.endDate) {
		await sendLOAEmbed(channel, interaction, ticket, actionRow, footerIcon, data);
	} else if (ticketType === TicketTypes.SUPPORT && data?.issue) {
		await sendSupportEmbed(channel, interaction, ticket, actionRow, footerIcon, data);
	} else {
		await sendGenericEmbed(channel, interaction, ticket, ticketType, actionRow, footerIcon);
	}
}

async function sendEnlistmentEmbed(
	channel: any,
	interaction: ButtonInteraction | ModalSubmitInteraction,
	ticket: Ticket,
	actionRow: ActionRowBuilder<ButtonBuilder>,
	footerIcon: string | undefined,
	data: TicketData
) {
	const embed = new EmbedBuilder()
		.setColor('#00ff00')
		.setTitle('🪖 MSRT Enlistment Application')
		.setDescription(`Welcome to your enlistment ticket, **${data.callsign}**!`)
		.addFields(
			{ name: '👤 Callsign', value: data.callsign!, inline: true },
			{ name: '🎂 Age', value: data.age!, inline: true },
			{ name: '🌍 Timezone', value: data.timezone!, inline: true },
			{ name: '🔍 Found MSRT through', value: data.foundOut!, inline: false },
			{ name: '🎮 Game Preference', value: data.game!, inline: true }
		)
		.setThumbnail(interaction.user.displayAvatarURL())
		.setTimestamp()
		.setFooter({ text: `Ticket ID: ${ticket.id} | User ID: ${interaction.user.id}`, iconURL: footerIcon });

	await channel.send({
		content: `<@${interaction.user.id}> Your enlistment application has been submitted!`,
		embeds: [embed],
		components: [actionRow]
	});
	await channel.send({
		content:
			`📝 **Next Steps:**\n` +
			`• Our staff will review your application\n` +
			`• Please be patient as we have staff across multiple timezones\n` +
			`• A staff member will be with you shortly\n` +
			`• Do not create additional tickets for the same purpose\n\n` +
			`Thank you for your interest in joining MSRT! 🎖️`
	});
}

async function sendLOAEmbed(
	channel: any,
	interaction: ButtonInteraction | ModalSubmitInteraction,
	ticket: Ticket,
	actionRow: ActionRowBuilder<ButtonBuilder>,
	footerIcon: string | undefined,
	data: TicketData
) {
	const durationDays = Math.ceil((new Date(data.endDate!).getTime() - new Date(data.startDate!).getTime()) / (1000 * 60 * 60 * 24));

	const embed = new EmbedBuilder()
		.setColor('#ffa500')
		.setTitle('🏖️ MSRT Leave of Absence Request')
		.setDescription(`Your LOA request has been submitted, **${interaction.user.username}**!`)
		.addFields(
			{ name: '📅 Start Date', value: data.startDate!, inline: true },
			{ name: '📅 End Date', value: data.endDate!, inline: true },
			{ name: '⏱️ Duration', value: `${durationDays} days`, inline: true },
			{ name: '📝 Reason', value: data.reason!, inline: false }
		)
		.setThumbnail(interaction.user.displayAvatarURL())
		.setTimestamp()
		.setFooter({ text: `Ticket ID: ${ticket.id} | User ID: ${interaction.user.id}`, iconURL: footerIcon });

	await channel.send({
		content: `<@${interaction.user.id}> Your Leave of Absence request has been submitted!`,
		embeds: [embed],
		components: [actionRow]
	});
	await channel.send({
		content:
			`📋 **LOA Request Information:**\n` +
			`• Staff will review your request shortly\n` +
			`• Please ensure your dates are accurate\n` +
			`• You will be notified once your LOA is approved/denied\n` +
			`• Keep this channel open until your request is processed\n\n` +
			`**Note:** Your LOA will be effective from the approved start date. 📆`
	});
}

async function sendSupportEmbed(
	channel: any,
	interaction: ButtonInteraction | ModalSubmitInteraction,
	ticket: Ticket,
	actionRow: ActionRowBuilder<ButtonBuilder>,
	footerIcon: string | undefined,
	data: TicketData
) {
	const embed = new EmbedBuilder()
		.setColor('#ff6b6b')
		.setTitle('🛠️ MSRT Help Desk')
		.setDescription(`Your support ticket has been submitted, **${interaction.user.username}**!`)
		.addFields({ name: '🔧 Issue', value: data.issue!, inline: false })
		.setThumbnail(interaction.user.displayAvatarURL())
		.setTimestamp()
		.setFooter({ text: `Ticket ID: ${ticket.id} | User ID: ${interaction.user.id}`, iconURL: footerIcon });

	await channel.send({
		content: `<@${interaction.user.id}> Your support ticket has been submitted!`,
		embeds: [embed],
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
}

async function sendGenericEmbed(
	channel: any,
	interaction: ButtonInteraction | ModalSubmitInteraction,
	ticket: Ticket,
	ticketType: TicketTypes,
	actionRow: ActionRowBuilder<ButtonBuilder>,
	footerIcon: string | undefined
) {
	const ticketTypeName = Object.keys(TicketTypes)[Object.values(TicketTypes).indexOf(ticketType)];
	const embed = new EmbedBuilder()
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
		.setFooter({ text: `Ticket ID: ${ticket.id}`, iconURL: footerIcon });

	await channel.send({ content: `<@${interaction.user.id}> Your ticket has been created!`, embeds: [embed], components: [actionRow] });
}
