/**
 * Simple Map-based queue store (no Redis needed)
 */
export class MapQueueStore {
	private data = new Map<string, string>();

	async get(guildId: string): Promise<string | null> {
		return this.data.get(`queue_${guildId}`) || null;
	}

	async set(guildId: string, stringifiedData: string): Promise<void> {
		this.data.set(`queue_${guildId}`, stringifiedData);
	}

	async delete(guildId: string): Promise<void> {
		this.data.delete(`queue_${guildId}`);
	}

	async parse(stringifiedData: string): Promise<any> {
		return JSON.parse(stringifiedData);
	}

	async stringify(data: any): Promise<string> {
		return JSON.stringify(data);
	}
}
