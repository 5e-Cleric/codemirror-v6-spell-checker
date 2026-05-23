import { EditorView, Decoration, ViewPlugin } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import Typo from "typo-js";
import { defaultIgnore } from "./dictionaries/defaultIgnoreList";

function resolveLang(lang) {
	const normalized = lang.toLowerCase().replace(/-/g, "_");

	const map = {
		en: "en_US",
		en_us: "en_US",
		en_gb: "en_GB",
		es: "es_ES",
		fr: "fr_FR",
		de: "de_DE",
		no: "nb_no",
	};

	if (map[normalized]) return map[normalized];

	const base = normalized.split("_")[0];
	return map[base] || normalized;
}

// Load dictionary files from CDN (or any public URL)
async function loadDictionary(lang) {
	const resolved = resolveLang(lang);
	const folder = resolved.split("_")[0];

	const base = `https://cdn.jsdelivr.net/gh/5e-Cleric/codemirror-v6-spell-checker/dictionaries/${folder}/${resolved}`;

	const [aff, dic] = await Promise.all([
		fetch(`${base}.aff`).then((r) => r.text()),
		fetch(`${base}.dic`).then((r) => r.text()),
	]);

	return new Typo(resolved, aff, dic, { platform: "any" });
}
const theme = EditorView.baseTheme({
	".cm-spell-error": {
		textDecoration: "underline wavy red",
	},
});

const misspelledMark = Decoration.mark({
	class: "cm-spell-error",
});

const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+/i;

function buildDecorations(view, dictionary, ignoreSet) {
	const builder = new RangeSetBuilder();
	const text = view.state.doc.toString();

	const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+/gi;

	// Mark URL ranges so we can skip them
	const urlRanges = [];
	let match;
	while ((match = urlRegex.exec(text)) !== null) {
		urlRanges.push([match.index, match.index + match[0].length]);
	}

	const words = text.matchAll(/\b[a-zA-Z']+\b/g);

	outer: for (const match of words) {
		const word = match[0];
		const lower = word.toLowerCase();
		const from = match.index;
		const to = from + word.length;

		if (ignoreSet.has(lower)) continue;

		for (const [uFrom, uTo] of urlRanges) {
			if (from >= uFrom && to <= uTo) continue outer;
		}

		// 3. Spellcheck
		if (!dictionary.check(word)) {
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

function expandIgnoreList(words) {
	const expanded = [];

	for (const w of words) {
		const lower = w.toLowerCase();

		expanded.push(lower); // cleric
		expanded.push(lower + "s"); // clerics
	}

	return expanded;
}

export function spellChecker(lang = "en_US", ignore = [], delay = 300) {
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
					this.decorations = Decoration.none;
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
