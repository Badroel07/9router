"use client";

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Modal, ConfirmModal, Toggle } from "@/shared/components";
import { useCopyToClipboard } from "@/shared/hooks/useCopyToClipboard";
import useSettingsStore from "@/store/settingsStore";

export default function APIPageClient({ machineId }) {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [activeTab, setActiveTab] = useState("curl");

  const [requireApiKey, setRequireApiKey] = useState(false);
  const [requireLogin, setRequireLogin] = useState(true);
  const [hasPassword, setHasPassword] = useState(true);

  // Tunnel state
  const [tunnelEnabled, setTunnelEnabled] = useState(false);
  const [tunnelUrl, setTunnelUrl] = useState("");
  const [tunnelPublicUrl, setTunnelPublicUrl] = useState("");
  const [tunnelLoading, setTunnelLoading] = useState(false);
  const [showEnableTunnelModal, setShowEnableTunnelModal] = useState(false);
  const [showDisableTunnelModal, setShowDisableTunnelModal] = useState(false);

  // Tailscale state
  const [tsEnabled, setTsEnabled] = useState(false);
  const [tsUrl, setTsUrl] = useState("");
  const [tsLoading, setTsLoading] = useState(false);
  const [showTsModal, setShowTsModal] = useState(false);
  const [showDisableTsModal, setShowDisableTsModal] = useState(false);

  const [visibleKeys, setVisibleKeys] = useState(new Set());
  const [baseUrl, setBaseUrl] = useState("/v1");
  const { copied, copy } = useCopyToClipboard(2000);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(`${window.location.origin}/v1`);
    }
    fetchData();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [settingsData, statusRes] = await Promise.all([
        useSettingsStore.getState().fetchSettings(),
        fetch("/api/tunnel/status", { cache: "no-store" }),
      ]);
      if (settingsData) {
        setRequireApiKey(settingsData.requireApiKey || false);
        setRequireLogin(settingsData.requireLogin !== false);
        setHasPassword(settingsData.hasPassword || false);
      }
      if (statusRes.ok) {
        const data = await statusRes.json();
        setTunnelEnabled(data.tunnel?.settingsEnabled ?? data.tunnel?.enabled ?? false);
        setTunnelUrl(data.tunnel?.tunnelUrl || "");
        setTunnelPublicUrl(data.tunnel?.publicUrl || "");
        setTsEnabled(data.tailscale?.settingsEnabled ?? data.tailscale?.enabled ?? false);
        setTsUrl(data.tailscale?.tunnelUrl || "");
      }
    } catch { /* ignore */ }
  };

  const handleRequireApiKey = async (value) => {
    try {
      const updated = await useSettingsStore.getState().patchSettings({ requireApiKey: value });
      if (updated) setRequireApiKey(value);
    } catch { /* ignore */ }
  };

  const fetchData = async () => {
    try {
      const res = await fetch("/api/keys");
      if (!res.ok) return;
      const data = await res.json();
      let existing = data.keys || [];
      if (existing.length === 0) {
        const createRes = await fetch("/api/keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Default Key" }),
        });
        if (createRes.ok) {
          const fresh = await fetch("/api/keys");
          const freshData = await fresh.json();
          existing = freshData.keys || [];
        }
      }
      setKeys(existing);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const handleEnableTunnel = async () => {
    setShowEnableTunnelModal(false);
    setTunnelLoading(true);
    try {
      const res = await fetch("/api/tunnel/enable", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.tunnelUrl) {
        setTunnelUrl(data.tunnelUrl);
        setTunnelPublicUrl(data.publicUrl || "");
        setTunnelEnabled(true);
      }
    } catch { /* ignore */ } finally {
      setTunnelLoading(false);
    }
  };

  const handleDisableTunnel = async () => {
    setTunnelLoading(true);
    try {
      const res = await fetch("/api/tunnel/disable", { method: "POST" });
      if (res.ok) {
        setTunnelEnabled(false);
        setTunnelUrl("");
        setTunnelPublicUrl("");
        setShowDisableTunnelModal(false);
      }
    } catch { /* ignore */ } finally {
      setTunnelLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedKey(data.key);
        await fetchData();
        setNewKeyName("");
        setShowAddModal(false);
      }
    } catch { /* ignore */ }
  };

  const handleDeleteKey = async (id) => {
    setConfirmState({
      title: "Revoke API Key",
      message: "Are you sure you want to delete this API key?",
      onConfirm: async () => {
        setConfirmState(null);
        try {
          const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
          if (res.ok) setKeys(keys.filter((k) => k.id !== id));
        } catch { /* ignore */ }
      },
    });
  };

  const handleToggleKey = async (id, isActive) => {
    try {
      const res = await fetch(`/api/keys/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (res.ok) setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, isActive } : k)));
    } catch { /* ignore */ }
  };

  const maskKey = (fullKey) => {
    if (!fullKey || fullKey.length <= 10) return fullKey || "";
    return fullKey.slice(0, 6) + "••••••••••••" + fullKey.slice(-4);
  };

  const toggleKeyVisibility = (keyId) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(keyId)) next.delete(keyId);
      else next.add(keyId);
      return next;
    });
  };

  const activeKeyStr = keys.find((k) => k.isActive !== false)?.key || "sk-67router-demo-token";

  const getHarnessCode = () => {
    if (activeTab === "curl") {
      return `curl ${baseUrl}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${activeKeyStr}" \\
  -d '{"model": "claude-3-7-sonnet-20250219", "messages": [{"role": "user", "content": "Hello 67Router"}]}'`;
    }
    if (activeTab === "python") {
      return `import openai

client = openai.OpenAI(base_url="${baseUrl}", api_key="${activeKeyStr}")
resp = client.chat.completions.create(
    model="claude-3-7-sonnet-20250219",
    messages=[{"role": "user", "content": "Hello 67Router"}]
)
print(resp.choices[0].message.content)`;
    }
    return `import OpenAI from "openai";

const openai = new OpenAI({ baseURL: "${baseUrl}", apiKey: "${activeKeyStr}" });
const res = await openai.chat.completions.create({
  model: "claude-3-7-sonnet-20250219",
  messages: [{ role: "user", content: "Hello 67Router" }]
});
console.log(res.choices[0].message.content);`;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 font-mono text-xs text-[#A1A1A6] py-12">
        <span className="w-1.5 h-1.5 bg-[#C5A880]" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12 select-none">
      {/* 1. ENDPOINT SECTION */}
      <div className="border border-[#222226] bg-[#0F0F10]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#222226]">
          <h2 className="text-xs font-semibold text-[#F5F5F7] tracking-wider uppercase font-mono">
            Endpoints
          </h2>
          <span className="text-[11px] text-[#10B981] font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#10B981] inline-block" />
            ONLINE
          </span>
        </div>

        <div className="divide-y divide-[#222226]">
          {/* Local Loopback */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-mono text-[#A1A1A6] uppercase min-w-[120px]">
              Local
            </span>
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <input
                type="text"
                readOnly
                value={baseUrl}
                className="flex-1 px-3 py-1.5 border border-[#222226] bg-[#080808] text-xs font-mono text-[#E5C378] select-all focus:outline-none"
              />
              <button
                onClick={() => copy(baseUrl, "local")}
                className="px-3 py-1.5 border border-[#2E2E33] hover:border-[#C5A880] bg-[#141416] text-xs font-mono text-[#F5F5F7] transition-colors cursor-pointer shrink-0"
              >
                {copied === "local" ? "COPIED" : "COPY"}
              </button>
            </div>
          </div>

          {/* Cloudflare Tunnel */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-mono text-[#A1A1A6] uppercase min-w-[120px]">
              Cloudflare
            </span>
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <input
                type="text"
                readOnly
                value={tunnelEnabled && (tunnelPublicUrl || tunnelUrl) ? `${tunnelPublicUrl || tunnelUrl}/v1` : "Tunnel offline"}
                className="flex-1 px-3 py-1.5 border border-[#222226] bg-[#080808] text-xs font-mono text-[#A1A1A6] select-all focus:outline-none"
              />
              {tunnelEnabled ? (
                <>
                  <button
                    onClick={() => copy(`${tunnelPublicUrl || tunnelUrl}/v1`, "tunnel")}
                    className="px-3 py-1.5 border border-[#2E2E33] hover:border-[#C5A880] bg-[#141416] text-xs font-mono text-[#F5F5F7] transition-colors cursor-pointer shrink-0"
                  >
                    {copied === "tunnel" ? "COPIED" : "COPY"}
                  </button>
                  <button
                    onClick={() => setShowDisableTunnelModal(true)}
                    className="px-3 py-1.5 border border-red-500/30 hover:border-red-500 text-xs font-mono text-red-400 transition-colors cursor-pointer shrink-0"
                  >
                    DISABLE
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowEnableTunnelModal(true)}
                  className="px-3 py-1.5 bg-[#E5C378] hover:bg-[#C5A880] text-[#080808] text-xs font-mono font-semibold transition-colors cursor-pointer shrink-0"
                >
                  ENABLE
                </button>
              )}
            </div>
          </div>

          {/* Tailscale */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-mono text-[#A1A1A6] uppercase min-w-[120px]">
              Tailscale
            </span>
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <input
                type="text"
                readOnly
                value={tsEnabled && tsUrl ? `${tsUrl}/v1` : "Tailscale standby"}
                className="flex-1 px-3 py-1.5 border border-[#222226] bg-[#080808] text-xs font-mono text-[#A1A1A6] select-all focus:outline-none"
              />
              {tsEnabled ? (
                <>
                  <button
                    onClick={() => copy(`${tsUrl}/v1`, "ts")}
                    className="px-3 py-1.5 border border-[#2E2E33] hover:border-[#C5A880] bg-[#141416] text-xs font-mono text-[#F5F5F7] transition-colors cursor-pointer shrink-0"
                  >
                    {copied === "ts" ? "COPIED" : "COPY"}
                  </button>
                  <button
                    onClick={() => setShowDisableTsModal(true)}
                    className="px-3 py-1.5 border border-red-500/30 hover:border-red-500 text-xs font-mono text-red-400 transition-colors cursor-pointer shrink-0"
                  >
                    DISABLE
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowTsModal(true)}
                  className="px-3 py-1.5 border border-[#2E2E33] hover:border-[#C5A880] bg-[#141416] text-xs font-mono text-[#F5F5F7] transition-colors cursor-pointer shrink-0"
                >
                  CONNECT
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. API KEYS SECTION */}
      <div className="border border-[#222226] bg-[#0F0F10]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#222226]">
          <div className="flex items-center gap-4">
            <h2 className="text-xs font-semibold text-[#F5F5F7] tracking-wider uppercase font-mono">
              API Keys
            </h2>
            <div className="flex items-center gap-2 font-mono text-xs text-[#A1A1A6]">
              <span>Auth Required:</span>
              <Toggle
                size="sm"
                checked={requireApiKey}
                onChange={() => handleRequireApiKey(!requireApiKey)}
              />
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-[#E5C378] hover:bg-[#C5A880] text-[#080808] font-mono text-xs font-semibold uppercase transition-colors cursor-pointer"
          >
            + Create Key
          </button>
        </div>

        {/* Minimal Keys List */}
        <div className="divide-y divide-[#222226]">
          {keys.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#68686E] font-mono">
              No API keys configured.
            </div>
          ) : (
            keys.map((k) => {
              const isVisible = visibleKeys.has(k.id);
              const isPaused = k.isActive === false;
              return (
                <div
                  key={k.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs ${
                    isPaused ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-[#F5F5F7] min-w-[120px]">
                      {k.name}
                    </span>
                    <code className="text-[#A1A1A6] bg-[#080808] px-2 py-0.5 border border-[#222226]">
                      {isVisible ? k.key : maskKey(k.key)}
                    </code>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleKeyVisibility(k.id)}
                      className="px-2 py-1 text-[11px] text-[#A1A1A6] hover:text-[#E5C378] cursor-pointer"
                    >
                      {isVisible ? "Hide" : "Show"}
                    </button>
                    <button
                      onClick={() => copy(k.key, k.id)}
                      className="px-2 py-1 text-[11px] text-[#A1A1A6] hover:text-[#E5C378] cursor-pointer"
                    >
                      {copied === k.id ? "Copied" : "Copy"}
                    </button>
                    <button
                      onClick={() => handleToggleKey(k.id, isPaused)}
                      className="px-2 py-1 text-[11px] text-[#68686E] hover:text-[#F5F5F7] cursor-pointer"
                    >
                      {isPaused ? "Resume" : "Pause"}
                    </button>
                    <button
                      onClick={() => handleDeleteKey(k.id)}
                      className="p-1 text-[#68686E] hover:text-red-400 cursor-pointer ml-1"
                      title="Delete key"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. QUICK CODE EXAMPLE */}
      <div className="border border-[#222226] bg-[#0F0F10]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#222226]">
          <h2 className="text-xs font-semibold text-[#F5F5F7] tracking-wider uppercase font-mono">
            Example Request
          </h2>
          <div className="flex items-center gap-1 font-mono text-xs">
            {["curl", "python", "node"].map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveTab(lang)}
                className={`px-2 py-0.5 text-xs uppercase cursor-pointer ${
                  activeTab === lang
                    ? "text-[#E5C378] border-b border-[#E5C378]"
                    : "text-[#68686E] hover:text-[#A1A1A6]"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-[#080808] relative font-mono text-xs text-[#E5C378] overflow-x-auto">
          <pre className="whitespace-pre">{getHarnessCode()}</pre>
          <button
            onClick={() => copy(getHarnessCode(), "harness")}
            className="absolute top-3 right-3 px-2 py-1 border border-[#2E2E33] bg-[#141416] hover:border-[#C5A880] text-[11px] font-mono text-[#F5F5F7] cursor-pointer"
          >
            {copied === "harness" ? "COPIED" : "COPY"}
          </button>
        </div>
      </div>

      {/* MODALS */}
      <Modal
        isOpen={showAddModal}
        title="Create API Key"
        onClose={() => {
          setShowAddModal(false);
          setNewKeyName("");
        }}
      >
        <div className="flex flex-col gap-4 font-mono text-xs">
          <div>
            <label className="text-[#A1A1A6] block mb-1">Key Name</label>
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g. Production Key"
              className="w-full px-3 py-2 border border-[#222226] bg-[#080808] text-xs text-[#F5F5F7] focus:border-[#C5A880] focus:outline-none"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleCreateKey}
              disabled={!newKeyName.trim()}
              className="flex-1 py-2 bg-[#E5C378] hover:bg-[#C5A880] text-[#080808] font-bold uppercase cursor-pointer disabled:opacity-40"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowAddModal(false);
                setNewKeyName("");
              }}
              className="px-4 py-2 border border-[#2E2E33] text-[#A1A1A6] uppercase cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!createdKey}
        title="API Key Created"
        onClose={() => setCreatedKey(null)}
      >
        <div className="flex flex-col gap-4 font-mono text-xs">
          <p className="text-amber-400">Save this key now. It will not be shown again.</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={createdKey || ""}
              readOnly
              className="flex-1 px-3 py-2 border border-[#222226] bg-[#080808] text-xs text-[#E5C378] select-all focus:outline-none"
            />
            <button
              onClick={() => copy(createdKey, "created_key")}
              className="px-3 py-2 bg-[#E5C378] text-[#080808] font-bold uppercase cursor-pointer shrink-0"
            >
              {copied === "created_key" ? "COPIED" : "COPY"}
            </button>
          </div>
          <button
            onClick={() => setCreatedKey(null)}
            className="w-full py-2 border border-[#2E2E33] text-[#F5F5F7] uppercase cursor-pointer"
          >
            Done
          </button>
        </div>
      </Modal>

      {/* Enable Tunnel Modal */}
      <Modal
        isOpen={showEnableTunnelModal}
        title="Enable Cloudflare Tunnel"
        onClose={() => setShowEnableTunnelModal(false)}
      >
        <div className="flex flex-col gap-4 font-mono text-xs">
          <p className="text-[#A1A1A6]">Expose your local 67Router gateway through a secure Cloudflare tunnel.</p>
          <div className="flex gap-2">
            <button
              onClick={handleEnableTunnel}
              className="flex-1 py-2 bg-[#E5C378] hover:bg-[#C5A880] text-[#080808] font-bold uppercase cursor-pointer"
            >
              Start Tunnel
            </button>
            <button
              onClick={() => setShowEnableTunnelModal(false)}
              className="px-4 py-2 border border-[#2E2E33] text-[#A1A1A6] uppercase cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Disable Tunnel Modal */}
      <Modal
        isOpen={showDisableTunnelModal}
        title="Disable Cloudflare Tunnel"
        onClose={() => !tunnelLoading && setShowDisableTunnelModal(false)}
      >
        <div className="flex flex-col gap-4 font-mono text-xs">
          <p className="text-[#A1A1A6]">Disconnect the public tunnel endpoint?</p>
          <div className="flex gap-2">
            <button
              onClick={handleDisableTunnel}
              disabled={tunnelLoading}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold uppercase cursor-pointer"
            >
              Disable
            </button>
            <button
              onClick={() => setShowDisableTunnelModal(false)}
              className="px-4 py-2 border border-[#2E2E33] text-[#A1A1A6] uppercase cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Tailscale Modals */}
      <Modal
        isOpen={showTsModal}
        title="Connect Tailscale"
        onClose={() => setShowTsModal(false)}
      >
        <div className="flex flex-col gap-4 font-mono text-xs">
          <p className="text-[#A1A1A6]">Connect node to your private Tailscale network.</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setTsEnabled(true);
                setShowTsModal(false);
              }}
              className="flex-1 py-2 bg-[#E5C378] hover:bg-[#C5A880] text-[#080808] font-bold uppercase cursor-pointer"
            >
              Connect
            </button>
            <button
              onClick={() => setShowTsModal(false)}
              className="px-4 py-2 border border-[#2E2E33] text-[#A1A1A6] uppercase cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDisableTsModal}
        title="Disconnect Tailscale"
        onClose={() => setShowDisableTsModal(false)}
      >
        <div className="flex flex-col gap-4 font-mono text-xs">
          <p className="text-[#A1A1A6]">Disconnect node from Tailscale network?</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setTsEnabled(false);
                setShowDisableTsModal(false);
              }}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold uppercase cursor-pointer"
            >
              Disconnect
            </button>
            <button
              onClick={() => setShowDisableTsModal(false)}
              className="px-4 py-2 border border-[#2E2E33] text-[#A1A1A6] uppercase cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={confirmState?.onConfirm}
        title={confirmState?.title || "Confirm"}
        message={confirmState?.message}
        variant="danger"
      />
    </div>
  );
}

APIPageClient.propTypes = {
  machineId: PropTypes.string.isRequired,
};
