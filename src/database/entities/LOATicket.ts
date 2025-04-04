import { ChildEntity, Column } from "typeorm";
import Ticket from "./Ticket";

@ChildEntity()
export default class LOATicket extends Ticket {
  @Column({ type: 'timestamp' })
  startDate!: Date;

  @Column({ type: 'timestamp' })
  endDate!: Date;

  @Column({ type: 'varchar' })
  reason!: string;
}
