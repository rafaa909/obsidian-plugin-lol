import { App, Editor, Notice, requestUrl } from 'obsidian';
import { DATA_DRAGON_CDN } from './data-dragon';
import { NameSuggestModal } from './name-suggest-modal';

const CHAMPION_DATA_URL = `${DATA_DRAGON_CDN}/data/en_US/champion.json`;
const CHAMPION_IMAGE_URL = `${DATA_DRAGON_CDN}/img/champion`;

export interface Champion {
	id: string;
	name: string;
}

let cachedChampions: Champion[] | undefined;

export async function openChampionPicker(app: App, editor: Editor): Promise<void> {
	try {
		const champions = await loadChampions();
		new NameSuggestModal(
			app,
			champions,
			'Busca un campeón...',
			(champion) =>
				editor.replaceSelection(
					`![${champion.name}](${CHAMPION_IMAGE_URL}/${champion.id}.png)`,
				),
		).open();
	} catch (error) {
		console.error('No se pudo cargar la lista de campeones.', error);
		new Notice('No se pudo cargar la lista de campeones. Comprueba tu conexión a internet.');
	}
}

export async function loadChampions(): Promise<Champion[]> {
	if (cachedChampions) {
		return cachedChampions;
	}

	const response = await requestUrl({ url: CHAMPION_DATA_URL, throw: true });
	const payload: unknown = await response.json;
	cachedChampions = parseChampions(payload);
	return cachedChampions;
}

function parseChampions(payload: unknown): Champion[] {
	if (
		typeof payload !== 'object' ||
		payload === null ||
		!('data' in payload) ||
		typeof payload.data !== 'object' ||
		payload.data === null
	) {
		throw new Error('La respuesta de Data Dragon no contiene datos de campeones válidos.');
	}

	const champions = Object.values(payload.data).filter(isChampion);
	if (champions.length === 0 || champions.length !== Object.keys(payload.data).length) {
		throw new Error('La respuesta de Data Dragon contiene una lista de campeones no válida.');
	}

	return champions.sort((first, second) => first.name.localeCompare(second.name));
}

function isChampion(value: unknown): value is Champion {
	return (
		typeof value === 'object' &&
		value !== null &&
		'id' in value &&
		typeof value.id === 'string' &&
		'name' in value &&
		typeof value.name === 'string'
	);
}
