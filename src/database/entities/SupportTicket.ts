import { ChildEntity, Column } from "typeorm";
import Ticket from "./Ticket";

@ChildEntity()
export default class SupportTicket extends Ticket {
  @Column({ type: "varchar" })
  issue!: string;
}