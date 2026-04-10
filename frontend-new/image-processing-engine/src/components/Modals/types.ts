export type ActiveModal =
	| { type: "clear-images" }
	| { type: "presets" }
	| { type: "publish" }
	| null;
