/**
 * Simple queue changes watcher for logging
 */
export class QueueWatcher {
	shuffled(guildId: string): void {
		console.log(`[Queue] ${guildId}: Queue shuffled`);
	}

	tracksAdd(guildId: string, tracks: any[], position: number): void {
		console.log(`[Queue] ${guildId}: ${tracks.length} track(s) added at position #${position}`);
	}

	tracksRemoved(guildId: string, tracks: any[], position: number): void {
		console.log(`[Queue] ${guildId}: ${tracks.length} track(s) removed from position #${position}`);
	}
}
