import { Entity, BaseEntity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import User from "./User";

@Entity()
export class UserRankHistory extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, (user) => user.rankHistory)
    @JoinColumn()
    user!: User;

    @Column({ type: 'varchar' })
    roleId!: string;

    @Column({ type: 'varchar' })
    roleName!: string;

    @CreateDateColumn()
    receivedAt!: Date;

    @Column({ type: 'timestamp', nullable: true })
    removedAt?: Date;

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    // Duration helpers
    public getDurationInRole(): number {
        const endDate = this.removedAt || new Date();
        return endDate.getTime() - this.receivedAt.getTime();
    }

    public getFormattedDuration(): string {
        const duration = this.getDurationInRole();
        const days = Math.floor(duration / (1000 * 60 * 60 * 24));
        const hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
            return `${days} days, ${hours} hours`;
        } else if (hours > 0) {
            return `${hours} hours, ${minutes} minutes`;
        } else {
            return `${minutes} minutes`;
        }
    }
}
