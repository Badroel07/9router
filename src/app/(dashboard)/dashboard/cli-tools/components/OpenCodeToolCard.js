"use client";

import { useState, useEffect } from "react";
import { Card, Button, ManualConfigModal } from "@/shared/components";
import Image from "next/image";
import BaseUrlSelect from "./BaseUrlSelect";
import { rememberEndpoint } from "./cliEndpointPresets";
import ApiKeySelect from "./ApiKeySelect";
import { matchKnownEndpoint } from "./cliEndpointMatch";

function formatTokens(num) {
  if (!num || isNaN(num)) return "0";
  if (num >= 1000000) {
    const val = (num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1);
    return `${val}M`;
  }
  if (num >= 1000) {
    return `${Math.round(num / 1000)}k`;
  }
  return String(num);
}

export default function OpenCodeToolCard({
  tool,
  isExpanded,
  onToggle,
  baseUrl,
  apiKeys,
  activeProviders,
  cloudEnabled,
  initialStatus,
  tunnelEnabled,
  tunnelPublicUrl,
  tailscaleEnabled,
  tailscaleUrl,
}) {
  const [status, setStatus] = useState(initialStatus || null);
  const [checking, setChecking] = useState(false);
  const [applying, setApplying] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [message, setMessage] = useState(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState("");
  const [activeModel, setActiveModel] = useState("");
  const [subagentModel, setSubagentModel] = useState("");
  const [fetchedModels, setFetchedModels] = useState([]);
  const [modelSearch, setModelSearch] = useState("");
  const [showManualConfigModal, setShowManualConfigModal] = useState(false);
  const [customBaseUrl, setCustomBaseUrl] = useState("");

  useEffect(() => {
    if (apiKeys?.length > 0 && !selectedApiKey) {
      setSelectedApiKey(apiKeys[0].key);
    }
  }, [apiKeys, selectedApiKey]);

  useEffect(() => {
    if (initialStatus) setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    if (isExpanded) {
      if (!status) checkStatus();
      fetchModelsFromEndpoint();
    }
  }, [isExpanded]);

  // Sync models from existing config
  useEffect(() => {
    if (status?.opencode?.modelsDetail) {
      const details = Object.entries(status.opencode.modelsDetail).map(([id, m]) => ({
        id,
        name: m.name || id,
        limit: m.limit || { context: 128000, output: 16384 },
        modalities: m.modalities || { input: ["text", "image"], output: ["text"] },
      }));
      if (details.length > 0 && fetchedModels.length === 0) {
        setFetchedModels(details);
      }
    }
    if (status?.opencode?.activeModel) {
      setActiveModel(status.opencode.activeModel);
    }
    if (status?.opencode?.subagentModel) {
      setSubagentModel(status.opencode.subagentModel);
    }
  }, [status]);

  const getEffectiveBaseUrl = () => {
    const url = customBaseUrl || baseUrl;
    return url.endsWith("/v1") ? url : `${url}/v1`;
  };

  const getDisplayUrl = () => customBaseUrl || `${baseUrl}/v1`;

  const currentBaseUrl =
    status?.config?.provider?.["67router"]?.options?.baseURL ||
    status?.config?.provider?.["9router"]?.options?.baseURL ||
    "";

  const getConfigStatus = () => {
    if (!status?.installed) return null;
    if (!status.config) return "not_configured";
    if (!status.has67Router && !status.has9Router) return "not_configured";
    const url = currentBaseUrl;
    return matchKnownEndpoint(url, { tunnelPublicUrl, tailscaleUrl }) ? "configured" : "other";
  };

  const configStatus = getConfigStatus();

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/cli-tools/opencode-settings");
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      setStatus({ installed: false, error: error.message });
    } finally {
      setChecking(false);
    }
  };

  const fetchModelsFromEndpoint = async () => {
    setFetchingModels(true);
    setMessage(null);
    try {
      const keyToUse =
        selectedApiKey && selectedApiKey.trim()
          ? selectedApiKey
          : !cloudEnabled
          ? "sk_9router"
          : selectedApiKey;

      const res = await fetch("/api/cli-tools/opencode-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "fetch-models",
          baseUrl: getEffectiveBaseUrl(),
          apiKey: keyToUse,
        }),
      });

      const data = await res.json();
      if (res.ok && Array.isArray(data.models)) {
        setFetchedModels(data.models);
        if (!activeModel && data.models.length > 0) {
          setActiveModel(data.models[0].id);
        }
        if (!subagentModel && data.models.length > 0) {
          setSubagentModel(data.models[0].id);
        }
      } else {
        setMessage({ type: "error", text: data.error || "Failed to fetch models from endpoint" });
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setFetchingModels(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    setMessage(null);
    try {
      const keyToUse =
        selectedApiKey && selectedApiKey.trim()
          ? selectedApiKey
          : !cloudEnabled
          ? "sk_9router"
          : selectedApiKey;

      const effectiveActive = activeModel || (fetchedModels[0]?.id || "");
      const effectiveSubagent = subagentModel || effectiveActive;

      const res = await fetch("/api/cli-tools/opencode-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: getEffectiveBaseUrl(),
          apiKey: keyToUse,
          models: fetchedModels,
          activeModel: effectiveActive,
          subagentModel: effectiveSubagent,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        rememberEndpoint(getEffectiveBaseUrl(), { tunnelPublicUrl, tailscaleUrl });
        setMessage({
          type: "success",
          text: `Settings applied successfully! Synced ${data.modelsCount || fetchedModels.length} models with full specifications to OpenCode.`,
        });
        checkStatus();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to apply settings" });
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setApplying(false);
    }
  };

  const handleReset = async () => {
    setRestoring(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cli-tools/opencode-settings", { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Settings reset successfully!" });
        setActiveModel("");
        setSubagentModel("");
        setFetchedModels([]);
        checkStatus();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to reset settings" });
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setRestoring(false);
    }
  };

  const getManualConfigs = () => {
    const keyToUse =
      selectedApiKey && selectedApiKey.trim()
        ? selectedApiKey
        : !cloudEnabled
        ? "sk_9router"
        : "<API_KEY_FROM_DASHBOARD>";

    const modelsObj = {};
    const modelsSource =
      fetchedModels.length > 0
        ? fetchedModels
        : [{ id: "openai/gpt-4o", limit: { context: 128000, output: 16384 }, modalities: { input: ["text", "image"], output: ["text"] } }];

    modelsSource.forEach((m) => {
      modelsObj[m.id] = {
        name: m.name || m.id,
        limit: {
          context: m.limit?.context || 128000,
          output: m.limit?.output || 16384,
        },
        modalities: m.modalities || { input: ["text", "image"], output: ["text"] },
      };
    });

    const activeModelToShow = activeModel || modelsSource[0]?.id || "openai/gpt-4o";
    const effectiveSubagentModel = subagentModel || activeModelToShow;

    return [
      {
        filename: "~/.config/opencode/opencode.json",
        content: JSON.stringify(
          {
            provider: {
              "67router": {
                npm: "@ai-sdk/openai-compatible",
                options: { baseURL: getEffectiveBaseUrl(), apiKey: keyToUse },
                models: modelsObj,
              },
            },
            model: `67router/${activeModelToShow}`,
            agent: {
              explorer: {
                description: "Fast explorer subagent for codebase exploration",
                mode: "subagent",
                model: `67router/${effectiveSubagentModel}`,
              },
            },
          },
          null,
          2
        ),
      },
    ];
  };

  const filteredModels = fetchedModels.filter((m) =>
    m.id.toLowerCase().includes(modelSearch.toLowerCase())
  );

  return (
    <Card padding="xs" className="overflow-hidden">
      <div
        className="flex items-start justify-between gap-3 hover:cursor-pointer sm:items-center"
        onClick={onToggle}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="size-8 flex items-center justify-center shrink-0">
            <Image
              src="/providers/opencode.png"
              alt={tool.name}
              width={32}
              height={32}
              className="size-8 object-contain rounded-lg"
              sizes="32px"
              onError={(e) => {
                e.target.style.display = "none";
              }}
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="font-medium text-sm">{tool.name}</h3>
              {configStatus === "configured" && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
                  Connected
                </span>
              )}
              {configStatus === "not_configured" && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-full">
                  Not configured
                </span>
              )}
              {configStatus === "other" && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full">
                  Other
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted truncate">{tool.description}</p>
          </div>
        </div>
        <span
          className={`material-symbols-outlined text-text-muted text-[20px] transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        >
          expand_more
        </span>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border flex flex-col gap-4">
          {checking && (
            <div className="flex items-center gap-2 text-text-muted text-xs">
              <span className="material-symbols-outlined animate-spin text-[16px]">
                progress_activity
              </span>
              <span>Checking OpenCode CLI status...</span>
            </div>
          )}

          {!checking && status && !status.installed && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-yellow-500">warning</span>
                  <div className="flex-1">
                    <p className="font-medium text-yellow-600 dark:text-yellow-400">
                      OpenCode CLI not detected locally
                    </p>
                    <p className="text-sm text-text-muted">
                      Manual configuration is still available if 67router is deployed on a remote server.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-9">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowManualConfigModal(true)}
                    className="!bg-yellow-500/20 !border-yellow-500/40 !text-yellow-700 dark:!text-yellow-300 hover:!bg-yellow-500/30"
                  >
                    <span className="material-symbols-outlined text-[18px] mr-1">content_copy</span>
                    Manual Config
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInstallGuide(!showInstallGuide)}
                  >
                    <span className="material-symbols-outlined text-[18px] mr-1">
                      {showInstallGuide ? "expand_less" : "help"}
                    </span>
                    {showInstallGuide ? "Hide" : "How to Install"}
                  </Button>
                </div>
              </div>
              {showInstallGuide && (
                <div className="p-4 bg-surface border border-border rounded-lg">
                  <h4 className="font-medium mb-3">Installation Guide</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-text-muted mb-1">macOS / Linux / Windows:</p>
                      <code className="block px-3 py-2 bg-black/5 dark:bg-white/5 rounded font-mono text-xs">
                        npm install -g opencode-ai
                      </code>
                    </div>
                    <p className="text-text-muted">
                      After installation, run{" "}
                      <code className="px-1 bg-black/5 dark:bg-white/5 rounded">opencode</code> to
                      verify.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!checking && status?.installed && (
            <>
              <div className="flex flex-col gap-3">
                {/* Endpoint selector */}
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-[8rem_auto_1fr] sm:items-center sm:gap-2">
                  <span className="text-xs font-semibold text-text-main sm:text-right sm:text-sm">
                    Endpoint
                  </span>
                  <span className="material-symbols-outlined hidden text-text-muted text-[14px] sm:inline">
                    arrow_forward
                  </span>
                  <BaseUrlSelect
                    value={customBaseUrl || getDisplayUrl()}
                    onChange={(val) => {
                      setCustomBaseUrl(val);
                    }}
                    requiresExternalUrl={tool.requiresExternalUrl}
                    tunnelEnabled={tunnelEnabled}
                    tunnelPublicUrl={tunnelPublicUrl}
                    tailscaleEnabled={tailscaleEnabled}
                    tailscaleUrl={tailscaleUrl}
                    currentUrl={currentBaseUrl}
                  />
                </div>

                {/* API Key */}
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-[8rem_auto_1fr] sm:items-center sm:gap-2">
                  <span className="text-xs font-semibold text-text-main sm:text-right sm:text-sm">
                    API Key
                  </span>
                  <span className="material-symbols-outlined hidden text-text-muted text-[14px] sm:inline">
                    arrow_forward
                  </span>
                  <ApiKeySelect
                    value={selectedApiKey}
                    onChange={setSelectedApiKey}
                    apiKeys={apiKeys}
                    cloudEnabled={cloudEnabled}
                  />
                </div>

                {/* Models fetch & specification overview */}
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-[8rem_auto_1fr] sm:items-start sm:gap-2">
                  <span className="text-xs font-semibold text-text-main sm:text-right sm:text-sm pt-1">
                    Models ({fetchedModels.length})
                  </span>
                  <span className="material-symbols-outlined hidden text-text-muted text-[14px] sm:inline mt-1.5">
                    arrow_forward
                  </span>
                  <div className="flex-1 flex flex-col gap-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={fetchModelsFromEndpoint}
                          loading={fetchingModels}
                          className="!px-2.5 !py-1 text-xs"
                        >
                          <span className="material-symbols-outlined text-[14px] mr-1">
                            sync
                          </span>
                          Fetch All Models
                        </Button>
                        <span className="text-xs text-text-muted">
                          {fetchedModels.length > 0 ? (
                            <>
                              <span className="text-green-500 font-medium">
                                {fetchedModels.length} models
                              </span>{" "}
                              loaded with context & output limits
                            </>
                          ) : (
                            "No models fetched yet"
                          )}
                        </span>
                      </div>

                      {fetchedModels.length > 5 && (
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Filter models..."
                            value={modelSearch}
                            onChange={(e) => setModelSearch(e.target.value)}
                            className="px-2 py-0.5 text-xs bg-surface border border-border rounded w-36 sm:w-44 focus:outline-none focus:border-primary"
                          />
                          {modelSearch && (
                            <button
                              onClick={() => setModelSearch("")}
                              className="absolute right-1 top-1 text-text-muted hover:text-text-main text-[12px]"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Fetched models preview list */}
                    {fetchingModels ? (
                      <div className="flex items-center justify-center p-6 bg-surface/50 border border-border rounded-lg text-xs text-text-muted gap-2">
                        <span className="material-symbols-outlined animate-spin text-[16px]">
                          progress_activity
                        </span>
                        <span>Fetching all models and specifications from endpoint...</span>
                      </div>
                    ) : fetchedModels.length === 0 ? (
                      <div className="p-4 bg-surface/40 border border-border rounded-lg text-xs text-text-muted flex items-center justify-between">
                        <span>
                          Click &quot;Fetch All Models&quot; to discover all available models and their specs from the endpoint.
                        </span>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={fetchModelsFromEndpoint}
                        >
                          Fetch Now
                        </Button>
                      </div>
                    ) : (
                      <div className="max-h-56 overflow-y-auto rounded-lg border border-border bg-surface/40 p-2 space-y-1.5">
                        {filteredModels.length === 0 ? (
                          <div className="text-xs text-text-muted p-2 text-center">
                            No models matching &quot;{modelSearch}&quot;
                          </div>
                        ) : (
                          filteredModels.map((m) => {
                            const isActive = activeModel === m.id;
                            const isSubagent = subagentModel === m.id;
                            const ctx = m.limit?.context;
                            const out = m.limit?.output;
                            const hasVision = m.modalities?.input?.includes("image");

                            return (
                              <div
                                key={m.id}
                                className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded text-xs transition-colors ${
                                  isActive
                                    ? "bg-primary/10 border border-primary/40 text-text-main"
                                    : "bg-surface/80 border border-border/60 hover:border-border text-text-muted hover:text-text-main"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <button
                                    onClick={() => setActiveModel(m.id)}
                                    title={isActive ? "Active Model" : "Click to set as Active Model"}
                                    className={`shrink-0 transition-colors ${
                                      isActive
                                        ? "text-yellow-500 hover:text-yellow-400"
                                        : "text-text-muted hover:text-yellow-500"
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[16px]">
                                      {isActive ? "star" : "star_border"}
                                    </span>
                                  </button>
                                  <span className="font-mono text-xs font-medium truncate select-all">
                                    {m.id}
                                  </span>
                                  {isActive && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-primary text-white shrink-0">
                                      Active
                                    </span>
                                  )}
                                  {isSubagent && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-400 shrink-0">
                                      Explorer
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {ctx && (
                                    <span
                                      className="px-1.5 py-0.5 rounded bg-black/20 dark:bg-white/5 border border-border text-[10px] font-mono text-text-muted"
                                      title={`Context Window: ${ctx.toLocaleString()} tokens`}
                                    >
                                      {formatTokens(ctx)} ctx
                                    </span>
                                  )}
                                  {out && (
                                    <span
                                      className="px-1.5 py-0.5 rounded bg-black/20 dark:bg-white/5 border border-border text-[10px] font-mono text-text-muted"
                                      title={`Max Output: ${out.toLocaleString()} tokens`}
                                    >
                                      {formatTokens(out)} out
                                    </span>
                                  )}
                                  {hasVision && (
                                    <span
                                      className="px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium"
                                      title="Supports image input (vision)"
                                    >
                                      vision
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Model Selector */}
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-[8rem_auto_1fr] sm:items-center sm:gap-2">
                  <span className="text-xs font-semibold text-text-main sm:text-right sm:text-sm">
                    Active Model
                  </span>
                  <span className="material-symbols-outlined hidden text-text-muted text-[14px] sm:inline">
                    arrow_forward
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={activeModel}
                      onChange={(e) => setActiveModel(e.target.value)}
                      className="w-full min-w-0 px-2 py-1.5 bg-surface rounded border border-border text-xs focus:outline-none focus:border-primary"
                    >
                      {fetchedModels.length === 0 ? (
                        <option value="">No models loaded</option>
                      ) : (
                        fetchedModels.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.id} ({formatTokens(m.limit?.context)} ctx, {formatTokens(m.limit?.output)} out)
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Subagent Explorer Model */}
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-[8rem_auto_1fr] sm:items-center sm:gap-2">
                  <span className="text-xs font-semibold text-text-main sm:text-right sm:text-sm">
                    Subagent Model
                  </span>
                  <span className="material-symbols-outlined hidden text-text-muted text-[14px] sm:inline">
                    arrow_forward
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={subagentModel || activeModel}
                      onChange={(e) => setSubagentModel(e.target.value)}
                      className="w-full min-w-0 px-2 py-1.5 bg-surface rounded border border-border text-xs focus:outline-none focus:border-primary"
                    >
                      {fetchedModels.length === 0 ? (
                        <option value="">Same as Active Model</option>
                      ) : (
                        fetchedModels.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.id} ({formatTokens(m.limit?.context)} ctx)
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {message && (
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded text-xs ${
                    message.type === "success"
                      ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                      : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {message.type === "success" ? "check_circle" : "error"}
                  </span>
                  <span>{message.text}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApply}
                  disabled={fetchedModels.length === 0}
                  loading={applying}
                >
                  <span className="material-symbols-outlined text-[14px] mr-1">save</span>
                  Apply to OpenCode
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={!status.has67Router && !status.has9Router}
                  loading={restoring}
                >
                  <span className="material-symbols-outlined text-[14px] mr-1">restore</span>
                  Reset
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowManualConfigModal(true)}
                >
                  <span className="material-symbols-outlined text-[14px] mr-1">content_copy</span>
                  Manual Config
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <ManualConfigModal
        isOpen={showManualConfigModal}
        onClose={() => setShowManualConfigModal(false)}
        title="OpenCode - Manual Configuration"
        configs={getManualConfigs()}
      />
    </Card>
  );
}
