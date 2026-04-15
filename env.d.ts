declare global {
	namespace NodeJS {
		interface ProcessEnv {
			DISCORD_TOKEN: string;
			DISCORD_CLIENT_ID: string;
			PREFIX: string;
			OWNERS: string;
			GUILD_ID: string;
			TRANSCRIPTS_CHANNEL_ID: string;
			username: string;
			password: string;
			database: string;
			YOUTUBE_API_KEY: string;
			YOUTUBE_CHANNEL_ID: string;
			// Lavalink
			LAVALINK_HOST: string;
			LAVALINK_PORT: string;
			LAVALINK_PASSWORD: string;
			LAVALINK_NODE_ID: string;
			LAVALINK_SECURE: string;
		}
	}
}

export {};
