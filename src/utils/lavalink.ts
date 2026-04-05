import { client } from '../index';
const { LavalinkManager } = require('lavalink-client');

// Simple Map-based queue store (no Redis needed)
class MapQueueStore {
	private data = new Map<string, string>();

	async get(guildId: string) {
		return this.data.get(`queue_${guildId}`) || null;
	}

	async set(guildId: string, stringifiedData: string) {
		this.data.set(`queue_${guildId}`, stringifiedData);
	}

	async delete(guildId: string) {
		this.data.delete(`queue_${guildId}`);
	}

	async parse(stringifiedData: string) {
		return JSON.parse(stringifiedData);
	}

	async stringify(data: any) {
		return JSON.stringify(data);
	}
}

// Simple queue changes watcher for logging
class QueueWatcher {
	shuffled(guildId: string) {
		console.log(`[Queue] ${guildId}: Queue shuffled`);
	}

	tracksAdd(guildId: string, tracks: any[], position: number) {
		console.log(`[Queue] ${guildId}: ${tracks.length} track(s) added at position #${position}`);
	}

	tracksRemoved(guildId: string, tracks: any[], position: number) {
		console.log(`[Queue] ${guildId}: ${tracks.length} track(s) removed from position #${position}`);
	}
}

// Store session IDs for resuming
const previousSessions = new Map<string, string>();
client.lavalink = new LavalinkManager({
	nodes: [
		{
			authorization: process.env.LAVALINK_PASSWORD || 'youshallnotpass',
			host: process.env.LAVALINK_HOST || 'localhost',
			port: parseInt(process.env.LAVALINK_PORT || '2333'),
			id: 'main',
			// get the previously used session, to restart with "resuming" enabled
			sessionId: previousSessions.get('main'),
			requestSignalTimeoutMS: 3000,
			closeOnError: true,
			heartBeatInterval: 30_000,
			enablePingOnStatsCheck: true,
			retryDelay: 10e3,
			secure: process.env.LAVALINK_SECURE === 'true',
			retryAmount: 5
		}
	],
	sendToShard: (guildId: string, payload: any) => client.guilds.cache.get(guildId)?.shard?.send(payload),
	autoSkip: true,
	autoMove: false, // auto move to next node, if a node disconnects
	//playerClass: yourCustomPlayerClass // class yourCustomPlayerClass extends Player {} .. make your own player class and types, the LavalinkManager is generic so then you can do new LavalinkManager<yourCustomPlayerClass>({})
	client: {
		// client.user is not available yet, will be set in init()
		id: '', // REQUIRED! (at least after the .init)
		username: 'MSRT_BOT'
	},
	autoSkipOnResolveError: true, // skip song, if resolving an unresolved song fails
	emitNewSongsOnly: true, // don't emit "looping songs"
	playerOptions: {
		// These are the default prevention methods
		maxErrorsPerTime: {
			threshold: 10_000,
			maxAmount: 3
		},
		// only allow an autoplay function to execute, if the previous function was longer ago than this number.
		minAutoPlayMs: 10_000,

		applyVolumeAsFilter: false,
		clientBasedPositionUpdateInterval: 50, // in ms to up-calc player.position
		defaultSearchPlatform: 'ytmsearch',
		allowCustomSources: false, // set to true if you want to allow custom sources which lavalink-client does not support (yet)
		volumeDecrementer: 0.75, // on client 100% == on lavalink 75%
		onDisconnect: {
			autoReconnect: true, // automatically attempts a reconnect, if the bot disconnects from the voice channel, if it fails, it get's destroyed
			destroyPlayer: false // overrides autoReconnect and directly destroys the player if the bot disconnects from the vc
		},
		onEmptyQueue: {
			// will auto destroy the player after 30s if the queue got empty and autoplay function does not add smt to the queue
			destroyAfterMs: 30_000 // 1 === instantly destroy | don't provide the option, to don't destroy the player
		},
		useUnresolvedData: true
	},
	queueOptions: {
		maxPreviousTracks: 10,
		queueStore: new MapQueueStore(),
		queueChangesWatcher: new QueueWatcher()
	},
	linksAllowed: true,
	// example: don't allow p*rn / youtube links., you can also use a regex pattern if you want.
	// linksBlacklist: ["porn", "youtube.com", "youtu.be"],
	linksBlacklist: [],
	linksWhitelist: [],
	advancedOptions: {
		enableDebugEvents: true,
		maxFilterFixDuration: 600_000, // only allow instafixfilterupdate for tracks sub 10mins
		debugOptions: {
			noAudio: false,
			playerDestroy: {
				dontThrowError: false,
				debugLog: false
			},
			logCustomSearches: false
		}
	}
});

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
	console.log(`[Lavalink] Track ended: ${track?.info?.title} - Reason: ${reason}`);
});

client.lavalink.on('queueEnd', (player: any) => {
	const channel = client.channels.cache.get(player.textChannelId);
	if (channel?.isTextBased()) {
		(channel as any).send('Queue ended. Leaving voice channel in 30 seconds...');
	}
});

// Helper function
function formatDuration(ms: number): string {
	const seconds = Math.floor((ms / 1000) % 60);
	const minutes = Math.floor((ms / 1000 / 60) % 60);
	const hours = Math.floor(ms / 1000 / 60 / 60);
	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}
	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
