import { describe, it, expect } from "vitest";
import { injectAntislopCode } from "../../open-sse/rtk/antislopCode.js";
import { ANTISLOP_CODE_PROMPT } from "../../open-sse/rtk/antislopCodePrompt.js";
import { FORMATS } from "../../open-sse/translator/formats.js";
import { ROLE } from "../../open-sse/translator/schema/roles.js";

describe("antislop-code injector", () => {
  it("injects prompt into OpenAI format body with existing system message", () => {
    const body = {
      messages: [{ role: ROLE.SYSTEM, content: "You are a helpful assistant." }],
    };
    injectAntislopCode(body, FORMATS.OPENAI);
    expect(body.messages[0].content).toContain(ANTISLOP_CODE_PROMPT);
    expect(body.messages[0].content).toContain("Code comment hygiene");
  });

  it("injects prompt into OpenAI format body without system message", () => {
    const body = {
      messages: [{ role: ROLE.USER, content: "Write a function" }],
    };
    injectAntislopCode(body, FORMATS.OPENAI);
    expect(body.messages[0].role).toBe(ROLE.SYSTEM);
    expect(body.messages[0].content).toBe(ANTISLOP_CODE_PROMPT);
  });

  it("injects prompt into Claude format body", () => {
    const body = {
      system: "Existing instructions",
      messages: [{ role: ROLE.USER, content: "Hello" }],
    };
    injectAntislopCode(body, FORMATS.CLAUDE);
    expect(body.system).toContain(ANTISLOP_CODE_PROMPT);
  });

  it("injects prompt into Gemini format body", () => {
    const body = {
      systemInstruction: {
        parts: [{ text: "Gemini system prompt" }],
      },
      contents: [{ role: "user", parts: [{ text: "Hi" }] }],
    };
    injectAntislopCode(body, FORMATS.GEMINI);
    expect(body.systemInstruction.parts[1].text).toContain(ANTISLOP_CODE_PROMPT);
  });

  it("fails open gracefully on invalid/frozen input", () => {
    expect(() => injectAntislopCode(null, FORMATS.OPENAI)).not.toThrow();
    expect(() => injectAntislopCode(undefined, FORMATS.OPENAI)).not.toThrow();
    const frozen = Object.freeze({ messages: Object.freeze([]) });
    expect(() => injectAntislopCode(frozen, FORMATS.OPENAI)).not.toThrow();
  });
});
