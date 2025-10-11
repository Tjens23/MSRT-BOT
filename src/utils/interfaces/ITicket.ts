import { User } from "discord.js";
import { TicketTypes } from "../enums/TicketTypes";

export interface ITicket {
    id: number;
    closed: boolean;
    ticketType: TicketTypes;
    userId: User;
}