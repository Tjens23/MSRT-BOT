import { ChildEntity, Column } from "typeorm";
import Ticket from "./Ticket";

@ChildEntity()
export default class LOATicket extends Ticket {
  @Column({ type: 'timestamp with local time zone' })
  startDate!: Date;

  @Column({ type: 'timestamp with local time zone' })
  endDate!: Date;

  @Column({ type: 'varchar' })
  reason!: string;
}
