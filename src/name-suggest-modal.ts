import { App, SuggestModal } from 'obsidian';

interface NamedSuggestion {
	name: string;
}

export class NameSuggestModal<T extends NamedSuggestion> extends SuggestModal<T> {
	constructor(
		app: App,
		private readonly suggestions: T[],
		placeholder: string,
		private readonly onChoose: (suggestion: T) => void,
	) {
		super(app);
		this.setPlaceholder(placeholder);
	}

	getSuggestions(query: string): T[] {
		const normalizedQuery = query.trim().toLocaleLowerCase();
		return this.suggestions.filter((suggestion) =>
			suggestion.name.toLocaleLowerCase().includes(normalizedQuery),
		);
	}

	renderSuggestion(suggestion: T, element: HTMLElement): void {
		element.setText(suggestion.name);
	}

	onChooseSuggestion(suggestion: T, _event: MouseEvent | KeyboardEvent): void {
		this.onChoose(suggestion);
	}
}
