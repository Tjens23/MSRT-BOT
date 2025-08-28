import
	'dotenv/config';
import { DataSource } from 'typeorm';
import EnlistmentTicket from "./entities/EnlistmentTicket";
import User from "./entities/User";
import { UserActivity } from './entities/UserActivity';
import Ticket from './entities/Ticket';
import LOATicket from './entities/LOATicket';
import HRTicket from './entities/HRTicket';
import Guild from './entities/Guild';

export const database: DataSource = new DataSource({
	type: 'postgres',
	host: 'localhost',
	port: 5432,
	username: 'postgres',
	password: 'Hyg57aff',
	database: 'msrtbot',
	synchronize: true,
	logging: true,
	entities: [EnlistmentTicket, User, UserActivity, Ticket, HRTicket, LOATicket, Guild]
});
