import 'dotenv/config';
import './lib/setup';

import { LogLevel, SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';
import { initializeDatabase } from './database';
import { CheckActivity } from './utils/checkActivity';
import { sendVoteReminder } from './utils/voteReminder';


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
		GatewayIntentBits.GuildMembers
	],
	loadMessageCommandListeners: true
});

const main = async () => {
	try {
		await initializeDatabase();
		client.logger.info('Database connected');
		client.logger.info('Logging in');
		await client.login();
		client.logger.info('logged in');
		await CheckActivity();
		const voteReminderChannelId = process.env.VOTE_REMINDER_CHANNEL_ID ?? process.env.VOTE_CHANNEL_ID;
		await sendVoteReminder(voteReminderChannelId);
	} catch (error) {
		client.logger.fatal(error);
		await client.destroy();
		process.exit(1);
	}
};

void main();
