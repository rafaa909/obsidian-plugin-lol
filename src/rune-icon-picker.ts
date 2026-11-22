import { App, Editor, Notice } from 'obsidian';
import { loadRuneStyles, RUNE_IMAGE_CDN, type Rune } from './rune-data';
import { NameSuggestModal } from './name-suggest-modal';

export async function openRuneIconPicker(app: App, editor: Editor): Promise<void> {
	try {
		const styles = await loadRuneStyles();
		const runesById = new Map<number, Rune>();
		for (const style of styles) {
			for (const slot of style.slots) {
				for (const rune of slot.runes) {
					runesById.set(rune.id, rune);
				}
			}
		}

		const runes = [...runesById.values()].sort((first, second) =>
			first.name.localeCompare(second.name),
		);
		if (runes.length === 0) {
			throw new Error('Data Dragon no contiene iconos de runas.');
		}

		new NameSuggestModal(app, runes, 'Busca una runa...', (rune) => {
			editor.replaceSelection(`![${rune.name}](${RUNE_IMAGE_CDN}/${rune.icon})`);
		}).open();
	} catch (error) {
		console.error('No se pudo cargar la lista de runas.', error);
		new Notice('No se pudo cargar la lista de runas. Comprueba tu conexión a internet.');
	}
}
