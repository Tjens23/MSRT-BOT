import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import User from './User';

@Entity()
export default class WarnEntity extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	reason!: string;

	@ManyToOne(() => User, (user) => user.warns, { onDelete: 'CASCADE' })
	user!: User;

	@ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'moderatorId' })
	moderator!: User | null;

	@CreateDateColumn()
	createdAt!: Date;
}
