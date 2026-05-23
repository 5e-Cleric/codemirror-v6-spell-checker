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

function buildDecorations(view, dictionary, ignoreSet) {
	const builder = new RangeSetBuilder();
	const text = view.state.doc.toString();
	const words = text.matchAll(/\b[a-zA-Z']+\b/g);

	for (const match of words) {
		const word = match[0];
		const lower = word.toLowerCase();

		// Skip ignored words
		if (ignoreSet.has(lower)) continue;

		if (!dictionary.check(word)) {
			const from = match.index;
			const to = from + word.length;
			builder.add(from, to, misspelledMark);
		}
	}

	return builder.finish();
}

function debounce(fn, delay) {
	let timer = null;
	return (...args) => {
		clearTimeout(timer);
		timer = setTimeout(() => fn(...args), delay);
	};
}

const defaultIgnore = ["https", "colspan"];

function expandIgnoreList(words) {
	const expanded = [];

	for (const w of words) {
		const lower = w.toLowerCase();

		expanded.push(lower); // cleric
		expanded.push(lower + "s"); // clerics
	}

	return expanded;
}
export function spellChecker(lang = "en_US", userIgnore = [], delay = 300) {
	const ignoreSet = new Set(expandIgnoreList([...defaultIgnore, ...ignore]));
	let dictionaryPromise = loadDictionary(lang);

	const spellPlugin = ViewPlugin.fromClass(
		class {
			constructor(view) {
				this.decorations = Decoration.none;
				this.dictionary = null;

				// Debounced update function
				this.scheduleUpdate = debounce(() => {
					if (this.dictionary) {
						this.decorations = buildDecorations(view, this.dictionary, ignoreSet);
						view.dispatch({ effects: [] });
					}
				}, delay);

				dictionaryPromise.then((dict) => {
					this.dictionary = dict;
					this.scheduleUpdate();
				});
			}

			update(update) {
				if (this.dictionary && update.docChanged) {
					this.scheduleUpdate();
				}
			}
		},
		{
			decorations: (v) => v.decorations,
		},
	);

	return [theme, spellPlugin];
}
