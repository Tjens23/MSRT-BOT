import { TIcketTypes } from "../../utils/Utils";
import User from "./User";

export interface ITicket {
    id: number;
    closed: boolean;
    ticketType: TIcketTypes;
    userId: User;
}