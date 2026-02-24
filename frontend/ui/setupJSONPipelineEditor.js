import { history, redo, undo } from "https://esm.sh/@codemirror/commands@6"; // Manejo de historial profesional
import { json } from "https://esm.sh/@codemirror/lang-json@6";
import {
	HighlightStyle,
	syntaxHighlighting,
} from "https://esm.sh/@codemirror/language@6";
import { EditorState } from "https://esm.sh/@codemirror/state@6";
import {
	drawSelection,
	EditorView,
	keymap,
	lineNumbers,
	placeholder,
} from "https://esm.sh/@codemirror/view@6";
import { tags as t } from "https://esm.sh/@lezer/highlight@1";

let editorView;

const placeholderText = `{
  "pipeline": [
    {
      "filter": "filter_name",
      "params": {
        "param1": "value1",
        "param2": "value2",
            .
            .
            .
      }
    }
  ],
  "statistics": {
    "histograms": {
      "histogramType1": (bool),
      "histogramType2": (bool),
            .
            .
            .
    }
  },
  "output_suffix": (string),
  "output_extension": (string) <= "auto" 
        | "jpg" | "jpeg" | "png" | "ppm"
}`;

const initialValue = ``;

const myHighlightStyle = HighlightStyle.define([
	{ tag: t.string, color: "#7dd3fc" },
	{ tag: t.propertyName, color: "#f4f4f5" },
	{ tag: t.number, color: "#94a3b8" },
	{ tag: t.bool, color: "#38bdf8" },
	{ tag: t.punctuation, color: "#71717a" },
	{ tag: t.brace, color: "#a1a1aa" },
]);

const myTheme = EditorView.theme({
	"&": { height: "100%", backgroundColor: "#111113", color: "#f4f4f5" },
	".cm-editor": { height: "100%" },
	".cm-scroller": { overflow: "auto" },
	".cm-cursor": { borderLeft: "2px solid #22d3ee !important" }, // Cursor Cyan visible
	".cm-content": { fontFamily: "monospace", padding: "10px 0" },
	".cm-gutters": {
		backgroundColor: "#111113",
		color: "#3f3f46",
		border: "none",
	},
	"&.cm-focused": { outline: "none" },
});

const plainTab = {
	key: "Tab",
	run: (view) => {
		view.dispatch(
			view.state.update({
				changes: { from: view.state.selection.main.from, insert: "  " },
				selection: { anchor: view.state.selection.main.from + 2 },
			}),
		);
		return true;
	},
};

export function setupJSONPipelineEditor() {
	const container = document.getElementById("json-editor-container");

	if (!container) return;

	editorView = new EditorView({
		state: EditorState.create({
			doc: initialValue,
			extensions: [
				lineNumbers(),
				drawSelection(),
				history(),
				placeholder(placeholderText),
				syntaxHighlighting(myHighlightStyle),
				myTheme,
				json(),
				EditorView.lineWrapping,
				keymap.of([
					plainTab,
					{ key: "Mod-z", run: undo },
					{ key: "Mod-y", run: redo },
				]),
			],
		}),
		parent: container,
	});
}

export function getJSONPipelineContent() {
	return editorView ? editorView.state.doc.toString() : "";
}

export function setJSONPipelineContent(text) {
	if (!editorView) return;

	editorView.dispatch({
		changes: {
			from: 0,
			to: editorView.state.doc.length,
			insert: text,
		},
		selection: { anchor: 0 },
	});
}
