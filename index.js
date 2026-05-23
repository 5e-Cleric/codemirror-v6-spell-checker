import { EditorView, Decoration, ViewPlugin } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

const theme = EditorView.baseTheme({
	".cm-spell-error": {
		textDecoration: "underline wavy red",
	},
});

const misspelledMark = Decoration.mark({
	class: "cm-spell-error",
});

function buildDecorations(view) {
	const builder = new RangeSetBuilder();

	const text = view.state.doc.toString();

	const words = text.matchAll(/\b[a-zA-Z']+\b/g);

	for (const match of words) {
		const word = match[0];

		if (word === "helo") {
			const from = match.index;
			const to = from + word.length;

			builder.add(from, to, misspelledMark);
		}
	}

	return builder.finish();
}

const spellPlugin = ViewPlugin.fromClass(
	class {
		constructor(view) {
			this.decorations = buildDecorations(view);
		}

		update(update) {
			if (update.docChanged) {
				this.decorations = buildDecorations(update.view);
			}
		}
	},
	{
		decorations: (v) => v.decorations,
	},
);

export function spellChecker() {
	return [theme, spellPlugin];
}
