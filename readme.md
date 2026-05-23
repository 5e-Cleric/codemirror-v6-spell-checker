# CodeMirror v6 Spell Checker
Simple spell checking for CodeMirror 6. It will underline in red any misspelled words. You may set up a list of ignored words. Works great in conjunction with other CodeMirror modes, like GitHub Flavored Markdown.


![Screenshot](https://ik.imagekit.io/5eCleric/Captura%20de%20pantalla%202026-05-23%20174312.png)

## Install

Via [npm](https://www.npmjs.com/package/codemirror-spell-checker).
```
npm install codemirror-v6-spell-checker --save
```

# CodeMirror 6 Spell Checker Extension

A lightweight CodeMirror 6 extension that performs spell checking using plain dictionary lookup. It highlights misspelled words via editor decorations and supports language fallback resolution.



## Features

- Dictionary-based spell checking (no external engine required)
- Language fallback resolution with locale aliases
- URL exclusion
- Custom ignore list
- Debounced updates for performance
- CodeMirror 6 decoration-based highlighting



## Usage

```js
import { EditorView } from "@codemirror/view";
import { spellChecker } from "./spellChecker";

const editor = new EditorView({
  extensions: [
    spellChecker("en", ["customWord"], 600)
  ],
  parent: document.body,
});
```

## Personalize the styles!

```CSS
.cm-editor .cm-spell-error {
	/* Your styling here */
}
```

## Available languages

- Catalan
- German
- English
- Spanish
- French
- Italian
- Norwegian
- Portuguese
- Russian
- Swedish

If you'd require another language, submit a PR adding the appropiate `.aff` and `.dic` files under a folder with the lang code on the dictionaries folder, and the languages will be available.

You may open up an issue if you can't do so and i'll try.
