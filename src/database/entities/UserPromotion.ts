import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import User from './User';

@Entity()
export default class UserPromotion extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, (user) => user.promotions)
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column({ type: 'varchar' })
    rank!: string;

    @Column({ type: 'timestamp' })
    timestamp!: Date;
}
