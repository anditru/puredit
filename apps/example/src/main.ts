import "normalize.css";
import App from "./App.svelte";

const app = new App({
  target: document.getElementById("app"),
});

export default app;

import { LOG4TS_LOG_CONTROL } from "typescript-logging-log4ts-style";
if (window !== undefined) {
  (window as any).appLogControl = LOG4TS_LOG_CONTROL;
}
