import { Plugin } from 'obsidian';
import { openChampionPicker } from './champion-picker';
import { openItemPicker } from './item-picker';

export default class LeagueOfLegendsPlugin extends Plugin {
	async onload() {
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor) => {
				menu.addItem((item) =>
					item
						.setTitle('Insertar icono de campeón')
						.setIcon('image')
						.onClick(() => {
							void openChampionPicker(this.app, editor);
						}),
				);
				menu.addItem((item) =>
					item
						.setTitle('Insertar icono de objeto')
						.setIcon('package')
						.onClick(() => {
							void openItemPicker(this.app, editor);
						}),
				);
			}),
		);
	}
}