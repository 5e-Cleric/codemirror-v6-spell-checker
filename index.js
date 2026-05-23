import { EditorView, Decoration, ViewPlugin } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import Typo from "typo-js";

function createDictionary(lang) {
	return new Typo(lang, false, false, {
		dictionaryPath: `/dictionaries/${lang}`,
	});
}

function isMisspelled(dictionary, word) {
	return !dictionary.check(word);
}

const theme = EditorView.baseTheme({
	".cm-spell-error": {
		textDecoration: "underline wavy red",
	},
});

const misspelledMark = Decoration.mark({
	class: "cm-spell-error",
});

function buildDecorations(view, dictionary) {
	const builder = new RangeSetBuilder();
	const text = view.state.doc.toString();
	const words = text.matchAll(/\b[a-zA-Z']+\b/g);

	for (const match of words) {
		const word = match[0];
		if (isMisspelled(dictionary, word)) {
			const from = match.index;
			const to = from + word.length;
			builder.add(from, to, misspelledMark);
		}
	}

	return builder.finish();
}

export function spellChecker(lang = "en_US") {
	const dictionary = createDictionary(lang);

	const spellPlugin = ViewPlugin.fromClass(
		class {
			constructor(view) {
				this.dictionary = dictionary;
				this.decorations = buildDecorations(view, this.dictionary);
			}

			update(update) {
				if (update.docChanged) {
					this.decorations = buildDecorations(update.view, this.dictionary);
				}
			}
		},
		{
			decorations: (v) => v.decorations,
		},
	);

	return [theme, spellPlugin];
}
