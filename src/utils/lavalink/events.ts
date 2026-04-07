import { client } from '../../index';
import { formatDuration } from './helpers';

/**
 * Register all Lavalink event listeners
 */
export function registerLavalinkEvents(): void {
	// Node event listeners
	client.lavalink.nodeManager.on('connect', (node: any) => {
		console.log(`[Lavalink] Node "${node.id}" connected`);
	});

	client.lavalink.nodeManager.on('disconnect', (node: any, reason: any) => {
		console.log(`[Lavalink] Node "${node.id}" disconnected:`, reason);
	});

	client.lavalink.nodeManager.on('error', (node: any, error: any) => {
		console.error(`[Lavalink] Node "${node.id}" error:`, error);
	});

	// Track events
	client.lavalink.on('trackStart', (player: any, track: any) => {
		const channel = client.channels.cache.get(player.textChannelId);
		if (channel?.isTextBased()) {
			const embed = {
				color: 0x00ff00,
				title: '🎵 Now Playing',
				description: `**[${track.info.title}](${track.info.uri})**`,
				fields: [
					{ name: 'Author', value: track.info.author || 'Unknown', inline: true },
					{ name: 'Duration', value: formatDuration(track.info.duration), inline: true }
				],
				thumbnail: track.info.artworkUrl ? { url: track.info.artworkUrl } : undefined
			};
			(channel as any).send({ embeds: [embed] });
		}
	});

	client.lavalink.on('trackEnd', (_player: any, track: any, reason: any) => {
		const reasonStr = typeof reason === 'object' ? JSON.stringify(reason) : reason;
		console.log(`[Lavalink] Track ended: ${track?.info?.title} - Reason: ${reasonStr}`);
	});

	client.lavalink.on('queueEnd', (player: any) => {
		const channel = client.channels.cache.get(player.textChannelId);
		if (channel?.isTextBased()) {
			(channel as any).send('Queue ended. Leaving voice channel in 30 seconds...');
		}
	});

	client.lavalink.on('trackError', (player: any, track: any, payload: any) => {
		console.error(`[Lavalink] Track error: ${track?.info?.title}`, payload);
		const channel = client.channels.cache.get(player.textChannelId);
		if (channel?.isTextBased()) {
			(channel as any).send(`Failed to play **${track?.info?.title || 'track'}**: ${payload?.exception?.message || 'Unknown error'}`);
		}
	});

	client.lavalink.on('trackStuck', (player: any, track: any, payload: any) => {
		console.warn(`[Lavalink] Track stuck: ${track?.info?.title}`, payload);
		player.skip();
	});

	client.lavalink.on('playerDisconnect', (_player: any, voiceChannelId: string) => {
		console.log(`[Lavalink] Player disconnected from ${voiceChannelId}`);
	});
}
