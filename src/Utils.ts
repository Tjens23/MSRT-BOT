import {
	ActionRowBuilder,
	Guild,
	Interaction,
	InteractionCollector,
	ModalBuilder,
	ModalSubmitInteraction,
	TextInputBuilder,
	TextInputStyle
} from 'discord.js';

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

export const createEnlistmentChannel = async (_guild: Guild, interaction: Interaction) => {
	if (!interaction.isButton()) return;

	const modal = new ModalBuilder()
		.setTitle('Please fill out')
		.setCustomId('enlistment')
		.setComponents(
			new ActionRowBuilder<TextInputBuilder>().setComponents(
				new TextInputBuilder().setLabel('What would be your callsign').setCustomId('callsign').setStyle(TextInputStyle.Short)
			),
			new ActionRowBuilder<TextInputBuilder>().setComponents(
				new TextInputBuilder().setLabel('How old are you?').setCustomId('age').setStyle(TextInputStyle.Short)
			),
			new ActionRowBuilder<TextInputBuilder>().setComponents(
				new TextInputBuilder().setLabel('What timezone are you in?').setCustomId('timezone').setStyle(TextInputStyle.Paragraph)
			)
		);

	// Show the modal
	await interaction.showModal(modal);

	const filter = (modalInteraction: ModalSubmitInteraction): boolean =>
		modalInteraction.isModalSubmit() && modalInteraction.customId === 'enlistment' && modalInteraction.user.id === interaction.user.id;

	// Create an InteractionCollector for modal submissions
	const collector = new InteractionCollector(interaction.client, {
		filter,
		time: 60000 // 60 seconds to submit the modal
	});

	collector.on('collect', async (modalInteraction) => {
		if (modalInteraction.isModalSubmit()) {
			const enlistmentData = {
				callsign: modalInteraction.fields.getTextInputValue('callsign'),
				age: modalInteraction.fields.getTextInputValue('age'),
				timezone: modalInteraction.fields.getTextInputValue('timezone')
			};

			console.log(`Callsign: ${enlistmentData.callsign}`);
			console.log(`Age: ${enlistmentData.age}`);
			console.log(`Timezone: ${enlistmentData.timezone}`);

			// Respond to the user
			await modalInteraction.reply({
				content: 'Thank you for your submission!',
				ephemeral: true
			});
		}
	});

	collector.on('end', (collected, reason) => {
		if (reason === 'time') {
			interaction.followUp({
				content: 'You took too long to fill out the form.',
				ephemeral: true
			});
		}
		console.log(collected);
	});
};
