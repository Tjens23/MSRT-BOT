import { Listener } from '@sapphire/framework';
import { VoiceState } from 'discord.js';
import { sendAuditLog } from '../../utils/auditLogger';

export class VoiceStateUpdateListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'voiceStateUpdate'
		});
	}

	public async run(oldState: VoiceState, newState: VoiceState): Promise<void> {
		const guild = newState.guild || oldState.guild;
		if (!guild) return;

		const member = newState.member || oldState.member;
		if (!member || member.user.bot) return;

		const changes: Array<{ name: string; value: string; inline?: boolean }> = [];
		let title = 'Voice State Updated';

		// User joined a voice channel
		if (!oldState.channelId && newState.channelId) {
			title = 'Joined Voice Channel';
			changes.push({ name: 'Channel', value: `${newState.channel}`, inline: true });
		}
		// User left a voice channel
		else if (oldState.channelId && !newState.channelId) {
			title = 'Left Voice Channel';
			changes.push({ name: 'Channel', value: `${oldState.channel}`, inline: true });
		}
		// User switched voice channels
		else if (oldState.channelId !== newState.channelId) {
			title = 'Switched Voice Channel';
			changes.push({ name: 'From', value: `${oldState.channel}`, inline: true });
			changes.push({ name: 'To', value: `${newState.channel}`, inline: true });
		}
		// Mute/unmute (server)
		else if (oldState.serverMute !== newState.serverMute) {
			title = newState.serverMute ? 'Server Muted' : 'Server Unmuted';
			changes.push({ name: 'Channel', value: `${newState.channel}`, inline: true });
		}
		// Deafen/undeafen (server)
		else if (oldState.serverDeaf !== newState.serverDeaf) {
			title = newState.serverDeaf ? 'Server Deafened' : 'Server Undeafened';
			changes.push({ name: 'Channel', value: `${newState.channel}`, inline: true });
		}
		// Streaming
		else if (oldState.streaming !== newState.streaming) {
			title = newState.streaming ? 'Started Streaming' : 'Stopped Streaming';
			changes.push({ name: 'Channel', value: `${newState.channel}`, inline: true });
		}
		// Camera
		else if (oldState.selfVideo !== newState.selfVideo) {
			title = newState.selfVideo ? 'Camera On' : 'Camera Off';
			changes.push({ name: 'Channel', value: `${newState.channel}`, inline: true });
		}
		// Self mute/unmute and self deafen/undeafen are too noisy, skip them
		else {
			return;
		}

		if (changes.length === 0) return;

		await sendAuditLog({
			guild,
			eventType: 'VOICE_STATE_UPDATE',
			title,
			fields: [{ name: 'User', value: `${member} (${member.user.tag})`, inline: true }, ...changes],
			thumbnail: member.displayAvatarURL(),
			footer: `User ID: ${member.id}`
		});
	}
}
