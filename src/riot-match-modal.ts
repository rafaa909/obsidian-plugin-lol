import { App, Modal } from 'obsidian';
import type { RankedMatchLookup } from './riot-api';
import type { RiotPlatform } from './riot-settings';

export class RiotMatchModal extends Modal {
	constructor(
		app: App,
		private readonly lookup: RankedMatchLookup,
		private readonly platform: RiotPlatform,
	) {
		super(app);
	}

	onOpen(): void {
		this.contentEl.empty();
		this.titleEl.setText('Partidas clasificatorias solo/duo recientes');

		const { account, matchIds } = this.lookup;
		this.contentEl.createEl('p', {
			text: `${account.gameName}#${account.tagLine} · Región ${this.platform}`,
		});
		this.contentEl.createEl('p', {
			text: `PUUID: ${account.puuid}`,
			cls: 'lol-match-puuid',
		});

		if (matchIds.length === 0) {
			this.contentEl.createEl('p', {
				text: 'No se encontraron partidas clasificatorias solo/duo recientes.',
			});
			return;
		}

		this.contentEl.createEl('p', {
			text: `Se encontraron ${matchIds.length} partidas recientes (como máximo 20).`,
		});
		const list = this.contentEl.createEl('ul', { cls: 'lol-match-id-list' });
		for (const matchId of matchIds) {
			list.createEl('li').createEl('code', { text: matchId });
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
