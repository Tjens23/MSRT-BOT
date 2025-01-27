import 'dotenv/config';
import path from 'path';
import { DataSource } from 'typeorm';

export const database: DataSource = new DataSource({
	type: 'postgres',
	host: 'localhost',
	port: 5432,
	username: 'postgres',
	password: 'Azizaetl8.',
	database: 'msrtbot',
	synchronize: true,
	logging: true,
	entities: [path.join(__dirname, '../entities/*')]
});
