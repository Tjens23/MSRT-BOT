import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'ticketes' })
export default class EnlistmentTickets extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	callsign!: string;

	@Column()
	age!: number;

	@Column()
	timezone!: string;

	@Column()
	platform!: string;

	@Column()
	game!: string;

	@Column({ type: 'boolean', default: false })
	solved!: boolean;

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	createdAt!: Date;

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	updatedAt!: Date;

	@Column({ unique: true })
	userId!: string;
}
