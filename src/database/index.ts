import 'dotenv/config';
import { DataSource } from 'typeorm';
import EnlistmentTickets from './entities/EnlistmentTickets';

export const database: DataSource = new DataSource({
	type: 'postgres',
	host: 'localhost',
	port: 5432,
	username: 'tjens23',
	password: 'Hyg57aff',
	database: 'msrtbot',
	synchronize: true,
	logging: true,
	entities: [EnlistmentTickets]
});
