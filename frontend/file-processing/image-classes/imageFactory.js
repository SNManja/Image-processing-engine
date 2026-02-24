import NativeImage from "./NativeImage.js";
import PPMImage from "./PPMImage.js";

export async function imageFactory(outputPath, ext) {
	switch (ext.toLowerCase()) {
		case "ppm":
			return PPMImage.FromPath(outputPath);
		case "jpg":
		case "jpeg":
		case "png":
			return NativeImage.FromPath(outputPath);
		default:
			throw new Error(`Formato no soportado: ${ext}`);
	}
}
