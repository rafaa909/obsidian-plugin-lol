export const RIOT_PLATFORMS = [
	'BR1',
	'EUN1',
	'EUW1',
	'JP1',
	'KR',
	'LA1',
	'LA2',
	'NA1',
	'OC1',
	'TR1',
	'RU',
	'PH2',
	'SG2',
	'TH2',
	'TW2',
	'VN2',
] as const;

export type RiotPlatform = (typeof RIOT_PLATFORMS)[number];

export interface LeaguePluginSettings {
	riotId: string;
	riotApiKey: string;
	platform: RiotPlatform;
}

export const DEFAULT_SETTINGS: LeaguePluginSettings = {
	riotId: '',
	riotApiKey: '',
	platform: 'EUW1',
};

export function isRiotPlatform(value: string): value is RiotPlatform {
	return RIOT_PLATFORMS.some((platform) => platform === value);
}

export function normalizeLeaguePluginSettings(value: unknown): LeaguePluginSettings {
	const stored = isRecord(value) ? value : {};
	const platform = stored.platform;
	return {
		riotId: typeof stored.riotId === 'string' ? stored.riotId : DEFAULT_SETTINGS.riotId,
		riotApiKey:
			typeof stored.riotApiKey === 'string' ? stored.riotApiKey : DEFAULT_SETTINGS.riotApiKey,
		platform: typeof platform === 'string' && isRiotPlatform(platform)
			? platform
			: DEFAULT_SETTINGS.platform,
	};
}

export const RIOT_PLATFORM_NAMES: Record<RiotPlatform, string> = {
	BR1: 'BR1 · Brasil',
	EUN1: 'EUN1 · Europa nordeste',
	EUW1: 'EUW1 · Europa oeste',
	JP1: 'JP1 · Japón',
	KR: 'KR · Corea',
	LA1: 'LA1 · Latinoamérica norte',
	LA2: 'LA2 · Latinoamérica sur',
	NA1: 'NA1 · Norteamérica',
	OC1: 'OC1 · Oceanía',
	TR1: 'TR1 · Turquía',
	RU: 'RU · Rusia',
	PH2: 'PH2 · Filipinas',
	SG2: 'SG2 · Singapur',
	TH2: 'TH2 · Tailandia',
	TW2: 'TW2 · Taiwán',
	VN2: 'VN2 · Vietnam',
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
