"use server";

import { NextResponse } from "next/server";
import { resolveCliApiKey } from "../resolveApiKey.js";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

const getConfigDir = () => path.join(os.homedir(), ".config", "opencode");
const getConfigPath = () => path.join(getConfigDir(), "opencode.json");

// Check if opencode CLI is installed (via which/where or config file exists)
const checkOpenCodeInstalled = async () => {
  try {
    const isWindows = os.platform() === "win32";
    const command = isWindows ? "where opencode" : "which opencode";
    const env = isWindows
      ? { ...process.env, PATH: `${process.env.APPDATA}\\npm;${process.env.PATH}` }
      : process.env;
    await execAsync(command, { windowsHide: true, env });
    return true;
  } catch {
    try {
      await fs.access(getConfigPath());
      return true;
    } catch {
      return false;
    }
  }
};

const readConfig = async () => {
  try {
    const content = await fs.readFile(getConfigPath(), "utf-8");
    // opencode config files may use JSONC format (trailing commas, comments).
    // Strip trailing commas before parsing to avoid SyntaxError on valid JSONC.
    const stripped = content.replace(/,(\s*[}\]])/g, "$1");
    return JSON.parse(stripped);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    // If the config file exists but is unparseable (corrupted, exotic JSONC),
    // treat it as "no config" rather than throwing a 500 that the UI
    // misinterprets as "opencode not installed".
    return null;
  }
};

const has67RouterConfig = (config) => {
  if (!config?.provider) return false;
  return !!(config.provider["67router"] || config.provider["9router"]);
};

/**
 * Fetch all available models with full specifications (context window, max output, modalities)
 * from the target baseURL via /v1/models using the provided API key.
 * Falls back to local database buildModelsList if local or remote fetch is unreachable.
 */
async function fetchModelsWithSpecs(baseUrl, apiKey) {
  const normalizedBaseUrl = baseUrl ? (baseUrl.endsWith("/v1") ? baseUrl : `${baseUrl}/v1`) : null;
  const keyToUse = await resolveCliApiKey(apiKey);

  let rawModels = [];
  let fetchedRemotely = false;

  if (normalizedBaseUrl) {
    try {
      const headers = {};
      if (keyToUse) {
        headers["Authorization"] = `Bearer ${keyToUse}`;
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${normalizedBaseUrl}/models`, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json?.data) && json.data.length > 0) {
          rawModels = json.data;
          fetchedRemotely = true;
        } else if (Array.isArray(json?.models) && json.models.length > 0) {
          rawModels = json.models;
          fetchedRemotely = true;
        }
      }
    } catch (err) {
      // Remote fetch failed, fall back to internal model list
    }
  }

  if (!fetchedRemotely || rawModels.length === 0) {
    try {
      const { buildModelsList } = await import("@/app/api/v1/models/route.js");
      rawModels = await buildModelsList(["llm"]);
    } catch (err) {
      console.log("Error falling back to buildModelsList:", err);
    }
  }

  // Format into standard OpenCode model spec objects
  return rawModels.map((m) => {
    const id = m.id || m.name;
    const contextWindow = m.context_length || m.capabilities?.contextWindow || m.limit?.context || 128000;
    const maxOutput = m.max_completion_tokens || m.capabilities?.maxOutput || m.limit?.output || 16384;
    const hasVision = Boolean(
      m.capabilities?.vision ||
      (Array.isArray(m.modalities?.input) && m.modalities.input.includes("image"))
    );

    return {
      id,
      name: id,
      limit: {
        context: Number(contextWindow) || 128000,
        output: Number(maxOutput) || 16384,
      },
      modalities: {
        input: hasVision ? ["text", "image"] : ["text"],
        output: ["text"],
      },
      capabilities: {
        tools: m.capabilities?.tools ?? true,
        reasoning: m.capabilities?.reasoning ?? false,
        vision: hasVision,
      },
    };
  });
}

// GET - Check opencode CLI and read current settings
export async function GET(request) {
  try {
    const isInstalled = await checkOpenCodeInstalled();

    if (!isInstalled) {
      return NextResponse.json({
        installed: false,
        config: null,
        message: "OpenCode CLI is not installed",
      });
    }

    const config = await readConfig();
    const providerConfig = config?.provider?.["67router"] || config?.provider?.["9router"];
    const modelMap = providerConfig?.models || {};

    let activeModel = null;
    if (config?.model?.startsWith("67router/")) {
      activeModel = config.model.replace(/^67router\//, "");
    } else if (config?.model?.startsWith("9router/")) {
      activeModel = config.model.replace(/^9router\//, "");
    }

    let subagentModel = null;
    if (config?.agent?.explorer?.model?.startsWith("67router/")) {
      subagentModel = config.agent.explorer.model.replace(/^67router\//, "");
    } else if (config?.agent?.explorer?.model?.startsWith("9router/")) {
      subagentModel = config.agent.explorer.model.replace(/^9router\//, "");
    }

    return NextResponse.json({
      installed: true,
      config,
      has67Router: has67RouterConfig(config),
      has9Router: has67RouterConfig(config), // backward compat
      configPath: getConfigPath(),
      opencode: {
        models: Object.keys(modelMap),
        modelsDetail: modelMap,
        activeModel,
        subagentModel,
        baseURL: providerConfig?.options?.baseURL || null,
      },
    });
  } catch (error) {
    console.log("Error checking opencode settings:", error);
    return NextResponse.json({ error: "Failed to check opencode settings" }, { status: 500 });
  }
}

// POST - Fetch all models or apply 67Router provider with full model specifications
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, baseUrl, apiKey, model, models, activeModel, subagentModel, fetchAll } = body;

    if (!baseUrl) {
      return NextResponse.json({ error: "baseUrl is required" }, { status: 400 });
    }

    const keyToUse = await resolveCliApiKey(apiKey);

    // ACTION: fetch-models — query endpoint and return all models with full specs
    if (action === "fetch-models") {
      const fetchedModels = await fetchModelsWithSpecs(baseUrl, keyToUse);
      return NextResponse.json({
        success: true,
        models: fetchedModels,
        count: fetchedModels.length,
      });
    }

    // ACTION: apply / save models
    const configDir = getConfigDir();
    const configPath = getConfigPath();

    await fs.mkdir(configDir, { recursive: true });

    // Read existing config or start fresh
    let config = {};
    try {
      const existing = await fs.readFile(configPath, "utf-8");
      config = JSON.parse(existing);
    } catch { /* No existing config */ }

    const normalizedBaseUrl = baseUrl.endsWith("/v1") ? baseUrl : `${baseUrl}/v1`;

    // Ensure provider object
    if (!config.provider) config.provider = {};

    // Remove legacy 9router provider if present
    if (config.provider["9router"]) {
      delete config.provider["9router"];
    }

    // Initialize or preserve 67router provider entry
    const providerEntry = config.provider["67router"] || {
      npm: "@ai-sdk/openai-compatible",
      name: "67Router",
      options: {},
      models: {},
    };

    providerEntry.options = {
      ...providerEntry.options,
      baseURL: normalizedBaseUrl,
      apiKey: keyToUse,
    };
    providerEntry.models = providerEntry.models || {};

    let modelsToApply = [];

    // If fetchAll is requested or no models provided, fetch everything from endpoint
    if (fetchAll === true || (!models && !model)) {
      modelsToApply = await fetchModelsWithSpecs(baseUrl, keyToUse);
    } else if (Array.isArray(models)) {
      // If models is an array of objects with specifications
      if (models.length > 0 && typeof models[0] === "object" && models[0] !== null) {
        modelsToApply = models;
      } else {
        // Models is an array of IDs; fetch catalog specs to populate limits
        const catalog = await fetchModelsWithSpecs(baseUrl, keyToUse);
        const catalogMap = new Map(catalog.map((m) => [m.id, m]));
        modelsToApply = models.map((mId) => {
          if (catalogMap.has(mId)) return catalogMap.get(mId);
          return {
            id: mId,
            name: mId,
            limit: { context: 128000, output: 16384 },
            modalities: { input: ["text", "image"], output: ["text"] },
          };
        });
      }
    } else if (typeof model === "string" && model.trim()) {
      const mId = model.trim();
      const catalog = await fetchModelsWithSpecs(baseUrl, keyToUse);
      const found = catalog.find((m) => m.id === mId);
      modelsToApply = [found || {
        id: mId,
        name: mId,
        limit: { context: 128000, output: 16384 },
        modalities: { input: ["text", "image"], output: ["text"] },
      }];
    }

    // Write all model specifications to provider models map
    for (const m of modelsToApply) {
      if (!m || !m.id) continue;
      providerEntry.models[m.id] = {
        name: m.name || m.id,
        limit: {
          context: Number(m.limit?.context) || 128000,
          output: Number(m.limit?.output) || 16384,
        },
        modalities: {
          input: Array.isArray(m.modalities?.input) ? m.modalities.input : ["text"],
          output: Array.isArray(m.modalities?.output) ? m.modalities.output : ["text"],
        },
      };
    }

    config.provider["67router"] = providerEntry;

    // Set active model: prefer explicit activeModel, else first available
    const availableModelIds = Object.keys(providerEntry.models);
    if (activeModel === "") {
      config.model = "";
    } else {
      const finalActive = activeModel || (availableModelIds.includes(activeModel) ? activeModel : availableModelIds[0]);
      if (finalActive) {
        config.model = `67router/${finalActive}`;
      }
    }

    // Set subagent explorer model
    const effectiveSubagentModel = subagentModel || (activeModel || availableModelIds[0]);
    if (effectiveSubagentModel) {
      if (!config.agent) config.agent = {};
      config.agent.explorer = {
        description: "Fast explorer subagent for codebase exploration",
        mode: "subagent",
        model: `67router/${effectiveSubagentModel}`,
      };
    }

    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    return NextResponse.json({
      success: true,
      message: `OpenCode settings applied successfully with ${availableModelIds.length} model(s)!`,
      configPath,
      modelsCount: availableModelIds.length,
      activeModel: config.model,
    });
  } catch (error) {
    console.log("Error applying opencode settings:", error);
    return NextResponse.json({ error: error.message || "Failed to apply settings" }, { status: 500 });
  }
}

// PATCH - Update specific settings (e.g., clear active model)
export async function PATCH(request) {
  try {
    const { clearActiveModel } = await request.json();
    const configPath = getConfigPath();

    let config = {};
    try {
      const existing = await fs.readFile(configPath, "utf-8");
      config = JSON.parse(existing);
    } catch (error) {
      if (error.code === "ENOENT") {
        return NextResponse.json({ success: true, message: "No config file found" });
      }
      throw error;
    }

    if (clearActiveModel === true) {
      // Clear active model but keep models in the list
      if (config.model?.startsWith("67router/") || config.model?.startsWith("9router/")) {
        config.model = "";
      }
    }

    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    return NextResponse.json({
      success: true,
      message: "Settings updated",
    });
  } catch (error) {
    console.log("Error patching opencode settings:", error);
    return NextResponse.json({ error: "Failed to patch settings" }, { status: 500 });
  }
}

// DELETE - Remove 67Router provider or specific models from config
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const modelToRemove = searchParams.get("model");
    const configPath = getConfigPath();

    let config = {};
    try {
      const existing = await fs.readFile(configPath, "utf-8");
      config = JSON.parse(existing);
    } catch (error) {
      if (error.code === "ENOENT") {
        return NextResponse.json({ success: true, message: "No config file to reset" });
      }
      throw error;
    }

    const providerKey = config.provider?.["67router"] ? "67router" : "9router";

    // If specific model provided, remove just that model
    if (modelToRemove && config.provider?.[providerKey]?.models) {
      delete config.provider[providerKey].models[modelToRemove];
      
      // If no models left, remove the provider
      if (Object.keys(config.provider[providerKey].models).length === 0) {
        delete config.provider[providerKey];
        if (config.model?.startsWith("67router/") || config.model?.startsWith("9router/")) delete config.model;
      } else if (config.model === `67router/${modelToRemove}` || config.model === `9router/${modelToRemove}`) {
        // If removed model was active, switch to first remaining model
        const remainingModels = Object.keys(config.provider[providerKey].models);
        config.model = `67router/${remainingModels[0]}`;
      }
    } else {
      // No specific model - remove both 67router and 9router provider
      if (config.provider) {
        delete config.provider["67router"];
        delete config.provider["9router"];
      }
      if (config.model?.startsWith("67router/") || config.model?.startsWith("9router/")) delete config.model;
    }

    // Remove subagent configuration
    if (config.agent?.explorer?.model?.startsWith("67router/") || config.agent?.explorer?.model?.startsWith("9router/")) {
      delete config.agent.explorer;
      if (Object.keys(config.agent).length === 0) delete config.agent;
    }

    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    return NextResponse.json({
      success: true,
      message: modelToRemove ? `Model "${modelToRemove}" removed` : "67Router settings removed from OpenCode",
    });
  } catch (error) {
    console.log("Error resetting opencode settings:", error);
    return NextResponse.json({ error: "Failed to reset opencode settings" }, { status: 500 });
  }
}
