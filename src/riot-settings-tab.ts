import { PluginSettingTab, Setting } from 'obsidian';
import type LeagueOfLegendsPlugin from './main';
import { isRiotPlatform, RIOT_PLATFORMS, RIOT_PLATFORM_NAMES } from './riot-settings';

export class RiotSettingsTab extends PluginSettingTab {
	private readonly leaguePlugin: LeagueOfLegendsPlugin;

	constructor(plugin: LeagueOfLegendsPlugin) {
		super(plugin.app, plugin);
		this.leaguePlugin = plugin;
	}

	display(): void {
		const plugin = this.leaguePlugin;
		const { containerEl } = this;
		containerEl.empty();
		new Setting(containerEl).setName('Configuración de cuenta').setHeading();

		new Setting(containerEl)
			.setName('Riot ID')
			.setDesc('Introduce tu nombre de juego y etiqueta, por ejemplo nombre#euw.')
			.addText((text) =>
				text
					.setPlaceholder('Nombre#tag')
					.setValue(plugin.settings.riotId)
					.onChange(async (value) => {
						plugin.settings.riotId = value;
						await plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Región de la cuenta')
			.setDesc('Selecciona el servidor donde juegas; se usará la ruta regional correspondiente.')
			.addDropdown((dropdown) => {
				for (const platform of RIOT_PLATFORMS) {
					dropdown.addOption(platform, RIOT_PLATFORM_NAMES[platform]);
				}
				dropdown
					.setValue(plugin.settings.platform)
					.onChange(async (value) => {
						if (isRiotPlatform(value)) {
							plugin.settings.platform = value;
							await plugin.saveSettings();
						}
					});
			});

		new Setting(containerEl)
			.setName('Clave de API')
			.setDesc(
				'Se guarda en los datos locales del plugin y nunca se añade a las notas. Las claves de desarrollo caducan cada 24 horas.',
			)
			.addText((text) => {
				text.inputEl.type = 'password';
				text
					.setValue(plugin.settings.riotApiKey)
					.onChange(async (value) => {
						plugin.settings.riotApiKey = value.trim();
						await plugin.saveSettings();
					});
			});

		containerEl.createEl('p', {
			text: 'Obtén o renueva tu clave en developer.riotgames.com. No compartas tu clave ni distribuyas una copia que la incluya.',
			cls: 'setting-item-description',
		});
	}
}
