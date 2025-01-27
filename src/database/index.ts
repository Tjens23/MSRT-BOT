import 'dotenv/config';
import { DataSource } from 'typeorm';
import EnlistmentTickets from './entities/EnlistmentTickets';

export const database: DataSource = new DataSource({
	type: 'postgres',
	host: 'localhost',
	port: 5432,
	username: 'postgres',
	password: 'Azizaetl8.',
	database: 'msrtbot',
	synchronize: true,
	logging: true,
	entities: [EnlistmentTickets]
});
