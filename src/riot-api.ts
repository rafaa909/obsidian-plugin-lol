import { requestUrl } from 'obsidian';
import type { LeaguePluginSettings, RiotPlatform } from './riot-settings';

const RANKED_SOLO_QUEUE_ID = 420;
const RECENT_MATCH_COUNT = 20;

type RegionalRouting = 'americas' | 'asia' | 'europe' | 'sea';

const REGIONAL_ROUTING: Record<RiotPlatform, RegionalRouting> = {
	BR1: 'americas',
	EUN1: 'europe',
	EUW1: 'europe',
	JP1: 'asia',
	KR: 'asia',
	LA1: 'americas',
	LA2: 'americas',
	NA1: 'americas',
	OC1: 'sea',
	TR1: 'europe',
	RU: 'europe',
	PH2: 'sea',
	SG2: 'sea',
	TH2: 'sea',
	TW2: 'sea',
	VN2: 'sea',
};

export interface RiotAccount {
	puuid: string;
	gameName: string;
	tagLine: string;
}

export interface RankedMatchLookup {
	account: RiotAccount;
	matchIds: string[];
}

export class RiotApiError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'RiotApiError';
	}
}

export async function findRecentRankedSoloMatches(
	settings: LeaguePluginSettings,
): Promise<RankedMatchLookup> {
	const { gameName, tagLine } = parseRiotId(settings.riotId);
	const apiKey = settings.riotApiKey.trim();
	if (!apiKey) {
		throw new RiotApiError('Configura tu API key de Riot en los ajustes del plugin.');
	}

	const routing = REGIONAL_ROUTING[settings.platform];
	const account = await getAccount(gameName, tagLine, routing, apiKey);
	const matchIds = await getRankedSoloMatchIds(account.puuid, routing, apiKey);
	return { account, matchIds };
}

function parseRiotId(riotId: string): { gameName: string; tagLine: string } {
	const separator = riotId.indexOf('#');
	if (separator <= 0 || separator === riotId.length - 1) {
		throw new RiotApiError('Introduce el Riot ID con el formato Nombre#TAG.');
	}

	const gameName = riotId.slice(0, separator).trim();
	const tagLine = riotId.slice(separator + 1).trim();
	if (!gameName || !tagLine || tagLine.includes('#')) {
		throw new RiotApiError('Introduce el Riot ID con el formato Nombre#TAG.');
	}

	return { gameName, tagLine };
}

async function getAccount(
	gameName: string,
	tagLine: string,
	routing: RegionalRouting,
	apiKey: string,
): Promise<RiotAccount> {
	const url =
		`https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/` +
		`${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
	const payload: unknown = await riotGet(url, apiKey);
	if (
		!isRecord(payload) ||
		typeof payload.puuid !== 'string' ||
		typeof payload.gameName !== 'string' ||
		typeof payload.tagLine !== 'string'
	) {
		throw new RiotApiError('Riot devolvió datos de cuenta con un formato no válido.');
	}

	return {
		puuid: payload.puuid,
		gameName: payload.gameName,
		tagLine: payload.tagLine,
	};
}

async function getRankedSoloMatchIds(
	puuid: string,
	routing: RegionalRouting,
	apiKey: string,
): Promise<string[]> {
	const query = new URLSearchParams({
		start: '0',
		count: String(RECENT_MATCH_COUNT),
		queue: String(RANKED_SOLO_QUEUE_ID),
	});
	const url =
		`https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/` +
		`${encodeURIComponent(puuid)}/ids?${query.toString()}`;
	const payload: unknown = await riotGet(url, apiKey);
	if (!Array.isArray(payload) || !payload.every((matchId) => typeof matchId === 'string')) {
		throw new RiotApiError('Riot devolvió una lista de partidas con un formato no válido.');
	}

	return payload;
}

async function riotGet(url: string, apiKey: string): Promise<unknown> {
	let response;
	try {
		response = await requestUrl({
			url,
			headers: { 'X-Riot-Token': apiKey },
			throw: false,
		});
	} catch (error) {
		throw new RiotApiError(
			`No se pudo conectar con Riot API. Comprueba tu conexión e inténtalo de nuevo. (${getErrorMessage(error)})`,
		);
	}

	if (response.status < 200 || response.status >= 300) {
		throw new RiotApiError(getHttpErrorMessage(response.status, response.headers));
	}

	return response.json;
}

function getHttpErrorMessage(status: number, headers: Record<string, string>): string {
	switch (status) {
		case 401:
			return 'Riot rechazó la API key (401). Comprueba que sea válida y no haya caducado.';
		case 403:
			return 'Riot denegó el acceso (403). Comprueba la API key y los permisos de la API.';
		case 404:
			return 'No se encontró la cuenta o los datos solicitados (404). Revisa el Riot ID y la región.';
		case 429: {
			const retryAfter = headers['Retry-After'] ?? headers['retry-after'];
			return retryAfter
				? `Riot limitó las peticiones (429). Inténtalo de nuevo en ${retryAfter} segundos.`
				: 'Riot limitó las peticiones (429). Espera un momento antes de volver a intentarlo.';
		}
		default:
			return `Riot API respondió con el error HTTP ${status}. Inténtalo de nuevo más tarde.`;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : 'error de red desconocido';
}
