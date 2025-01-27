import path from 'path';
import { DataSource } from 'typeorm';

export const database: DataSource = new DataSource({
	type: 'postgres',
	host: 'localhost',
	port: 5432,
	username: process.env.username,
	password: process.env.password,
	database: process.env.database,
	synchronize: true,
	logging: true,
	entities: [path.join(__dirname, '../entities/*')]
});
