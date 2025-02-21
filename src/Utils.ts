import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	Colors,
	EmbedBuilder,
	Guild,
	Interaction,
	InteractionCollector,
	ModalBuilder,
	ModalSubmitInteraction,
	TextInputBuilder,
	TextInputStyle
} from 'discord.js';
import EnlistmentTicket from './database/entities/EnlistmentTicket';

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

export const createEnlistmentChannel = async (guild: Guild, interaction: Interaction) => {
	if (!interaction.isButton()) return;

	const button = new ButtonBuilder().setCustomId('close').setStyle(ButtonStyle.Danger).setLabel('Close').setEmoji('🔒');

	const buttons = new ActionRowBuilder<ButtonBuilder>().setComponents(button);
	const modal = new ModalBuilder()
		.setTitle('Please fill out')
		.setCustomId('enlistment')
		.setComponents(
			new ActionRowBuilder<TextInputBuilder>().setComponents(
				new TextInputBuilder()
					.setLabel('What would be your callsign')
					.setCustomId('callsign')
					.setStyle(TextInputStyle.Short)
					.setPlaceholder('Rico')
			),
			new ActionRowBuilder<TextInputBuilder>().setComponents(
				new TextInputBuilder().setLabel('How old are you?').setCustomId('age').setStyle(TextInputStyle.Short).setPlaceholder('18')
			),
			new ActionRowBuilder<TextInputBuilder>().setComponents(
				new TextInputBuilder()
					.setLabel('What timezone are you in?')
					.setCustomId('timezone')
					.setStyle(TextInputStyle.Short)
					.setPlaceholder('GMT+1')
			),
			new ActionRowBuilder<TextInputBuilder>().setComponents(
				new TextInputBuilder()
					.setLabel('Where did you find out about MSRT?')
					.setCustomId('lol')
					.setStyle(TextInputStyle.Paragraph)
					.setPlaceholder('Discord, Reddit, etc.')
			),
			new ActionRowBuilder<TextInputBuilder>().setComponents(
				new TextInputBuilder()
					.setLabel('"Ready Or Not" or "Ground Branch" ')
					.setCustomId('game')
					.setStyle(TextInputStyle.Short)
					.setPlaceholder('RoN, GB')
			)
		);

	await interaction.showModal(modal);

	const filter = (modalInteraction: ModalSubmitInteraction): boolean =>
		modalInteraction.isModalSubmit() && modalInteraction.customId === 'enlistment' && modalInteraction.user.id === interaction.user.id;

	const collector = new InteractionCollector(interaction.client, {
		filter,
		time: 60000
	});

	collector.on('collect', async (modalInteraction) => {
		if (modalInteraction.isModalSubmit()) {
			const enlistmentData = getModalData(modalInteraction);
			await checkAndCreateTicket(interaction.user.id, TIcketTypes.ENLISTMENT, interaction);
			const channel = await guild.channels.create({
				name: `${interaction.user.username}-${interaction.user.discriminator}`,
				type: ChannelType.GuildText,
				permissionOverwrites: [
					{
						id: interaction.user.id,
						allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
					},
					{
						id: guild.roles.everyone.id,
						deny: ['ViewChannel']
					}
				]
			});

			const embed = new EmbedBuilder()
				.setDescription(
					`${interaction.user}, Do understand our staff are on a wide range of time zones from EU to NA; we aim to process your ticket as soon as possible.`
				)
				.addFields(
					{
						name: 'Callsign',
						value: enlistmentData.callsign,
						inline: true
					},
					{
						name: 'Age',
						value: enlistmentData.age,
						inline: true
					},
					{
						name: 'Timezone',
						value: enlistmentData.timezone,
						inline: true
					},
					{
						name: 'Where did you findout about MSRT?',
						value: enlistmentData.lol,
						inline: true
					},
					{
						name: '"Ready Or Not" or "Ground Branch"',
						value: enlistmentData.game,
						inline: true
					}
				)
				.setColor(Colors.Blue)
				.setThumbnail(interaction.guild!.iconURL({ forceStatic: false }))
				.setFooter({
					text: `${interaction.client.user.username}`,
					iconURL: `${interaction.client.user.displayAvatarURL()}`
				});
			channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [buttons] });
			await modalInteraction.reply({
				content: 'Thank you for your submission!',
				ephemeral: true
			});

			return collector.stop();
		}
	});

	return collector.on('end', (_collected, reason) => {
		if (reason === 'time') {
			interaction.followUp({
				content: 'You took too long to fill out the form.',
				ephemeral: true
			});
		}
	});
};

async function checkAndCreateTicket(userId: string, ticketType: TIcketTypes, interaction: Interaction) {
	// Find a ticket that is either open or of the specified type for the given user
	const existingTicket = await EnlistmentTicket.findOne({
		where: [
			{ userId: { userId }, closed: false },
			{ userId: { userId }, ticketType }
		]
	});

	if (existingTicket) {
		// If an open ticket or a ticket of the specified type exists, do not allow creation'
		await interaction.user.send(`You already have a(n) ${ticketType} ticket open.`);
	}
	const data = getModalData(interaction as ModalSubmitInteraction);
	// Proceed with ticket creation if no such ticket exists
	const newTicket = EnlistmentTicket.create({
		userId: { userId },
		ticketType,
		timezone: data.timezone
	});

	await newTicket.save();
	return newTicket;
}

export function getModalData(modalSubmit: ModalSubmitInteraction) {
	return {
		callsign: modalSubmit.fields.getTextInputValue('callsign'),
		age: modalSubmit.fields.getTextInputValue('age'),
		timezone: modalSubmit.fields.getTextInputValue('timezone'),
		lol: modalSubmit.fields.getTextInputValue('lol'),
		game: modalSubmit.fields.getTextInputValue('game')
	};
}

export enum TIcketTypes {
	LOA,
	ENLISTMENT,
	STAFF,
	HR
}