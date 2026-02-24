import { insertPreset } from "../repos/preset.repository.js";
import { findUserByID } from "../repos/user.repository.js";

const MAX_DESCRIPTION_LEN = 500;
const MAX_NAME_LEN = 100;
const MAX_PIPELINE_BYTES = 50 * 1024;

export async function validateAndCreatePreset(
	db,
	userID,
	name,
	description,
	pipeline,
) {
	// Validate input
	if (!userID || !name || !description || !pipeline) {
		throw new Error("All fields are required");
	}

	if (name.length > MAX_NAME_LEN) {
		throw new Error("Name is too long");
	}
	if (description.length > MAX_DESCRIPTION_LEN) {
		throw new Error("Description is too long");
	}

	const pipelineSize = Buffer.byteLength(JSON.stringify(pipeline), "utf8");

	if (pipelineSize > MAX_PIPELINE_BYTES) {
		throw new Error("Pipeline is too large");
	}

	const user = await findUserByID(db, userID);
	if (!user) {
		throw new Error("User not found");
	}
	if (!user.username) {
		throw new Error("Cant upload without an username");
	}

	const res = await insertPreset(db, userID, name, description, pipeline);
	if (!res) {
		throw new Error("Failed to create preset");
	}
	return res;
}
