import { requestUrl } from 'obsidian';
import { DATA_DRAGON_CDN } from './data-dragon';

const RUNE_DATA_URL = `${DATA_DRAGON_CDN}/data/es_ES/runesReforged.json`;

export const RUNE_IMAGE_CDN = 'https://ddragon.leagueoflegends.com/cdn/img';

const cachedRuneIcons = new Map<string, Promise<string>>();

export interface Rune {
	id: number;
	name: string;
	icon: string;
}

export interface RuneSlot {
	runes: Rune[];
}

export interface RuneStyle {
	id: number;
	name: string;
	icon: string;
	slots: RuneSlot[];
}

let cachedRuneStyles: RuneStyle[] | undefined;

export async function loadRuneStyles(): Promise<RuneStyle[]> {
	if (cachedRuneStyles) {
		return cachedRuneStyles;
	}

	const response = await requestUrl({ url: RUNE_DATA_URL, throw: true });
	const payload: unknown = await response.json;
	cachedRuneStyles = parseRuneStyles(payload);
	return cachedRuneStyles;
}

export function loadRuneIconDataUrl(icon: string): Promise<string> {
	const cached = cachedRuneIcons.get(icon);
	if (cached) {
		return cached;
	}

	const iconUrl = `${RUNE_IMAGE_CDN}/${icon}`;
	const request = requestUrl({ url: iconUrl, throw: true }).then((response) =>
		toDataUrl(response.arrayBuffer),
	);
	cachedRuneIcons.set(icon, request);
	void request.catch(() => {
		cachedRuneIcons.delete(icon);
	});
	return request;
}

function parseRuneStyles(payload: unknown): RuneStyle[] {
	if (!Array.isArray(payload)) {
		throw new Error('La respuesta de Data Dragon no contiene ramas de runas válidas.');
	}

	const styles = payload.filter(isRuneStyle);
	if (styles.length !== payload.length || styles.length < 2) {
		throw new Error('La respuesta de Data Dragon contiene una página de runas no válida.');
	}

	return styles;
}

function isRuneStyle(value: unknown): value is RuneStyle {
	return (
		isRecord(value) &&
		typeof value.id === 'number' &&
		typeof value.name === 'string' &&
		typeof value.icon === 'string' &&
		Array.isArray(value.slots) &&
		value.slots.length === 4 &&
		value.slots.every(isRuneSlot)
	);
}

function isRuneSlot(value: unknown): value is RuneSlot {
	return (
		isRecord(value) &&
		Array.isArray(value.runes) &&
		value.runes.length > 0 &&
		value.runes.every(isRune)
	);
}

function isRune(value: unknown): value is Rune {
	return (
		isRecord(value) &&
		typeof value.id === 'number' &&
		typeof value.name === 'string' &&
		typeof value.icon === 'string'
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toDataUrl(data: ArrayBuffer): string {
	const bytes = new Uint8Array(data);
	let binary = '';
	for (let offset = 0; offset < bytes.length; offset += 0x8000) {
		binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
	}
	return `data:image/png;base64,${window.btoa(binary)}`;
}
