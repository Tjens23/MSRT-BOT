import { User } from "discord.js";
import { TIcketTypes } from "../enums/TicketTypes";

export interface ITicket {
    id: number;
    closed: boolean;
    ticketType: TIcketTypes;
    userId: User;
}