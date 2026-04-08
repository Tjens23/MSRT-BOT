import { BaseEntity, Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import User from './User';

@Entity()
export default class WarnEntity extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	reason!: string;

	@ManyToOne(() => User, (user) => user.warns, { onDelete: 'CASCADE' })
	user!: User;

	@OneToOne(() => User, { onDelete: 'CASCADE' })
	moderator!: User;
}
