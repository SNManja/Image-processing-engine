import { json } from "@codemirror/lang-json";
import CodeMirror from "@uiw/react-codemirror";
import React, { forwardRef, useImperativeHandle, useState } from "react";
// CodeMirror extensions / theme imports
import { history, redo, selectAll, undo } from "@codemirror/commands";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import {
	drawSelection,
	EditorView,
	keymap,
	lineNumbers,
	placeholder,
} from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

/* -------------------------
   Editor: themed CodeMirror
   ------------------------- */

export type EditorHandle = {
	getValue: () => string;
	setValue: (v: string) => void;
};

const placeholderText = `{
  "pipeline": [
    {
      "filter": "filter_name",
      "params": {
        "param1": "value1"
      }
    }
  ]
}`;

const myHighlightStyle = HighlightStyle.define([
	{ tag: t.string, color: "#7dd3fc" },
	{ tag: t.propertyName, color: "#f4f4f5" },
	{ tag: t.number, color: "#94a3b8" },
	{ tag: t.bool, color: "#38bdf8" },
	{ tag: t.punctuation, color: "#71717a" },
	{ tag: t.brace, color: "#a1a1aa" },
]);

const myTheme = EditorView.theme(
	{
		"&": { height: "100%", backgroundColor: "#0b0b0c", color: "#e6eef6" },
		".cm-editor": { height: "100%" },
		".cm-scroller": { overflow: "auto", padding: "8px 0" },
		".cm-cursor": { borderLeft: "2px solid #22d3ee" },
		".cm-content": {
			fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
		},
		".cm-gutters": {
			backgroundColor: "#0b0b0c",
			color: "#5b6168",
			border: "none",
			paddingRight: "8px",
		},
		"&.cm-focused": { outline: "none" },
	},
	{ dark: true },
);

const plainTab = {
	key: "Tab",
	run: (view: EditorView) => {
		const { from } = view.state.selection.main;
		view.dispatch({
			changes: { from, insert: "  " },
			selection: { anchor: from + 2 },
		});
		return true;
	},
};

export const PipelineEditor = forwardRef<EditorHandle, unknown>(
	function PipelineEditor(_, ref) {
		// mantener el valor internamente; padre accede vía ref
		const [editorValue, setEditorValue] = useState<string>(
			() => placeholderText,
		);
		const [jsonError, setJsonError] = useState<string | null>(null);

		useImperativeHandle(
			ref,
			() => ({
				getValue: () => editorValue,
				setValue: (v: string) => {
					setEditorValue(v);
					// validar rápido
					try {
						JSON.parse(v);
						setJsonError(null);
					} catch (err: unknown) {
						const msg =
							err instanceof Error ? err.message : String(err);
						setJsonError(msg ?? "Invalid JSON");
					}
				},
			}),
			[editorValue],
		);

		function handleEditorChange(value: string) {
			setEditorValue(value);
			try {
				JSON.parse(value);
				setJsonError(null);
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : String(err);
				setJsonError(msg ?? "Invalid JSON");
			}
		}

		// Ensure the editor receives focus when the user clicks the outer container.
		function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
			const root = e.currentTarget.querySelector(
				".cm-editor",
			) as HTMLElement | null;
			if (root) setTimeout(() => root.focus(), 0);
		}

		return (
			<div className="pipeline-editor" onPointerDown={handlePointerDown}>
				<CodeMirror
					value={editorValue}
					onChange={(v) => handleEditorChange(v)}
					className="pipeline-codemirror-wrapper"
					style={{ height: "100%" }}
					extensions={[
						lineNumbers(),
						drawSelection(),
						history(),
						placeholder(placeholderText),
						syntaxHighlighting(myHighlightStyle),
						myTheme,
						EditorView.lineWrapping,
						json(),
						keymap.of([
							plainTab,
							{ key: "Mod-z", run: undo },
							{ key: "Mod-y", run: redo },
							{ key: "Mod-a", run: selectAll },
							{ key: "Ctrl-a", run: selectAll },
						]),
					]}
					height="100%"
				/>
				{jsonError && (
					<div style={{ color: "var(--color-danger)", marginTop: 8 }}>
						JSON error: {jsonError}
					</div>
				)}
			</div>
		);
	},
);
