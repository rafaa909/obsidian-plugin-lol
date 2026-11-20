import { App, Editor, Notice, requestUrl } from 'obsidian';
import { DATA_DRAGON_CDN } from './data-dragon';
import { NameSuggestModal } from './name-suggest-modal';

const ITEM_IMAGE_URL = `${DATA_DRAGON_CDN}/img/item`;

interface GameItem {
	id: string;
	name: string;
}

type ItemLanguageCode = 'es_ES' | 'en_US';

interface ItemLanguage {
	code: ItemLanguageCode;
	name: string;
}

const ITEM_LANGUAGES: ItemLanguage[] = [
	{ code: 'es_ES', name: 'Español' },
	{ code: 'en_US', name: 'English' },
];

const cachedItems: Partial<Record<ItemLanguageCode, GameItem[]>> = {};

export function openItemPicker(app: App, editor: Editor): void {
	new NameSuggestModal(app, ITEM_LANGUAGES, 'Elige el idioma...', (language) => {
		void openItemsInLanguage(app, editor, language);
	}).open();
}

async function openItemsInLanguage(
	app: App,
	editor: Editor,
	language: ItemLanguage,
): Promise<void> {
	try {
		const items = await loadItems(language.code);
		new NameSuggestModal(app, items, 'Busca un objeto...', (item) => {
			editor.replaceSelection(`![${item.name}](${ITEM_IMAGE_URL}/${item.id}.png)`);
		}).open();
	} catch (error) {
		console.error(`No se pudo cargar la lista de objetos en ${language.name}.`, error);
		new Notice(
			`No se pudo cargar la lista de objetos en ${language.name}. Comprueba tu conexión a internet.`,
		);
	}
}

async function loadItems(language: ItemLanguageCode): Promise<GameItem[]> {
	const cached = cachedItems[language];
	if (cached) {
		return cached;
	}

	const dataUrl = `${DATA_DRAGON_CDN}/data/${language}/item.json`;
	const response = await requestUrl({ url: dataUrl, throw: true });
	const payload: unknown = await response.json;
	const items = parseItems(payload);
	cachedItems[language] = items;
	return items;
}

function parseItems(payload: unknown): GameItem[] {
	if (!isRecord(payload) || !isRecord(payload.data)) {
		throw new Error('La respuesta de Data Dragon no contiene datos de objetos válidos.');
	}

	const itemsByName = new Map<string, GameItem>();
	for (const [id, value] of Object.entries(payload.data)) {
		if (/^\d+$/.test(id) && isGameItem(value)) {
			const name = getDisplayName(value.name);
			if (!name) {
				continue;
			}

			const key = name.toLocaleLowerCase();
			const existing = itemsByName.get(key);
			if (!existing || Number(id) < Number(existing.id)) {
				itemsByName.set(key, { id, name });
			}
		}
	}

	const items = [...itemsByName.values()];
	if (items.length === 0) {
		throw new Error('La respuesta de Data Dragon no contiene objetos válidos.');
	}

	return items.sort((first, second) => first.name.localeCompare(second.name));
}

function isGameItem(value: unknown): value is { name: string } {
	return (
		typeof value === 'object' &&
		value !== null &&
		'name' in value &&
		typeof value.name === 'string' &&
		value.name.trim().length > 0
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getDisplayName(name: string): string {
	const primaryName = name.split(/<br\s*\/?>/i, 1)[0] ?? '';
	return primaryName.replace(/<[^>]*>/g, '').trim();
}
