import { Entity, BaseEntity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import User from "./User";

@Entity()
export class UserActivity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @OneToOne(() => User, (user) => user.activity)
    @JoinColumn()
    user!: User;

    @Column({ type: 'timestamp' })
    lastActive!: Date;

    @Column({ type: 'timestamp', nullable: true })
    joinedServer?: Date;
}
