import {
	App,
	Editor,
	MarkdownPostProcessorContext,
	MarkdownRenderChild,
	MarkdownView,
	Menu,
	Notice,
	Plugin,
} from 'obsidian';
import { loadRuneStyles, type RuneStyle } from './rune-data';
import { readRunePageSelection, RuneGridModal } from './rune-grid-modal';

interface RunePageEditTarget {
	element: HTMLElement;
	onSave: (output: string) => void;
}

interface RunePageSourceRange {
	start: number;
	end: number;
	line: number;
}

const RUNE_PAGE_OPEN_TAG = '<div class="lol-rune-page-output">';

export async function openRunePicker(
	app: App,
	editor: Editor,
	editTarget?: RunePageEditTarget,
): Promise<void> {
	let styles: RuneStyle[];
	try {
		styles = await loadRuneStyles();
	} catch (error) {
		console.error('No se pudo cargar el configurador de runas.', error);
		new Notice('No se pudo cargar el configurador de runas. Comprueba tu conexión a internet.');
		return;
	}

	try {
		const selection = editTarget
			? readRunePageSelection(editTarget.element, styles)
			: undefined;
		new RuneGridModal(app, editor, styles, selection, editTarget?.onSave).open();
	} catch (error) {
		console.error('No se pudo abrir la página de runas para editarla.', error);
		new Notice('No se pudo leer la página de runas que quieres editar.');
	}
}

export function registerRunePageEditing(plugin: Plugin): void {
	plugin.registerMarkdownPostProcessor((element, context) => {
		const pages = [
			...(element.matches('.lol-rune-page-output') ? [element] : []),
			...Array.from(element.querySelectorAll<HTMLElement>('.lol-rune-page-output')),
		];
		for (const page of pages) {
			context.addChild(new RunePageContextMenu(plugin, context, page));
		}
	});
}

class RunePageContextMenu extends MarkdownRenderChild {
	private readonly handleContextMenu = (event: MouseEvent): void => {
		event.preventDefault();
		new Menu()
			.addItem((item) =>
				item
					.setTitle('Editar página de runas')
					.setIcon('pencil')
					.onClick(() => {
						void this.editPage();
					}),
			)
			.showAtMouseEvent(event);
	};

	constructor(
		private readonly plugin: Plugin,
		private readonly context: MarkdownPostProcessorContext,
		element: HTMLElement,
	) {
		super(element);
	}

	onload(): void {
		this.containerEl.addEventListener('contextmenu', this.handleContextMenu);
	}

	onunload(): void {
		this.containerEl.removeEventListener('contextmenu', this.handleContextMenu);
	}

	private async editPage(): Promise<void> {
		const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view?.file || view.file.path !== this.context.sourcePath) {
			new Notice('Abre la nota que contiene esta página de runas para editarla.');
			return;
		}

		await openRunePicker(this.plugin.app, view.editor, {
			element: this.containerEl,
			onSave: (output) => this.replacePage(view.editor, output),
		});
	}

	private replacePage(editor: Editor, output: string): void {
		const section = this.context.getSectionInfo(this.containerEl);
		if (!section) {
			throw new Error('No se pudo localizar la página de runas en la nota.');
		}

		const source = editor.getValue();
		const approximateOffset = editor.posToOffset({ line: section.lineStart, ch: 0 });
		const page = findRunePageSourceRange(
			source,
			section.text,
			section.lineStart,
			section.lineEnd,
			approximateOffset,
		);
		editor.replaceRange(output, editor.offsetToPos(page.start), editor.offsetToPos(page.end));
	}
}

function findRunePageSourceRange(
	source: string,
	sectionText: string,
	lineStart: number,
	lineEnd: number,
	approximateOffset: number,
): RunePageSourceRange {
	const sectionPages = findRunePageSourceRanges(sectionText);
	if (sectionPages.length === 1) {
		const sectionPage = sectionPages[0]!;
		const pageMarkup = sectionText.slice(sectionPage.start, sectionPage.end);
		const pageOffset = findClosestOccurrence(source, pageMarkup, approximateOffset);
		if (pageOffset >= 0) {
			return {
				start: pageOffset,
				end: pageOffset + pageMarkup.length,
				line: source.slice(0, pageOffset).split('\n').length - 1,
			};
		}
	}

	const pages = findRunePageSourceRanges(source);
	const pagesInRange = pages.filter((page) => page.line >= lineStart && page.line <= lineEnd);
	if (pagesInRange.length === 1) {
		return pagesInRange[0]!;
	}
	if (pagesInRange.length > 1) {
		return pagesInRange.reduce((closest, page) =>
			Math.abs(page.line - lineStart) < Math.abs(closest.line - lineStart)
				? page
				: closest,
		);
	}
	if (pages.length === 1) {
		return pages[0]!;
	}
	throw new Error('No se pudo identificar una única página de runas en la nota.');
}

function findClosestOccurrence(source: string, search: string, approximateOffset: number): number {
	let closestOffset = -1;
	let closestDistance = Number.POSITIVE_INFINITY;
	let offset = source.indexOf(search);
	while (offset >= 0) {
		const distance = Math.abs(offset - approximateOffset);
		if (distance < closestDistance) {
			closestOffset = offset;
			closestDistance = distance;
		}
		offset = source.indexOf(search, offset + 1);
	}
	return closestOffset;
}

function findRunePageSourceRanges(source: string): RunePageSourceRange[] {
	const pages: RunePageSourceRange[] = [];
	let searchFrom = 0;
	while (true) {
		const start = source.indexOf(RUNE_PAGE_OPEN_TAG, searchFrom);
		if (start < 0) {
			return pages;
		}

		const tags = /<\/?div\b[^>]*>/gi;
		tags.lastIndex = start;
		let depth = 0;
		let end = -1;
		let match: RegExpExecArray | null;
		while ((match = tags.exec(source)) !== null) {
			if (match[0].startsWith('</')) {
				depth--;
			} else {
				depth++;
			}
			if (depth === 0) {
				end = tags.lastIndex;
				break;
			}
		}

		if (end < 0) {
			throw new Error('El bloque de runas de la nota está incompleto.');
		}
		pages.push({
			start,
			end,
			line: source.slice(0, start).split('\n').length - 1,
		});
		searchFrom = end;
	}
}
