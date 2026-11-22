import { App, Editor, Modal, Notice } from 'obsidian';
import { loadRuneIconDataUrl, RUNE_IMAGE_CDN, type Rune, type RuneStyle } from './rune-data';

interface RuneSelection {
	row: number;
	rune: Rune;
}

export interface StatShard {
	id: string;
	name: string;
	icon: string;
}

export interface RunePageSelection {
	primaryStyle: RuneStyle;
	secondaryStyle: RuneStyle;
	keystoneRune: Rune;
	primaryMinorRunes: [Rune, Rune, Rune];
	secondaryRunes: [RuneSelection, RuneSelection];
	selectedShards: [StatShard, StatShard, StatShard];
}

interface StatShardRow {
	name: string;
	options: StatShard[];
}

const STAT_SHARD_ROWS: StatShardRow[] = [
	{
		name: 'Ofensiva',
		options: [
			{
				id: 'adaptive-force',
				name: 'Fuerza adaptable',
				icon: 'perk-images/StatMods/StatModsAdaptiveForceIcon.png',
			},
			{
				id: 'attack-speed',
				name: 'Velocidad de ataque',
				icon: 'perk-images/StatMods/StatModsAttackSpeedIcon.png',
			},
			{
				id: 'ability-haste',
				name: 'Aceleración de habilidades',
				icon: 'perk-images/StatMods/StatModsCDRScalingIcon.png',
			},
		],
	},
	{
		name: 'Flex',
		options: [
			{
				id: 'adaptive-force',
				name: 'Fuerza adaptable',
				icon: 'perk-images/StatMods/StatModsAdaptiveForceIcon.png',
			},
			{
				id: 'movement-speed',
				name: 'Velocidad de movimiento',
				icon: 'perk-images/StatMods/StatModsMovementSpeedIcon.png',
			},
			{
				id: 'health-scaling',
				name: 'Vida progresiva',
				icon: 'perk-images/StatMods/StatModsHealthScalingIcon.png',
			},
		],
	},
	{
		name: 'Defensa',
		options: [
			{
				id: 'health-scaling',
				name: 'Vida progresiva',
				icon: 'perk-images/StatMods/StatModsHealthScalingIcon.png',
			},
			{
				id: 'tenacity',
				name: 'Tenacidad y resistencia a ralentizaciones',
				icon: 'perk-images/StatMods/StatModsTenacityIcon.png',
			},
			{
				id: 'health',
				name: 'Vida',
				icon: 'perk-images/StatMods/StatModsHealthPlusIcon.png',
			},
		],
	},
];

export class RuneGridModal extends Modal {
	private readonly editor: Editor;
	private readonly styles: RuneStyle[];
	private primaryStyle: RuneStyle;
	private secondaryStyle: RuneStyle;
	private keystoneRune: Rune;
	private primaryMinorRunes: [Rune, Rune, Rune];
	private secondaryRunes: [RuneSelection, RuneSelection];
	private selectedShards: [StatShard, StatShard, StatShard];
	private readonly onSave?: (output: string) => void;

	constructor(
		app: App,
		editor: Editor,
		styles: RuneStyle[],
		selection?: RunePageSelection,
		onSave?: (output: string) => void,
	) {
		super(app);
		this.editor = editor;
		this.styles = styles;
		this.onSave = onSave;

		const primaryStyle = selection?.primaryStyle ?? styles[0];
		if (!primaryStyle) {
			throw new Error('No hay ramas de runas disponibles.');
		}

		const secondaryStyle =
			selection?.secondaryStyle ?? styles.find((style) => style.id !== primaryStyle.id);
		if (!secondaryStyle) {
			throw new Error('No hay una rama secundaria disponible.');
		}

		this.primaryStyle = primaryStyle;
		this.secondaryStyle = secondaryStyle;
		this.keystoneRune = selection?.keystoneRune ?? firstRune(primaryStyle, 0);
		this.primaryMinorRunes = selection?.primaryMinorRunes ?? [
			firstRune(primaryStyle, 1),
			firstRune(primaryStyle, 2),
			firstRune(primaryStyle, 3),
		];
		this.secondaryRunes = selection?.secondaryRunes ?? [
			{ row: 1, rune: firstRune(secondaryStyle, 1) },
			{ row: 2, rune: firstRune(secondaryStyle, 2) },
		];
		this.selectedShards = selection?.selectedShards ?? [
			firstShard(0),
			firstShard(1),
			firstShard(2),
		];
	}

	onOpen(): void {
		this.modalEl.classList.add('lol-rune-modal');
		this.titleEl.setText(this.onSave ? 'Editar página de runas' : 'Crear página de runas');
		this.renderGrid();
	}

	private renderGrid(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl('p', {
			text: this.onSave
				? 'Edita las runas de esta página.'
				: 'Selecciona los iconos para configurar tu página de runas.',
			cls: 'lol-rune-help',
		});

		const grid = contentEl.createDiv({ cls: 'lol-rune-builder' });
		const primaryPanel = grid.createDiv({ cls: 'lol-rune-panel' });
		const secondaryPanel = grid.createDiv({ cls: 'lol-rune-panel' });

		this.renderStylePicker(
			primaryPanel,
			'Rama principal',
			this.styles,
			this.primaryStyle.id,
			'primary',
			(style) => this.setPrimaryStyle(style),
		);
		this.renderRuneRow(
			primaryPanel,
			'Runa clave',
			getRuneSlot(this.primaryStyle, 0),
			this.keystoneRune.id,
			'primary',
			(rune) => {
				this.keystoneRune = rune;
				this.renderGrid();
			},
		);

		for (let row = 1; row <= 3; row++) {
			const selectedRune = this.primaryMinorRunes[row - 1];
			if (!selectedRune) {
				throw new Error(`Falta la runa principal de la fila ${row}.`);
			}
			this.renderRuneRow(
				primaryPanel,
				`Fila ${row}`,
				getRuneSlot(this.primaryStyle, row),
				selectedRune.id,
				'primary',
				(rune) => {
					this.setPrimaryMinorRune(row - 1, rune);
					this.renderGrid();
				},
			);
		}

		this.renderStylePicker(
			secondaryPanel,
			'Rama secundaria',
			this.styles.filter((style) => style.id !== this.primaryStyle.id),
			this.secondaryStyle.id,
			'secondary',
			(style) => this.setSecondaryStyle(style),
		);
		secondaryPanel.createEl('p', {
			text: 'Elige dos runas de filas diferentes.',
			cls: 'lol-rune-help',
		});
		for (let row = 1; row <= 3; row++) {
			const selectedRune = this.secondaryRunes.find((selection) => selection.row === row);
			this.renderRuneRow(
				secondaryPanel,
				`Fila ${row}`,
				getRuneSlot(this.secondaryStyle, row),
				selectedRune?.rune.id,
				'secondary',
				(rune) => this.setSecondaryRune(row, rune),
			);
		}

		secondaryPanel.createEl('h3', {
			text: 'Fragmentos',
			cls: 'lol-rune-section-heading',
		});
		STAT_SHARD_ROWS.forEach((row, index) => {
			const selectedShard = this.selectedShards[index];
			if (!selectedShard) {
				throw new Error(`Falta el fragmento de ${row.name}.`);
			}
			this.renderIconRow(
				secondaryPanel,
				row.name,
				row.options.map((shard) => ({
					name: shard.name,
					icon: shard.icon,
					id: shard.id,
				})),
				selectedShard.id,
				'shard',
				(shardId) => this.setShard(index, shardId),
			);
		});

		const actions = contentEl.createDiv({ cls: 'lol-rune-actions' });
		const insertButton = actions.createEl('button', {
			text: this.onSave ? 'Guardar cambios' : 'Insertar página',
			cls: 'mod-cta',
			attr: { type: 'button' },
		});
		insertButton.addEventListener('click', () => this.insertRunePage());

		const cancelButton = actions.createEl('button', {
			text: 'Cancelar',
			attr: { type: 'button' },
		});
		cancelButton.addEventListener('click', () => this.close());
	}

	private renderStylePicker(
		parent: HTMLElement,
		label: string,
		styles: RuneStyle[],
		selectedStyleId: number,
		variant: 'primary' | 'secondary',
		onSelect: (style: RuneStyle) => void,
	): void {
		parent.createEl('h3', {
			text: label,
			cls: 'lol-rune-section-heading',
		});
		const row = parent.createDiv({ cls: 'lol-rune-icon-row lol-rune-style-row' });
		for (const style of styles) {
			this.renderIconButton(
				row,
				style.name,
				style.icon,
				style.id === selectedStyleId,
				variant,
				() => onSelect(style),
			);
		}
	}

	private renderRuneRow(
		parent: HTMLElement,
		label: string,
		runes: Rune[],
		selectedRuneId: number | undefined,
		variant: 'primary' | 'secondary',
		onSelect: (rune: Rune) => void,
	): void {
		parent.createEl('h4', { text: label, cls: 'lol-rune-row-heading' });
		const row = parent.createDiv({ cls: 'lol-rune-icon-row' });
		for (const rune of runes) {
			this.renderIconButton(
				row,
				rune.name,
				rune.icon,
				rune.id === selectedRuneId,
				variant,
				() => onSelect(rune),
			);
		}
	}

	private renderIconRow(
		parent: HTMLElement,
		label: string,
		options: Array<{ name: string; icon: string; id: string }>,
		selectedId: string,
		variant: 'shard',
		onSelect: (id: string) => void,
	): void {
		parent.createEl('h4', { text: label, cls: 'lol-rune-row-heading' });
		const row = parent.createDiv({ cls: 'lol-rune-icon-row' });
		for (const option of options) {
			this.renderIconButton(
				row,
				option.name,
				option.icon,
				option.id === selectedId,
				variant,
				() => onSelect(option.id),
			);
		}
	}

	private renderIconButton(
		parent: HTMLElement,
		name: string,
		icon: string,
		selected: boolean,
		variant: 'primary' | 'secondary' | 'shard',
		onSelect: () => void,
	): void {
		const button = parent.createEl('button', {
			cls: `lol-rune-icon-button lol-rune-${variant}${selected ? ' is-selected' : ''}`,
			attr: {
				type: 'button',
				title: name,
				'aria-label': name,
				'aria-pressed': String(selected),
			},
		});
		const image = button.createEl('img', {
			attr: {
				alt: '',
				'aria-hidden': 'true',
			},
		});
		button.classList.add('is-loading');
		void loadRuneIconDataUrl(icon)
			.then((dataUrl) => {
				if (image.isConnected) {
					image.src = dataUrl;
					button.classList.remove('is-loading');
				}
			})
			.catch((error: unknown) => {
				console.error(`No se pudo cargar el icono de ${name}.`, error);
				if (button.isConnected) {
					button.classList.remove('is-loading');
					button.classList.add('is-unavailable');
				}
			});
		button.addEventListener('click', onSelect);
	}

	private setPrimaryStyle(style: RuneStyle): void {
		this.primaryStyle = style;
		this.keystoneRune = firstRune(style, 0);
		this.primaryMinorRunes = [
			firstRune(style, 1),
			firstRune(style, 2),
			firstRune(style, 3),
		];

		if (this.secondaryStyle.id === style.id) {
			const alternative = this.styles.find((option) => option.id !== style.id);
			if (!alternative) {
				throw new Error('No hay otra rama secundaria disponible.');
			}
			this.resetSecondaryStyle(alternative);
		}
		this.renderGrid();
	}

	private setSecondaryStyle(style: RuneStyle): void {
		this.resetSecondaryStyle(style);
		this.renderGrid();
	}

	private resetSecondaryStyle(style: RuneStyle): void {
		this.secondaryStyle = style;
		this.secondaryRunes = [
			{ row: 1, rune: firstRune(style, 1) },
			{ row: 2, rune: firstRune(style, 2) },
		];
	}

	private setPrimaryMinorRune(index: number, rune: Rune): void {
		if (index === 0) {
			this.primaryMinorRunes = [rune, this.primaryMinorRunes[1], this.primaryMinorRunes[2]];
		} else if (index === 1) {
			this.primaryMinorRunes = [this.primaryMinorRunes[0], rune, this.primaryMinorRunes[2]];
		} else if (index === 2) {
			this.primaryMinorRunes = [this.primaryMinorRunes[0], this.primaryMinorRunes[1], rune];
		} else {
			throw new Error(`Fila principal no válida: ${index}.`);
		}
	}

	private setSecondaryRune(row: number, rune: Rune): void {
		const selectedIndex = this.secondaryRunes.findIndex(
			(selection) => selection.row === row,
		);
		if (selectedIndex === 0) {
			this.secondaryRunes = [{ row, rune }, this.secondaryRunes[1]];
		} else if (selectedIndex === 1) {
			this.secondaryRunes = [this.secondaryRunes[0], { row, rune }];
		} else {
			this.secondaryRunes = [this.secondaryRunes[1], { row, rune }];
		}
		this.renderGrid();
	}

	private setShard(index: number, shardId: string): void {
		const shard = STAT_SHARD_ROWS[index]?.options.find((option) => option.id === shardId);
		if (!shard) {
			throw new Error(`No se encontró el fragmento ${shardId}.`);
		}

		if (index === 0) {
			this.selectedShards = [shard, this.selectedShards[1], this.selectedShards[2]];
		} else if (index === 1) {
			this.selectedShards = [this.selectedShards[0], shard, this.selectedShards[2]];
		} else if (index === 2) {
			this.selectedShards = [this.selectedShards[0], this.selectedShards[1], shard];
		} else {
			throw new Error(`Fila de fragmento no válida: ${index}.`);
		}
		this.renderGrid();
	}

	private insertRunePage(): void {
		const primaryRows = [
			renderPageRow(
				getRuneSlot(this.primaryStyle, 0),
				this.keystoneRune.id,
				'primary',
				true,
			),
			...this.primaryMinorRunes.map((selectedRune, index) => {
				const row = index + 1;
				return renderPageRow(
					getRuneSlot(this.primaryStyle, row),
					selectedRune.id,
					'primary',
				);
			}),
		].join('');
		const secondaryRows = [1, 2, 3]
			.map((row) => {
				const selection = this.secondaryRunes.find((item) => item.row === row);
				return renderPageRow(
					getRuneSlot(this.secondaryStyle, row),
					selection?.rune.id,
					'secondary',
				);
			})
			.join('');
		const shardRows = STAT_SHARD_ROWS.map((row, index) => {
			const selectedShard = this.selectedShards[index];
			if (!selectedShard) {
				throw new Error(`Falta el fragmento de ${row.name}.`);
			}
			return renderPageRow(row.options, selectedShard.id, 'shard');
		}).join('');

		const output = [
			'<div class="lol-rune-page-output">',
			'<div class="lol-rune-page-title">Runas</div>',
			'<div class="lol-rune-page-layout">',
			'<div class="lol-rune-page-column">',
			primaryRows,
			'</div>',
			'<div class="lol-rune-page-column">',
			secondaryRows,
			shardRows,
			'</div>',
			'</div>',
			'</div>',
		].join('\n');

		try {
			if (this.onSave) {
				this.onSave(output);
			} else {
				this.editor.replaceSelection(`\n\n${output}\n\n`);
			}
			this.close();
		} catch (error) {
			console.error('No se pudo guardar la página de runas.', error);
			new Notice('No se pudo guardar la página de runas.');
		}
	}
}

export function readRunePageSelection(
	element: HTMLElement,
	styles: RuneStyle[],
): RunePageSelection {
	const layout = element.querySelector('.lol-rune-page-layout');
	const columns = layout
		? Array.from(layout.children).filter(
				(child): child is HTMLElement =>
					child.instanceOf(HTMLElement) && child.classList.contains('lol-rune-page-column'),
			)
		: [];
	const primaryColumn = columns[0];
	const secondaryColumn = columns[1];
	if (columns.length !== 2 || !primaryColumn || !secondaryColumn) {
		throw new Error('La página de runas no contiene las dos columnas esperadas.');
	}

	const primaryRows = getPageRows(primaryColumn);
	const secondaryRows = getPageRows(secondaryColumn);
	if (primaryRows.length !== 4 || secondaryRows.length !== 6) {
		throw new Error('La página de runas tiene una estructura no compatible.');
	}

	const primaryStyle = styles.find((style) =>
		style.slots.every((slot, index) => doesRowMatch(primaryRows[index], slot.runes)),
	);
	if (!primaryStyle) {
		throw new Error('No se pudo identificar la rama principal de esta página de runas.');
	}

	const secondaryStyle = styles.find(
		(style) =>
			style.id !== primaryStyle.id &&
			style.slots.slice(1).every((slot, index) =>
				doesRowMatch(secondaryRows[index], slot.runes),
			),
	);
	if (!secondaryStyle) {
		throw new Error('No se pudo identificar la rama secundaria de esta página de runas.');
	}

	const keystoneRune = getSelectedOption(
		getPageRow(primaryRows, 0),
		getRuneSlot(primaryStyle, 0),
	);
	const primaryMinorRunes: [Rune, Rune, Rune] = [
		getSelectedOption(getPageRow(primaryRows, 1), getRuneSlot(primaryStyle, 1)),
		getSelectedOption(getPageRow(primaryRows, 2), getRuneSlot(primaryStyle, 2)),
		getSelectedOption(getPageRow(primaryRows, 3), getRuneSlot(primaryStyle, 3)),
	];

	const selectedSecondaryRunes = secondaryRows
		.slice(0, 3)
		.flatMap((row, index) => {
			if (!row.querySelector('.lol-rune-page-icon.is-selected')) {
				return [];
			}
			const rune = getSelectedOption(row, getRuneSlot(secondaryStyle, index + 1));
			return [{ row: index + 1, rune }];
		});
	const firstSecondaryRune = selectedSecondaryRunes[0];
	const secondSecondaryRune = selectedSecondaryRunes[1];
	if (
		selectedSecondaryRunes.length !== 2 ||
		!firstSecondaryRune ||
		!secondSecondaryRune
	) {
		throw new Error('No se pudieron recuperar las dos runas secundarias seleccionadas.');
	}

	const selectedShardOptions = STAT_SHARD_ROWS.map((row, index) =>
		getSelectedOption(getPageRow(secondaryRows, index + 3), row.options),
	);
	const [offenseShard, flexShard, defenseShard] = selectedShardOptions;
	if (!offenseShard || !flexShard || !defenseShard) {
		throw new Error('No se pudieron recuperar los fragmentos seleccionados.');
	}

	return {
		primaryStyle,
		secondaryStyle,
		keystoneRune,
		primaryMinorRunes,
		secondaryRunes: [firstSecondaryRune, secondSecondaryRune],
		selectedShards: [offenseShard, flexShard, defenseShard],
	};
}

function getPageRows(column: HTMLElement): HTMLElement[] {
	return Array.from(column.children).filter(
		(child): child is HTMLElement =>
			child.instanceOf(HTMLElement) && child.classList.contains('lol-rune-page-row'),
	);
}

function getPageRow(rows: HTMLElement[], index: number): HTMLElement {
	const row = rows[index];
	if (!row) {
		throw new Error(`No se encontró la fila ${index + 1} de la página de runas.`);
	}
	return row;
}

function doesRowMatch(row: HTMLElement | undefined, options: Array<{ icon: string }>): boolean {
	if (!row) {
		return false;
	}
	const icons = Array.from(row.querySelectorAll('.lol-rune-page-icon img')).map((image) =>
		getIconPath(image.getAttribute('src') ?? ''),
	);
	return options.length === icons.length && options.every((option, index) => icons[index] === option.icon);
}

function getSelectedOption<T extends { icon: string }>(row: HTMLElement, options: T[]): T {
	const image = row.querySelector< HTMLImageElement >(
		'.lol-rune-page-icon.is-selected img',
	);
	const icon = image ? getIconPath(image.getAttribute('src') ?? '') : '';
	const option = options.find((candidate) => candidate.icon === icon);
	if (!option) {
		throw new Error('No se pudo recuperar una selección de la página de runas.');
	}
	return option;
}

function getIconPath(src: string): string {
	const marker = '/img/';
	const markerIndex = src.indexOf(marker);
	return markerIndex < 0 ? src : src.slice(markerIndex + marker.length);
}

function firstRune(style: RuneStyle, slotIndex: number): Rune {
	const rune = getRuneSlot(style, slotIndex)[0];
	if (!rune) {
		throw new Error(`La fila ${slotIndex} de ${style.name} no contiene runas.`);
	}
	return rune;
}

function getRuneSlot(style: RuneStyle, slotIndex: number): Rune[] {
	const slot = style.slots[slotIndex];
	if (!slot) {
		throw new Error(`No existe la fila ${slotIndex} de ${style.name}.`);
	}
	return slot.runes;
}

function firstShard(rowIndex: number): StatShard {
	const shard = STAT_SHARD_ROWS[rowIndex]?.options[0];
	if (!shard) {
		throw new Error(`No existe la fila de fragmentos ${rowIndex}.`);
	}
	return shard;
}

function renderPageRow(
	options: Array<{ id: number | string; name: string; icon: string }>,
	selectedId: number | string | undefined,
	variant: 'primary' | 'secondary' | 'shard',
	emphasizeSelected = false,
): string {
	const icons = options
		.map((option) =>
			renderPageIcon(
				option,
				option.id === selectedId,
				variant,
				emphasizeSelected && option.id === selectedId,
			),
		)
		.join('');
	const columnsClass = options.length === 4 ? ' lol-rune-page-icons-four' : '';
	const shardClass = variant === 'shard' ? ' lol-rune-page-row-shard' : '';
	const shardIconsClass = variant === 'shard' ? ' lol-rune-page-icons-shard' : '';
	return `<div class="lol-rune-page-row${shardClass}"><div class="lol-rune-page-icons${columnsClass}${shardIconsClass}">${icons}</div></div>`;
}

function renderPageIcon(
	option: { name: string; icon: string },
	selected: boolean,
	variant: 'primary' | 'secondary' | 'shard',
	emphasized = false,
): string {
	const classes = [
		'lol-rune-page-icon',
		`lol-rune-page-icon-${variant}`,
		selected ? 'is-selected' : '',
		emphasized ? 'lol-rune-page-icon-keystone' : '',
	]
		.filter(Boolean)
		.join(' ');
	const name = escapeHtml(option.name);
	const icon = escapeHtml(`${RUNE_IMAGE_CDN}/${option.icon}`);
	return `<span class="${classes}" title="${name}"><img src="${icon}" alt="${name}"></span>`;
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/'/g, '&#39;');
}
