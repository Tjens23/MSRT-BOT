import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalSubmitInteraction } from 'discord.js';
import { TicketTypes } from '../enums/TicketTypes';
import { TICKET_TYPE_MAP, createTicketChannel } from './ticketChannel';

export async function handleButton(interaction: ButtonInteraction) {
	const typeKey = interaction.customId;
	const ticketType = TICKET_TYPE_MAP[typeKey as keyof typeof TICKET_TYPE_MAP] as TicketTypes | undefined;

	if (ticketType === undefined) {
		return interaction.reply({ content: 'Invalid ticket type.', ephemeral: true });
	}

	if (!interaction.guild) {
		return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
	}

	switch (ticketType) {
		case TicketTypes.ENLISTMENT: {
			const modal = new ModalBuilder().setCustomId('enlistment_modal').setTitle('MSRT Enlistment Application');

			const callsignInput = new TextInputBuilder()
				.setCustomId('callsign')
				.setLabel('What would be your callsign?')
				.setStyle(TextInputStyle.Short)
				.setRequired(true)
				.setMaxLength(50);

			const ageInput = new TextInputBuilder()
				.setCustomId('age')
				.setLabel('How old are you?')
				.setStyle(TextInputStyle.Short)
				.setRequired(true)
				.setMaxLength(3);

			const timezoneInput = new TextInputBuilder()
				.setCustomId('timezone')
				.setLabel('What timezone are you in?')
				.setStyle(TextInputStyle.Short)
				.setRequired(true)
				.setMaxLength(50)
				.setPlaceholder('e.g., EST, PST, GMT+1, etc.');

			const foundOutInput = new TextInputBuilder()
				.setCustomId('found_out')
				.setLabel('Where did you find out about MSRT?')
				.setStyle(TextInputStyle.Paragraph)
				.setRequired(true)
				.setMaxLength(500);

			const gameInput = new TextInputBuilder()
				.setCustomId('game')
				.setLabel('"Ready or Not", "Phoenix" or "Ground Branch"?')
				.setStyle(TextInputStyle.Short)
				.setRequired(true)
				.setMaxLength(50);

			modal.addComponents(
				new ActionRowBuilder<TextInputBuilder>().addComponents(callsignInput),
				new ActionRowBuilder<TextInputBuilder>().addComponents(ageInput),
				new ActionRowBuilder<TextInputBuilder>().addComponents(timezoneInput),
				new ActionRowBuilder<TextInputBuilder>().addComponents(foundOutInput),
				new ActionRowBuilder<TextInputBuilder>().addComponents(gameInput)
			);

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

			const startDateInput = new TextInputBuilder()
				.setCustomId('start_date')
				.setLabel('Start Date of LOA (YYYY-MM-DD)')
				.setStyle(TextInputStyle.Short)
				.setRequired(true)
				.setMaxLength(10)
				.setPlaceholder('e.g., 2025-09-22');

			const endDateInput = new TextInputBuilder()
				.setCustomId('end_date')
				.setLabel('End Date of LOA (YYYY-MM-DD)')
				.setStyle(TextInputStyle.Short)
				.setRequired(true)
				.setMaxLength(10)
				.setPlaceholder('e.g., 2025-09-30');

			const reasonInput = new TextInputBuilder()
				.setCustomId('reason')
				.setLabel('Reason for Leave of Absence')
				.setStyle(TextInputStyle.Paragraph)
				.setRequired(true)
				.setMaxLength(500)
				.setPlaceholder('Please provide the reason for your LOA...');

			modal.addComponents(
				new ActionRowBuilder<TextInputBuilder>().addComponents(startDateInput),
				new ActionRowBuilder<TextInputBuilder>().addComponents(endDateInput),
				new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput)
			);

			return await interaction.showModal(modal);
		}

		default:
			return await createTicketChannel(interaction, ticketType);
	}
}

export async function handleEnlistmentModal(interaction: ModalSubmitInteraction) {
	if (!interaction.guild) {
		return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
	}

	return await createTicketChannel(interaction, TicketTypes.ENLISTMENT, {
		callsign: interaction.fields.getTextInputValue('callsign'),
		age: interaction.fields.getTextInputValue('age'),
		timezone: interaction.fields.getTextInputValue('timezone'),
		foundOut: interaction.fields.getTextInputValue('found_out'),
		game: interaction.fields.getTextInputValue('game')
	});
}

export async function handleLOAModal(interaction: ModalSubmitInteraction) {
	if (!interaction.guild) {
		return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
	}

	return await createTicketChannel(interaction, TicketTypes.LOA, {
		startDate: interaction.fields.getTextInputValue('start_date'),
		endDate: interaction.fields.getTextInputValue('end_date'),
		reason: interaction.fields.getTextInputValue('reason')
	});
}

export async function handleSupportModal(interaction: ModalSubmitInteraction) {
	if (!interaction.guild) {
		return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
	}

	return await createTicketChannel(interaction, TicketTypes.SUPPORT, {
		issue: interaction.fields.getTextInputValue('issue')
	});
}
