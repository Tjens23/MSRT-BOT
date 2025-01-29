import { ActionRowBuilder, ChannelType, EmbedBuilder, Guild, Interaction, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

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

	const modal = new ModalBuilder().setCustomId('enlistment');
	const CallsignInput = new TextInputBuilder()
		.setCustomId('CallsignInput')
		.setLabel('What would be your callsign?')
		.setStyle(TextInputStyle.Short)
		.setRequired(true);

	const AgeInput = new TextInputBuilder().setCustomId('AgeInput').setLabel('How old are you?').setRequired(true).setStyle(TextInputStyle.Short);

	const TimezoneInput = new TextInputBuilder()
		.setCustomId('TimezoneInput')
		.setLabel('What timezone are you in?')
		.setStyle(TextInputStyle.Short)
		.setRequired(true);

	const OtherInput = new TextInputBuilder()
		.setCustomId('OtherInput')
		.setLabel('Where did you find out about MSRT?')
		.setStyle(TextInputStyle.Short)
		.setRequired(true);

	const GameInput = new TextInputBuilder()
		.setCustomId('GameInput')
		.setLabel('“Ready or Not” or “Ground Branch”?')
		.setStyle(TextInputStyle.Short)
		.setRequired(true);

	const callsignCompoenent = new ActionRowBuilder<TextInputBuilder>().addComponents(CallsignInput);
	const AgeCompoenent = new ActionRowBuilder<TextInputBuilder>().addComponents(AgeInput);
	const TimezoneComponent = new ActionRowBuilder<TextInputBuilder>().addComponents(TimezoneInput);
	const OtherCompoent = new ActionRowBuilder<TextInputBuilder>().addComponents(OtherInput);
	const GameInputComponent = new ActionRowBuilder<TextInputBuilder>().addComponents(GameInput);
	modal.addComponents(callsignCompoenent, AgeCompoenent, TimezoneComponent, OtherCompoent, GameInputComponent);

	console.log('Modal:', modal.toJSON()); // Debugging log

	interaction.showModal(modal);
	let callsignValue: string;
	let ageValue: string;
	let timezoneValue: string;
	let otherValue: string;
	let gameValue: string;

	interaction.awaitModalSubmit({ time: 20000, filter: (i) => i.customId === 'enlistment' }).then(async (modalInteraction) => {
		callsignValue = modalInteraction.fields.getTextInputValue('CallsignInput');
		ageValue = modalInteraction.fields.getTextInputValue('AgeInput');
		timezoneValue = modalInteraction.fields.getTextInputValue('TimezoneInput');
		otherValue = modalInteraction.fields.getTextInputValue('OtherInput');
		gameValue = modalInteraction.fields.getTextInputValue('GameInput');
	});
	await guild.channels
		.create({
			name: 'enlistment',
			type: ChannelType.GuildText,
			topic: 'Enlistment channel for the bot',
			reason: 'Enlistment channel creation',
			permissionOverwrites: [
				{
					id: guild.roles.everyone,
					deny: ['ViewChannel']
				},
				{
					id: guild.members.me!.id,
					allow: ['Administrator']
				},
				{
					id: interaction.user.id,
					allow: ['ViewChannel', 'SendMessages', 'Connect', 'Speak']
				},
				{
					id: guild.roles.cache.find((role) => role.name === 'Admin')!.id,
					allow: ['ViewChannel', 'SendMessages', 'Connect', 'Speak']
				}
			]
		})
		.then((channel) => {
			const embed = new EmbedBuilder()
				.setDescription(
					`Do understand our staff are on a wide range of time zones from EU to NA; we aim to process your ticket as soon as possible.`
				)
				.addFields({ name: 'Call sign', value: `${callsignValue}`, inline: true })
				.addFields({ name: 'Age', value: `${ageValue}`, inline: true })
				.addFields({ name: 'Timezone', value: `${timezoneValue}`, inline: true })
				.addFields({ name: 'Where did you find out about MSRT?', value: `${otherValue}`, inline: true })
				.addFields({ name: '“Ready or Not” or “Ground Branch”?', value: `${gameValue}`, inline: true });
			channel.send({ embeds: [embed] });
		});
};
