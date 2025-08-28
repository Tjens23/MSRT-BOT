import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
    TableInheritance,
    ManyToOne,
    JoinColumn,
  } from "typeorm";
  import User from "./User";
import { TIcketTypes } from "../../utils/enums/TicketTypes";
  
  @Entity("tickets")
  @TableInheritance({ column: { type: "varchar", name: "type" } }) // key for inheritance
  export default class Ticket extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;
  
    @ManyToOne(() => User, (user) => user.tickets, { cascade: true })
    @JoinColumn({ name: "userId" })
    user!: User;
  
    @Column({ type: "boolean", default: false })
    closed!: boolean;
  
    @Column({ type: "enum", enum: TIcketTypes, default: TIcketTypes.ENLISTMENT })
    ticketType!: TIcketTypes;

    @Column({ type: "varchar" })
    title!: string;

    @Column({ type: "text" })
    description!: string;
  }
