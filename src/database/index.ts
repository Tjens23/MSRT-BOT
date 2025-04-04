import
	'dotenv/config';
import { DataSource } from 'typeorm';
import EnlistmentTicket from "./entities/EnlistmentTicket";
import User from "./entities/User";
import { UserActivity } from './entities/UserActivity';
import Ticket from './entities/Ticket';
import HRTicket from './entities/HRTicket';
import LOATicket from './entities/LOATicket';

export const database: DataSource = new DataSource({
	type: 'postgres',
	host: 'localhost',
	port: 5432,
	username: 'postgres',
	password: 'Azizaetl8.',
	database: 'msrtbot',
	synchronize: true,
	logging: true,
	entities: [EnlistmentTicket, User, UserActivity, Ticket, HRTicket, LOATicket]
});
