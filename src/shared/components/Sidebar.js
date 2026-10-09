"use client";

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/utils/cn";
import { UPDATER_CONFIG } from "@/shared/constants/config";
import { MEDIA_PROVIDER_KINDS } from "@/shared/constants/providers";
import { useCopyToClipboard } from "@/shared/hooks/useCopyToClipboard";
import useSettingsStore from "@/store/settingsStore";

const VISIBLE_MEDIA_KINDS = ["embedding", "image", "video", "tts", "stt", "systemone"];
const COMBINED_WEB_ITEM = { id: "web", label: "Web Fetch & Search", icon: "travel_explore", href: "/dashboard/media-providers/web" };

const gatewayItems = [
  { href: "/dashboard/endpoint", label: "Endpoint & Key", icon: "key" },
  { href: "/dashboard/providers", label: "Providers", icon: "dns" },
  { href: "/dashboard/combos", label: "Combo & Vision", icon: "layers" },
  { href: "/dashboard/usage", label: "Usage", icon: "bar_chart" },
  { href: "/dashboard/quota", label: "Quota Tracker", icon: "data_usage" },
  { href: "/dashboard/token-saver", label: "Agent Skills", icon: "smart_toy" },
  { href: "/dashboard/cli-tools", label: "CLI Tools", icon: "terminal" },
];

const systemItems = [
  { href: "/dashboard/proxy-pools", label: "Proxy Pools", icon: "lan" },
  { href: "/dashboard/skills", label: "Skills", icon: "extension" },
  { href: "/dashboard/console-log", label: "Console Log", icon: "monitor" },
  { href: "/dashboard/translator", label: "Translator", icon: "translate" },
  { href: "/dashboard/profile", label: "Settings", icon: "settings" },
];

export default function Sidebar({ onClose }) {
  const pathname = usePathname();
  const [mediaOpen, setMediaOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [enableTranslator, setEnableTranslator] = useState(false);
  const { copied, copy } = useCopyToClipboard(2000);

  const INSTALL_CMD = UPDATER_CONFIG.installCmdLatest;

  useEffect(() => {
    useSettingsStore.getState().fetchSettings().then((data) => {
      if (data?.enableTranslator) setEnableTranslator(true);
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch("/api/version")
        .then((res) => res.json())
        .then((data) => {
          if (data.hasUpdate) setUpdateInfo(data);
        })
        .catch(() => {});
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const isActive = (href) => {
    if (href === "/dashboard/endpoint") {
      return pathname === "/dashboard" || pathname.startsWith("/dashboard/endpoint");
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex w-68 flex-col border-r border-[#222226] bg-[#09090A] text-[#F5F5F7] min-h-full select-none">
      {/* Brand Header */}
      <div className="px-6 py-6 border-b border-[#222226]">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <img
            src="/logo.png"
            alt="67Router"
            className="w-8 h-8 rounded-md object-cover border border-[#2E2E33] group-hover:border-[#C5A880] transition-colors"
          />
          <span className="font-display font-bold text-xl tracking-tight text-[#F5F5F7] group-hover:text-[#E5C378] transition-colors">
            67Router
          </span>
        </Link>

        {updateInfo && (
          <div className="mt-4 p-2.5 border border-[#2E2E33] bg-[#141416] flex flex-col gap-1.5">
            <span className="text-[11px] text-[#E5C378]">
              ↑ Update Available: v{updateInfo.latestVersion}
            </span>
            <button
              onClick={() => copy(INSTALL_CMD)}
              className="text-left text-[10px] text-[#A1A1A6] hover:text-[#F5F5F7] truncate cursor-pointer font-mono"
            >
              {copied ? "✓ Copied command" : INSTALL_CMD}
            </button>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-7 overflow-y-auto custom-scrollbar">
        {/* Gateway Section */}
        <div>
          <div className="px-3 mb-3 text-[11px] tracking-wider text-[#68686E] uppercase font-mono">
            Gateway
          </div>
          <div className="space-y-1">
            {gatewayItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 transition-colors group",
                    active
                      ? "bg-[#141416] text-[#E5C378] border-l-2 border-[#C5A880] font-medium"
                      : "text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#141416]/50"
                  )}
                >
                  <span
                    className={cn(
                      "material-symbols-outlined text-[19px] shrink-0 transition-colors",
                      active ? "text-[#E5C378]" : "text-[#68686E] group-hover:text-[#A1A1A6]"
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className="text-sm tracking-wide">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* System Section */}
        <div>
          <div className="px-3 mb-3 text-[11px] tracking-wider text-[#68686E] uppercase font-mono">
            System
          </div>
          <div className="space-y-1">
            {/* Media Providers accordion */}
            <button
              onClick={() => setMediaOpen((v) => !v)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 transition-colors group cursor-pointer",
                pathname.startsWith("/dashboard/media-providers")
                  ? "bg-[#141416] text-[#E5C378] border-l-2 border-[#C5A880] font-medium"
                  : "text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#141416]/50"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "material-symbols-outlined text-[19px] shrink-0 transition-colors",
                    pathname.startsWith("/dashboard/media-providers")
                      ? "text-[#E5C378]"
                      : "text-[#68686E] group-hover:text-[#A1A1A6]"
                  )}
                >
                  perm_media
                </span>
                <span className="text-sm tracking-wide">
                  Media Fabric
                </span>
              </div>
              <span
                className="material-symbols-outlined text-[16px] text-[#68686E] transition-transform duration-200"
                style={{ transform: mediaOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                expand_more
              </span>
            </button>

            {mediaOpen && (
              <div className="pl-9 pr-2 py-1 space-y-1 border-l border-[#222226] ml-5 my-1">
                {MEDIA_PROVIDER_KINDS.filter((k) => VISIBLE_MEDIA_KINDS.includes(k.id)).map((kind) => (
                  <Link
                    key={kind.id}
                    href={`/dashboard/media-providers/${kind.id}`}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 text-xs transition-colors",
                      pathname.startsWith(`/dashboard/media-providers/${kind.id}`)
                        ? "text-[#E5C378] bg-[#141416]"
                        : "text-[#A1A1A6] hover:text-[#F5F5F7]"
                    )}
                  >
                    <span className="material-symbols-outlined text-[16px] text-[#68686E]">
                      {kind.icon || "radio_button_checked"}
                    </span>
                    <span>{kind.label}</span>
                  </Link>
                ))}
                <Link
                  key={COMBINED_WEB_ITEM.id}
                  href={COMBINED_WEB_ITEM.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 text-xs transition-colors",
                    pathname.startsWith(COMBINED_WEB_ITEM.href)
                      ? "text-[#E5C378] bg-[#141416]"
                      : "text-[#A1A1A6] hover:text-[#F5F5F7]"
                  )}
                >
                  <span className="material-symbols-outlined text-[16px] text-[#68686E]">
                    {COMBINED_WEB_ITEM.icon}
                  </span>
                  <span>{COMBINED_WEB_ITEM.label}</span>
                </Link>
              </div>
            )}

            {systemItems.map((item) => {
              if (item.href === "/dashboard/translator" && !enableTranslator) return null;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 transition-colors group",
                    active
                      ? "bg-[#141416] text-[#E5C378] border-l-2 border-[#C5A880] font-medium"
                      : "text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-[#141416]/50"
                  )}
                >
                  <span
                    className={cn(
                      "material-symbols-outlined text-[19px] shrink-0 transition-colors",
                      active ? "text-[#E5C378]" : "text-[#68686E] group-hover:text-[#A1A1A6]"
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className="text-sm tracking-wide">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </aside>
  );
}

Sidebar.propTypes = {
  onClose: PropTypes.func,
};
