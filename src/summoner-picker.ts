import { App, Editor, Notice, requestUrl } from 'obsidian';
import { DATA_DRAGON_CDN } from './data-dragon';
import { NameSuggestModal } from './name-suggest-modal';

const SUMMONER_DATA_URL = `${DATA_DRAGON_CDN}/data/en_US/summoner.json`;
const SPELL_IMAGE_URL = `${DATA_DRAGON_CDN}/img/spell`;

interface SummonerSpell {
	id: string;
	name: string;
	image: string;
}

const SUMMONER_SPELLS = [
	{ id: 'SummonerHeal', name: 'Heal' },
	{ id: 'SummonerHaste', name: 'Ghost' },
	{ id: 'SummonerSmite', name: 'Smite' },
	{ id: 'SummonerBarrier', name: 'Barrier' },
	{ id: 'SummonerExhaust', name: 'Exhaust' },
	{ id: 'SummonerMana', name: 'Clarity' },
	{ id: 'SummonerSnowball', name: 'Snow Ball' },
	{ id: 'SummonerFlash', name: 'Flash' },
	{ id: 'SummonerTeleport', name: 'Teleport' },
	{ id: 'SummonerBoost', name: 'Cleanse' },
	{ id: 'SummonerDot', name: 'Ignite' },
];

let cachedSummonerSpells: SummonerSpell[] | undefined;

export async function openSummonerPicker(app: App, editor: Editor): Promise<void> {
	try {
		const spells = await loadSummonerSpells();
		new NameSuggestModal(app, spells, 'Busca un hechizo...', (spell) => {
			editor.replaceSelection(`![${spell.name}](${SPELL_IMAGE_URL}/${spell.image})`);
		}).open();
	} catch (error) {
		console.error('No se pudo cargar la lista de hechizos de invocador.', error);
		new Notice('No se pudo cargar la lista de hechizos de invocador. Comprueba tu conexión a internet.');
	}
}

async function loadSummonerSpells(): Promise<SummonerSpell[]> {
	if (cachedSummonerSpells) {
		return cachedSummonerSpells;
	}

	const response = await requestUrl({ url: SUMMONER_DATA_URL, throw: true });
	const payload: unknown = await response.json;
	cachedSummonerSpells = parseSummonerSpells(payload);
	return cachedSummonerSpells;
}

function parseSummonerSpells(payload: unknown): SummonerSpell[] {
	if (!isRecord(payload) || !isRecord(payload.data)) {
		throw new Error('La respuesta de Data Dragon no contiene datos de hechizos válidos.');
	}

	const data = payload.data;
	return SUMMONER_SPELLS.map(({ id, name }) => {
		const spell = data[id];
		if (!isSummonerSpellData(spell)) {
			throw new Error(`No se encontró el hechizo de invocador ${id}.`);
		}

		return { id, name, image: spell.image.full };
	});
}

function isSummonerSpellData(value: unknown): value is { image: { full: string } } {
	return (
		isRecord(value) &&
		isRecord(value.image) &&
		typeof value.image.full === 'string' &&
		value.image.full.length > 0
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
