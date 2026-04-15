import 'dotenv/config';
import { DataSource } from 'typeorm';
import EnlistmentTicket from './entities/EnlistmentTicket';
import User from './entities/User';
import { UserActivity } from './entities/UserActivity';
import { UserRankHistory } from './entities/UserRankHistory';
import Ticket from './entities/Ticket';
import LOATicket from './entities/LOATicket';
import HRTicket from './entities/HRTicket';
import SupportTicket from './entities/SupportTicket';
import Guild from './entities/Guild';
import WarnEntity from './entities/WarnEntity';
import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

const dbHost = process.env.DB_HOST ?? '127.0.0.1';
const dbPort = Number(process.env.DB_PORT ?? 5432);
const dbName = process.env.DB_NAME ?? 'msrtbot';
const dbUser = process.env.DB_USER ?? process.env.DB_USERNAME ?? 'postgres';
const dbPassword = process.env.DB_PASSWORD ?? '';
const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
const localSocketHost = '/var/run/postgresql';

function createDatabaseSource(host: string): DataSource {
	const options: PostgresConnectionOptions = {
		type: 'postgres',
		host,
		port: Number.isFinite(dbPort) ? dbPort : 5432,
		username: dbUser,
		password: dbPassword,
		database: dbName,
		synchronize: true,
		logging: true,
		entities: [EnlistmentTicket, User, UserActivity, UserRankHistory, Ticket, HRTicket, LOATicket, SupportTicket, Guild, WarnEntity]
	};

	return new DataSource(options);
}

export let database: DataSource = createDatabaseSource(dbHost);

export async function initializeDatabase(): Promise<void> {
	try {
		await database.initialize();
	} catch (error) {
		const code = (error as { code?: string })?.code;
		if (code === '28000' && localHosts.has(dbHost)) {
			database = createDatabaseSource(localSocketHost);
			await database.initialize();
			return;
		}

		throw error;
	}
}
