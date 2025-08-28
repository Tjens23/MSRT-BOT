import { OneToOne, OneToMany, Entity, BaseEntity, PrimaryColumn, Column } from 'typeorm';
import { UserActivity } from "./UserActivity";
import Ticket from './Ticket';
import { UserRankHistory } from './UserRankHistory';

@Entity()
export default class User extends BaseEntity {
    @PrimaryColumn({ type: 'varchar', unique: true })
    userId!: string;

    @Column({ type: 'varchar' })
    username!: string;

    @Column({ type: 'varchar', unique: true })
    callsign!: string;

    @OneToMany(() => Ticket, (ticket) => ticket.user)
    tickets!: Ticket[];

    @OneToOne(() => UserActivity, (activity) => activity.user)
    activity!: UserActivity;

    @OneToMany(() => UserRankHistory, (rankHistory) => rankHistory.user)
    rankHistory!: UserRankHistory[];
}
