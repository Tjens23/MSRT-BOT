export {
	handleButton,
	handleEnlistmentModal,
	handleLOAModal,
	handleSupportModal,
	handleTranscriptButton,
	handleCloseTicketButton,
	handleDeleteChannelButton
} from './tickets';

// Re-export user/rank stats
export { getUserServerTime, getAllUsersServerTime, getRankStatistics } from './userStats';
export type { UserServerTime } from './userStats';

export const trimArray = (arr: any, maxLen = 10) => {
	if (arr.length > maxLen) {
		const len = arr.length - maxLen;
		arr = arr.slice(0, maxLen);
		arr.push(`${len} more...`);
	}
	return arr;
};

export function removeDuplicates<T extends Array<T>>(arr: T) {
	return Array.from(new Set(arr));
}

export const capitalise = (string: any) => {
	if (!string || typeof string !== 'string') {
		return '';
	}
	return string
		.split(' ')
		.map((str: any) => str.slice(0, 1).toUpperCase() + str.slice(1))
		.join(' ');
};
