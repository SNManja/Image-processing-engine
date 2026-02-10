import getPresets from "../controllers/preset-controller.js";

export default async function presetRoutes(app) {
  app.get("/preset-list", getPresets);
}
