import { Notice, Plugin } from 'obsidian';
import { openChampionAbilityPicker } from './champion-ability-picker';
import { openChampionPicker } from './champion-picker';
import { openItemPicker } from './item-picker';
import { openSummonerPicker } from './summoner-picker';
import { openRuneIconPicker } from './rune-icon-picker';
import { openRunePicker, registerRunePageEditing } from './rune-picker';
import { findRecentRankedSoloMatches } from './riot-api';
import { RiotMatchModal } from './riot-match-modal';
import {
	DEFAULT_SETTINGS,
	normalizeLeaguePluginSettings,
	type LeaguePluginSettings,
} from './riot-settings';
import { RiotSettingsTab } from './riot-settings-tab';

export default class LeagueOfLegendsPlugin extends Plugin {
	settings: LeaguePluginSettings = DEFAULT_SETTINGS;
	private isLookingUpRankedMatches = false;

	async onload() {
		this.settings = normalizeLeaguePluginSettings(await this.loadData());
		this.addSettingTab(new RiotSettingsTab(this));
		registerRunePageEditing(this);
		this.addCommand({
			id: 'list-recent-ranked-solo-matches',
			name: 'Consultar partidas clasificatorias solo/duo recientes',
			callback: () => {
				void this.showRecentRankedSoloMatches();
			},
		});
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor) => {
				menu.addItem((item) =>
					item
						.setTitle('Insertar icono de campeón')
						.setIcon('image')
						.setSection('insert')
						.onClick(() => {
							void openChampionPicker(this.app, editor);
						}),
				);
				menu.addItem((item) =>
					item
						.setTitle('Insertar habilidad de campeón')
						.setIcon('zap')
						.setSection('insert')
						.onClick(() => {
							void openChampionAbilityPicker(this.app, editor);
						}),
				);
				menu.addItem((item) =>
					item
						.setTitle('Insertar icono de objeto')
						.setIcon('package')
						.setSection('insert')
						.onClick(() => {
							void openItemPicker(this.app, editor);
						}),
				);
				menu.addItem((item) =>
					item
						.setTitle('Insertar icono de hechizo de invocador')
						.setIcon('zap')
						.setSection('insert')
						.onClick(() => {
							void openSummonerPicker(this.app, editor);
						}),
				);
				menu.addItem((item) =>
					item
						.setTitle('Insertar icono de runa')
						.setIcon('image')
						.setSection('insert')
						.onClick(() => {
							void openRuneIconPicker(this.app, editor);
						}),
				);
				menu.addItem((item) =>
					item
						.setTitle('Configurar runas')
						.setIcon('sparkles')
						.setSection('insert')
						.onClick(() => {
							void openRunePicker(this.app, editor);
						}),
				);
			}),
		);
	}

	async saveSettings(): Promise<void> {
		try {
			await this.saveData(this.settings);
		} catch (error) {
			console.error('No se pudieron guardar los ajustes de Riot.', error);
			new Notice('No se pudieron guardar los ajustes.');
		}
	}

	private async showRecentRankedSoloMatches(): Promise<void> {
		if (this.isLookingUpRankedMatches) {
			new Notice('La consulta de partidas ya está en curso.');
			return;
		}

		this.isLookingUpRankedMatches = true;
		try {
			const lookup = await findRecentRankedSoloMatches(this.settings);
			new RiotMatchModal(this.app, lookup, this.settings.platform).open();
		} catch (error) {
			console.error('No se pudieron consultar las partidas recientes de Riot.', error);
			new Notice(error instanceof Error ? error.message : 'No se pudieron consultar las partidas.');
		} finally {
			this.isLookingUpRankedMatches = false;
		}
	}
}