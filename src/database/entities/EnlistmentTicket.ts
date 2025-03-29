import {Entity, BaseEntity, Column, PrimaryGeneratedColumn, OneToOne} from 'typeorm'
import { TIcketTypes } from  "../../utils/Utils";
import { ITicket } from "./Ticket";
import User from "./User";

@Entity()
export default class EnlistmentTicket extends BaseEntity implements ITicket {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'boolean', default: false })
    closed!: boolean;

    @Column({ type: 'enum', enum: TIcketTypes, default: TIcketTypes.ENLISTMENT })
    ticketType!: TIcketTypes;

    @OneToOne(() => User, (user) => user.userId)
    userId!: User

    @Column({ type: 'varchar' })
    timezone!: string;

    @Column({ type: 'varchar'})
    game!: string
}