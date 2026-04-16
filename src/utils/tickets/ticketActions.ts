import { ButtonInteraction, PermissionFlagsBits, EmbedBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder, TextChannel } from 'discord.js';
import { createTranscript } from 'discord-transcript-v2';
import Ticket from '../../database/entities/Ticket';
import { TicketTypes } from '../enums/TicketTypes';

export async function handleTranscriptButton(interaction: ButtonInteraction) {
	if (!interaction.guild || !interaction.channel) {
		return interaction.reply({ content: 'This command can only be used in a server channel.', ephemeral: true });
	}

	const customIdParts = interaction.customId.split('_');
	const ticketId = parseInt(customIdParts[1]);

	if (!ticketId || isNaN(ticketId)) {
		return interaction.reply({ content: 'Invalid ticket ID. Please contact an administrator.', ephemeral: true });
	}

	await interaction.deferReply({ ephemeral: true });

	try {
		const ticket = await Ticket.findOne({
			where: { id: ticketId },
			relations: ['user']
		});

		if (!ticket) {
			return interaction.editReply({ content: 'Ticket not found.' });
		}

		const channel = interaction.channel as TextChannel;

		const ticketTypeName = TicketTypes[ticket.ticketType]?.toLowerCase() ?? 'unknown';
		const ticketCountOfType = await Ticket.count({ where: { ticketType: ticket.ticketType } });

		const attachment = await createTranscript(channel, {
			limit: -1,
			filename: `${ticketTypeName}-${ticketCountOfType}-transcript.html`,
			poweredBy: false,
			saveImages: false
		});

		const transcriptsChannelId = process.env.TRANSCRIPTS_CHANNEL_ID;
		if (!transcriptsChannelId) {
			return interaction.editReply({ content: '❌ Transcripts channel ID is not configured in the environment variables.' });
		}

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
			return interaction.editReply({ content: '❌ The transcripts channel is not a valid text channel.' });
		}

		try {
			const transcriptMessage = await transcriptsChannel.send({
				content: `**Ticket Transcript - ${ticketTypeName.charAt(0).toUpperCase() + ticketTypeName.slice(1)} #${ticketCountOfType}**\n🎫 Ticket Type: ${ticket.ticketType}\n👤 User: ${ticket.user.username} (${ticket.user.userId})\n📅 Generated: ${new Date().toLocaleString()}`,
				files: [attachment]
			});

			await interaction.editReply({
				content: `✅ Transcript generated and sent to <#${transcriptsChannelId}>!\n[View Transcript](${transcriptMessage.url})`
			});
		} catch (error) {
			console.error('Error sending transcript to channel:', error);
			return interaction.editReply({
				content: '❌ Failed to send transcript to the transcripts channel. Please try again or contact an administrator.'
			});
		}

		return;
	} catch (error) {
		console.error('Error generating transcript:', error);
		return interaction.editReply({ content: 'An error occurred while generating the transcript. Please try again or contact an administrator.' });
	}
}

export async function handleCloseTicketButton(interaction: ButtonInteraction) {
	if (!interaction.guild || !interaction.channel) {
		return interaction.reply({ content: 'This command can only be used in a server channel.', ephemeral: true });
	}

	const ticketId = parseInt(interaction.customId.split('_')[1]);

	if (!ticketId) {
		return interaction.reply({ content: 'Invalid ticket ID.', ephemeral: true });
	}

	await interaction.deferReply({ ephemeral: true });

	try {
		const ticket = await Ticket.findOne({
			where: { id: ticketId },
			relations: ['user']
		});

		if (!ticket) {
			return interaction.editReply({ content: 'Ticket not found.' });
		}

		const isTicketOwner = ticket.user.userId === interaction.user.id;
		const hasStaffPermission = interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels);

		if (!isTicketOwner && !hasStaffPermission) {
			return interaction.editReply({
				content: 'You do not have permission to close this ticket. Only the ticket owner or staff members can close tickets.'
			});
		}

		ticket.closed = true;
		await ticket.save();

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

		const channel = interaction.channel as TextChannel;
		await channel.send({ embeds: [closedEmbed], components: [deleteActionRow] });

		try {
			await channel.setName(`closed-${channel.name.replace('ticket-', '')}`);
		} catch (error) {
			console.error('Error renaming channel:', error);
		}

		try {
			await channel.permissionOverwrites.edit(ticket.user.userId, {
				ViewChannel: false,
				SendMessages: false
			});
		} catch (error) {
			console.error('Error updating permissions:', error);
		}

		await interaction.editReply({ content: `✅ Ticket #${ticket.id} has been closed successfully.` });

		setTimeout(async () => {
			try {
				const channelToDelete = await interaction.guild?.channels.fetch(channel.id).catch(() => null);
				if (channelToDelete) {
					await channelToDelete.delete();
					console.log(`Auto-deleted closed ticket channel: ${channel.name} (Ticket #${ticket.id})`);
				}
			} catch (error: any) {
				if (error.code !== 10003) {
					console.error(`Error auto-deleting channel ${channel.name}:`, error.message);
				}
			}
		}, 300000);

		return;
	} catch (error) {
		console.error('Error closing ticket:', error);
		return interaction.editReply({ content: 'An error occurred while closing the ticket.' });
	}
}

export async function handleDeleteChannelButton(interaction: ButtonInteraction) {
	if (!interaction.guild || !interaction.channel) {
		return interaction.reply({ content: 'This command can only be used in a server channel.', ephemeral: true });
	}

	const hasStaffPermission = interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels);

	if (!hasStaffPermission) {
		return interaction.reply({
			content:
				'You do not have permission to delete this channel. Only staff members with "Manage Channels" permission can delete ticket channels.',
			ephemeral: true
		});
	}

	await interaction.reply({ content: '🗑️ Deleting this ticket channel in 3 seconds...', ephemeral: true });

	setTimeout(async () => {
		try {
			const channel = interaction.channel as TextChannel;
			await channel.delete();
			console.log(`Manually deleted ticket channel: ${channel.name}`);
		} catch (error: any) {
			console.error('Error manually deleting channel:', error.message);
		}
	}, 3000);

	return;
}
