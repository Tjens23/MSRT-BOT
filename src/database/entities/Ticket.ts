import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
    TableInheritance,
    OneToOne,
    JoinColumn,
  } from "typeorm";
  import { TIcketTypes } from "../../utils/Utils";
  import User from "./User";
  
  @Entity("tickets")
  @TableInheritance({ column: { type: "varchar", name: "type" } }) // key for inheritance
  export default class Ticket extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;
  
    @OneToOne(() => User, (user) => user.ticket, { cascade: true })
    @JoinColumn({ name: "userId" })
    user!: User;
  
    @Column({ type: "boolean", default: false })
    closed!: boolean;
  
    @Column({ type: "enum", enum: TIcketTypes, default: TIcketTypes.ENLISTMENT })
    ticketType!: TIcketTypes;
  }
  