import type { LavalinkManager } from 'lavalink-client';

declare module '@sapphire/framework' {
	interface SapphireClient {
		lavalink: LavalinkManager;
	}
}
