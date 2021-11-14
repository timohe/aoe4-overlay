export interface PlayerApiResponse {
	count: number;
	items: Array<PlayerStats>;
}

export interface PlayerStats {
	gameId: string;
	userId: string;
	rlUserId: number;
	userName: string;
	avatarUrl: string;
	playerNumber: string;
	elo: number;
	eloRating: number;
	rank: number;
	region: number;
	wins: number;
	winPercent: number;
	losses: number;
	winStreak: number;
}
