import { App, Editor, Notice, requestUrl } from 'obsidian';
import { Champion, loadChampions } from './champion-picker';
import { DATA_DRAGON_CDN } from './data-dragon';
import { NameSuggestModal } from './name-suggest-modal';

interface ChampionAbility {
	name: string;
	imageUrl: string;
}

interface AbilityData {
	name: string;
	image: {
		full: string;
	};
}

const CHAMPION_DETAILS_URL = `${DATA_DRAGON_CDN}/data/en_US/champion`;
const CHAMPION_PASSIVE_IMAGE_URL = `${DATA_DRAGON_CDN}/img/passive`;
const CHAMPION_SPELL_IMAGE_URL = `${DATA_DRAGON_CDN}/img/spell`;
const ABILITY_KEYS = ['Q', 'W', 'E', 'R'];
const cachedAbilities = new Map<string, ChampionAbility[]>();

export async function openChampionAbilityPicker(app: App, editor: Editor): Promise<void> {
	try {
		const champions = await loadChampions();
		new NameSuggestModal(app, champions, 'Busca un campeón...', (champion) => {
			void openAbilityPicker(app, editor, champion);
		}).open();
	} catch (error) {
		console.error('No se pudo cargar la lista de campeones.', error);
		new Notice('No se pudo cargar la lista de campeones. Comprueba tu conexión a internet.');
	}
}

async function openAbilityPicker(
	app: App,
	editor: Editor,
	champion: Champion,
): Promise<void> {
	try {
		const abilities = await loadChampionAbilities(champion.id);
		new NameSuggestModal(
			app,
			abilities,
			`Busca una habilidad de ${champion.name}...`,
			(ability) => {
				editor.replaceSelection(
					`![${champion.name} - ${ability.name}](${ability.imageUrl})`,
				);
			},
		).open();
	} catch (error) {
		console.error(`No se pudieron cargar las habilidades de ${champion.name}.`, error);
		new Notice(
			`No se pudieron cargar las habilidades de ${champion.name}. Comprueba tu conexión a internet.`,
		);
	}
}

async function loadChampionAbilities(championId: string): Promise<ChampionAbility[]> {
	const cached = cachedAbilities.get(championId);
	if (cached) {
		return cached;
	}

	const response = await requestUrl({
		url: `${CHAMPION_DETAILS_URL}/${championId}.json`,
		throw: true,
	});
	const abilities = parseChampionAbilities(response.json, championId);
	cachedAbilities.set(championId, abilities);
	return abilities;
}

function parseChampionAbilities(payload: unknown, championId: string): ChampionAbility[] {
	if (!isRecord(payload) || !isRecord(payload.data)) {
		throw new Error('La respuesta de Data Dragon no contiene datos de habilidades válidos.');
	}

	const champion = payload.data[championId];
	if (
		!isRecord(champion) ||
		!isAbilityData(champion.passive) ||
		!Array.isArray(champion.spells) ||
		!champion.spells.every(isAbilityData)
	) {
		throw new Error(`La respuesta de Data Dragon no contiene habilidades válidas para ${championId}.`);
	}

	return [
		{
			name: `Pasiva: ${champion.passive.name}`,
			imageUrl: `${CHAMPION_PASSIVE_IMAGE_URL}/${champion.passive.image.full}`,
		},
		...champion.spells.map((spell, index) => ({
			name: `${ABILITY_KEYS[index] ?? `Habilidad ${index + 1}`}: ${spell.name}`,
			imageUrl: `${CHAMPION_SPELL_IMAGE_URL}/${spell.image.full}`,
		})),
	];
}

function isAbilityData(value: unknown): value is AbilityData {
	return (
		isRecord(value) &&
		typeof value.name === 'string' &&
		isRecord(value.image) &&
		typeof value.image.full === 'string'
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
