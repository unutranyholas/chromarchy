import { generatePalette } from "./dist/palette-engine.mjs";

WorkerScript.onMessage = function (message) {
  try {
    WorkerScript.sendMessage({
      id: message.id,
      result: generatePalette(message.config),
    });
  } catch (error) {
    WorkerScript.sendMessage({
      id: message.id,
      error: error && error.message ? error.message : String(error),
    });
  }
};
