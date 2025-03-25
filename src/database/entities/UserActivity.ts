import {Entity, BaseEntity, Column, PrimaryGeneratedColumn, OneToOne} from 'typeorm';
import User from "./User";

@Entity()
export class UserActivity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @OneToOne(() => User, (user) => user.userId)
    user!: User

    @Column({ type: 'timestamp' })
    lastActive!: Date;
}