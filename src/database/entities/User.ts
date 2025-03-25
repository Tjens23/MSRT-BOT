import { OneToOne, Entity, BaseEntity, PrimaryColumn, Column} from 'typeorm'
import EnlistmentTicket from "./EnlistmentTicket";
import {UserActivity} from "./UserActivity";

@Entity()
export default class User extends BaseEntity {
    @PrimaryColumn({ type: 'varchar', unique: true })
    userId!: string

    @Column({ type: 'varchar' })
    username!: string;

    @Column({ type: 'varchar', unique: true })
    callsign!: string;

    @OneToOne(() => EnlistmentTicket, (ticket) => ticket.userId)
    enlistmentTicket?: EnlistmentTicket;

    @OneToOne(() => UserActivity, (activity) => activity.id)
    activity!: UserActivity;
}