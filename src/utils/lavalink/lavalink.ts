import { client } from '../../index';
import { MapQueueStore } from './MapQueueStore';
import { QueueWatcher } from './QueueWatcher';
import { registerLavalinkEvents } from './events';

const { LavalinkManager } = require('lavalink-client');

// Store session IDs for resuming
const previousSessions = new Map<string, string>();

/**
 * Initialize the Lavalink manager on the client
 */
client.lavalink = new LavalinkManager({
	nodes: [
		{
			authorization: process.env.LAVALINK_PASSWORD || 'youshallnotpass',
			host: process.env.LAVALINK_HOST || 'localhost',
			port: parseInt(process.env.LAVALINK_PORT || '2333'),
			id: 'main',
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
	autoMove: false,
	client: {
		id: '',
		username: 'MSRT_BOT'
	},
	autoSkipOnResolveError: false,
	emitNewSongsOnly: true,
	playerOptions: {
		maxErrorsPerTime: {
			threshold: 35_000,
			maxAmount: 5
		},
		minAutoPlayMs: 10_000,
		applyVolumeAsFilter: false,
		clientBasedPositionUpdateInterval: 50,
		defaultSearchPlatform: 'ytmsearch',
		allowCustomSources: true,
		volumeDecrementer: 1,
		onDisconnect: {
			autoReconnect: true,
			destroyPlayer: false
		},
		onEmptyQueue: {
			destroyAfterMs: 30_000
		},
		useUnresolvedData: true
	},
	queueOptions: {
		maxPreviousTracks: 10,
		queueStore: new MapQueueStore(),
		queueChangesWatcher: new QueueWatcher()
	},
	linksAllowed: true,
	linksBlacklist: [],
	linksWhitelist: [],
	advancedOptions: {
		enableDebugEvents: true,
		maxFilterFixDuration: 600_000,
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

// Register all event listeners
registerLavalinkEvents();

// Re-export utilities for convenience
export { formatDuration } from './helpers';
export { MapQueueStore } from './MapQueueStore';
export { QueueWatcher } from './QueueWatcher';
