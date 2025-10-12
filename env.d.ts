declare global {
	namespace NodeJS {
		interface ProcessEnv {
			DISCORD_TOKEN: string;
			PREFIX: string;
			OWNERS: string;
			GUILD_ID: string;
			username: string;
			password: string;
			database: string;
			YOUTUBE_API_KEY: string;
			YOUTUBE_CHANNEL_ID: string;
		}
	}
}

export {};
