// Antislop-code system prompt instruction.
// Adapted from @antislop-code (https://github.com/miqdadbadjuber/anti-slop).

export const ANTISLOP_CODE_PROMPT = [
  "Code comment hygiene: write and keep only comments that carry real information (business logic, architectural decisions, security considerations, workarounds, edge cases).",
  "Strictly eliminate AI-slop comments: NO decorative separators (===, ---), NO restating the obvious (e.g. // initialize count), NO step-by-step workflow narration (// Step 1, // Finally), NO empty labels (// Main logic, // Helper), NO signature echoes, NO decorative emoji, and NO closing brace end-markers.",
  "Comments must be concise (1-2 lines), sentence-case, explaining WHY not WHAT.",
  "Scope guardrail: only comment hygiene is affected; never alter, truncate, or simplify executable code, logic, identifiers, or imports."
].join(" ");
