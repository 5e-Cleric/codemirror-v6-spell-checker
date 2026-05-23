import { EditorView, Decoration, ViewPlugin } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import Typo from "typo-js";

// Load dictionary files from CDN (or any public URL)
async function loadDictionary(lang) {
	const base = `https://cdn.jsdelivr.net/gh/5e-Cleric/codemirror-v6-spell-checker/dictionaries/${lang}/${lang}`;

	const [aff, dic] = await Promise.all([
		fetch(`${base}.aff`).then((r) => r.text()),
		fetch(`${base}.dic`).then((r) => r.text()),
	]);

	
	return new Typo(lang, aff, dic, { platform: "any" });
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
		if (!dictionary.check(word)) {
			const from = match.index;
			const to = from + word.length;
			builder.add(from, to, misspelledMark);
		}
	}

	return builder.finish();
}

export function spellChecker(lang = "en_US") {
	let dictionaryPromise = loadDictionary(lang);

	const spellPlugin = ViewPlugin.fromClass(
		class {
			constructor(view) {
				this.decorations = Decoration.none;
				this.dictionary = null;

				dictionaryPromise.then((dict) => {
					this.dictionary = dict;
					this.decorations = buildDecorations(view, dict);
					view.dispatch({ effects: [] }); // force redraw
				});
			}

			update(update) {
				if (this.dictionary && update.docChanged) {
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
