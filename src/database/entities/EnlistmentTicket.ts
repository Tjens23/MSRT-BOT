import { ChildEntity, Column } from "typeorm";
import Ticket from "./Ticket";

@ChildEntity()
export default class EnlistmentTicket extends Ticket {
  @Column({ type: "varchar" })
  timezone!: string;

  @Column({ type: "varchar" })
  game!: string;
}
