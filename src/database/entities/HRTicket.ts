import { ChildEntity, Column } from "typeorm";
import Ticket from "./Ticket";

@ChildEntity()
export default class HRTicket extends Ticket {    
    @Column({ type: 'varchar' })
    report!: string;

    @Column({ type: 'varchar' })
    reason!: string;
}
