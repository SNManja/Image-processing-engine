export default class NativeImage {
	constructor(width, height, imageData, name) {
		this.width = width;
		this.height = height;
		this.imageData = imageData;
		this.name = name;
	}

	toImageData() {
		return this.imageData;
	}

	static async FromPath(path) {
		const engine = window.engineModule;
		const data = engine.FS.readFile(path); // Leemos los bytes (jpg/png)

		// Creamos un Blob para que el navegador lo entienda
		const blob = new Blob([data]);

		// El asincronismo real ocurre aquí: el navegador decodifica el binario
		const bitmap = await createImageBitmap(blob);

		// Pasamos el bitmap a un canvas oculto para extraer los ImageData
		const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
		const ctx = canvas.getContext("2d");
		ctx.drawImage(bitmap, 0, 0);

		const imgData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

		return new NativeImage(
			bitmap.width,
			bitmap.height,
			imgData,
			path
				.split("/")
				.pop()
				.replace(/\.[^/.]+$/, ""),
		);
	}
}
