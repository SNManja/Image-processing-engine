function guessMimeType(path: string): string {
	const lower = path.toLowerCase();

	if (lower.endsWith(".png")) return "image/png";
	if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
	if (lower.endsWith(".webp")) return "image/webp";
	if (lower.endsWith(".bmp")) return "image/bmp";

	return "application/octet-stream";
}

export default guessMimeType;
