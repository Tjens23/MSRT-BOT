import { OneToOne, Entity, BaseEntity, PrimaryColumn, Column } from 'typeorm';
import { UserActivity } from "./UserActivity";
import Ticket from './Ticket';

@Entity()
export default class User extends BaseEntity {
    @PrimaryColumn({ type: 'varchar', unique: true })
    userId!: string;

    @Column({ type: 'varchar' })
    username!: string;

    @Column({ type: 'varchar', unique: true })
    callsign!: string;

    @Column({ type: 'varchar' })
    rank!: string;

    @Column({ type: 'timestamp' })
    promotionTimestamp!: Date;

    @OneToOne(() => Ticket, (ticket) => ticket.user)
    ticket!: Ticket;

    @OneToOne(() => UserActivity, (activity) => activity.user)
    activity!: UserActivity;
}
