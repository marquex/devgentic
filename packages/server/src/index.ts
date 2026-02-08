import { createApp } from "./app.js";

const app = createApp();
const port = Number(process.env.PORT) || 3000;

console.log(`Devgentic server running on http://localhost:${port}`);

export default {
  fetch: app.fetch,
  port,
};
