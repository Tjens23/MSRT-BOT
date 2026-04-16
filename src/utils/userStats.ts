import User from '../database/entities/User';
import { UserRankHistory } from '../database/entities/UserRankHistory';
import { database } from '../database';

export interface UserServerTime {
	userId: string;
	username: string;
	joinedDate: Date | null;
	timeInServer: {
		total: number;
		days: number;
		formatted: string;
	} | null;
}

export async function getUserServerTime(userId: string) {
	if (!database.isInitialized) {
		await database.initialize();
	}

	const user = await User.findOne({
		where: { userId },
		relations: ['activity']
	});

	if (!user || !user.activity || !user.activity.joinedServer) {
		return null;
	}

	const joinedDate = user.activity.joinedServer;
	const now = new Date();
	const timeInServer = now.getTime() - joinedDate.getTime();

	const days = Math.floor(timeInServer / (1000 * 60 * 60 * 24));
	const hours = Math.floor((timeInServer % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	const minutes = Math.floor((timeInServer % (1000 * 60 * 60)) / (1000 * 60));

	return {
		joinedDate,
		timeInServer: {
			total: timeInServer,
			days,
			hours,
			minutes,
			formatted: `${days} days, ${hours} hours, ${minutes} minutes`
		}
	};
}

export async function getAllUsersServerTime(): Promise<UserServerTime[]> {
	if (!database.isInitialized) {
		await database.initialize();
	}

	const users = await User.find({
		relations: ['activity']
	});

	return users
		.map((user) => {
			if (!user.activity || !user.activity.joinedServer) {
				return {
					userId: user.userId,
					username: user.username,
					joinedDate: null,
					timeInServer: null
				};
			}

			const joinedDate = user.activity.joinedServer;
			const now = new Date();
			const timeInServer = now.getTime() - joinedDate.getTime();
			const days = Math.floor(timeInServer / (1000 * 60 * 60 * 24));

			return {
				userId: user.userId,
				username: user.username,
				joinedDate,
				timeInServer: {
					total: timeInServer,
					days,
					formatted: `${days} days`
				}
			};
		})
		.sort((a, b) => {
			if (!a.timeInServer && !b.timeInServer) return 0;
			if (!a.timeInServer) return 1;
			if (!b.timeInServer) return -1;
			return b.timeInServer.total - a.timeInServer.total;
		});
}

export async function getRankStatistics(roleId: string) {
	if (!database.isInitialized) {
		await database.initialize();
	}

	const allRankRecords = await UserRankHistory.find({
		where: { roleId },
		relations: ['user']
	});

	const activeRecords = allRankRecords.filter((record) => record.isActive);
	const inactiveRecords = allRankRecords.filter((record) => !record.isActive);

	let averageTimeInRank = 0;
	if (inactiveRecords.length > 0) {
		const totalTime = inactiveRecords.reduce((sum, record) => sum + record.getDurationInRole(), 0);
		averageTimeInRank = totalTime / inactiveRecords.length;
	}

	let longestServing = null;
	if (activeRecords.length > 0) {
		longestServing = activeRecords.reduce((longest, current) => {
			return current.receivedAt < longest.receivedAt ? current : longest;
		});
	}

	return {
		totalEverHeld: allRankRecords.length,
		currentlyHolding: activeRecords.length,
		totalWhoLeft: inactiveRecords.length,
		averageTimeInRank: Math.floor(averageTimeInRank / (1000 * 60 * 60 * 24)),
		longestServing: longestServing
			? {
					user: longestServing.user,
					timeInRank: longestServing.getFormattedDuration(),
					since: longestServing.receivedAt
				}
			: null
	};
}
