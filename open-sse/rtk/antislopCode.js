// Antislop-code injector: appends the code comment hygiene instruction into the
// system message of the final request body, just before dispatch to provider executor.
// Adapted from @antislop-code (https://github.com/miqdadbadjuber/anti-slop).

import { injectSystemPrompt } from "./systemInject.js";
import { ANTISLOP_CODE_PROMPT } from "./antislopCodePrompt.js";

export function injectAntislopCode(body, format) {
  injectSystemPrompt(body, format, ANTISLOP_CODE_PROMPT);
}
