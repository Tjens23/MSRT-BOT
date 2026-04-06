import 'dotenv/config';
import './lib/setup';

import { LogLevel, SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';
import { initializeDatabase } from './database';
import { CheckActivity } from './utils/checkActivity';
//import { sendVoteReminder } from './utils/voteReminder';

export const client = new SapphireClient({
	defaultPrefix: process.env.PREFIX ?? '-',
	caseInsensitiveCommands: true,
	logger: {
		level: LogLevel.Debug
	},
	intents: [
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildVoiceStates
	],
	loadMessageCommandListeners: true
});

// Import lavalink after client is created (it depends on client)
import './utils/lavalink/lavalink';

// Send raw voice data to Lavalink
client.on('raw', (data: any) => {
	client.lavalink?.sendRawData(data);
});

const main = async () => {
	try {
		await initializeDatabase();
		client.logger.info('Database connected');
		client.logger.info('Logging in');
		await client.login();
		client.logger.info('logged in');

		// Initialize Lavalink after login
		if (client.user) {
			await client.lavalink.init({ id: client.user.id, username: client.user.username });
			client.logger.info('Lavalink initialized');
		}

		await CheckActivity();
		//await sendVoteReminder(process.env.VOTE_CHANNEL_ID);
	} catch (error) {
		client.logger.fatal(error);
		await client.destroy();
		process.exit(1);
	}
};

void main();
