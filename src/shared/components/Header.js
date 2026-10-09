"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import PropTypes from "prop-types";
import ProviderIcon from "@/shared/components/ProviderIcon";
import HeaderMenu from "@/shared/components/HeaderMenu";
import HeaderLanguage from "@/shared/components/HeaderLanguage";
import DonateModal from "@/shared/components/DonateModal";
import { useHeaderSearchStore } from "@/store/headerSearchStore";
import { translate } from "@/i18n/runtime";

const PAGE_META = {
  "/dashboard/endpoint": { title: "Endpoint & Key", subtitle: "API endpoint configuration" },
  "/dashboard": { title: "Endpoint & Key", subtitle: "API endpoint configuration" },
  "/dashboard/providers": { title: "Providers", subtitle: "AI provider management" },
  "/dashboard/combos": { title: "Combo & Vision", subtitle: "Model combo configuration" },
  "/dashboard/usage": { title: "Usage", subtitle: "Request & token analytics" },
  "/dashboard/quota": { title: "Quota Tracker", subtitle: "Provider quota monitoring" },
  "/dashboard/token-saver": { title: "Agent Skills", subtitle: "Token optimization skills" },
  "/dashboard/cli-tools": { title: "CLI Tools", subtitle: "Command-line utilities" },
  "/dashboard/proxy-pools": { title: "Proxy Pools", subtitle: "Proxy pool management" },
  "/dashboard/skills": { title: "Skills", subtitle: "Extension management" },
  "/dashboard/console-log": { title: "Console Log", subtitle: "Live request log" },
  "/dashboard/translator": { title: "Translator", subtitle: "Request translation layer" },
  "/dashboard/profile": { title: "Settings", subtitle: "Application settings" },
  "/dashboard/media-providers": { title: "Media Providers", subtitle: "Image, video & audio providers" },
};

function getPageMeta(pathname) {
  // Exact match first, then longest prefix match
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  const match = Object.keys(PAGE_META)
    .filter((key) => pathname.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_META[match] : { title: "Dashboard", subtitle: "" };
}

export default function Header({ onMenuClick, showMenuButton = true }) {
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState("");
  const [loginMethod, setLoginMethod] = useState("");
  const [donateOpen, setDonateOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadAuthStatus() {
      try {
        const res = await fetch("/api/auth/status", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setDisplayName(data?.displayName || data?.samlName || data?.samlEmail || data?.oidcName || data?.oidcEmail || "");
          setLoginMethod(data?.loginMethod || "");
        }
      } catch {
        if (!cancelled) {
          setDisplayName("");
          setLoginMethod("");
        }
      }
    }
    loadAuthStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        window.location.assign("/login");
      }
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  };

  return (
    <header className="shrink-0 flex items-center justify-between gap-3 px-6 lg:px-8 border-b border-[#222226] bg-[#09090A] text-[#F5F5F7] z-20 h-[69px]">
      {/* Mobile menu button */}
      <div className="flex items-center gap-3 lg:hidden shrink-0">
        {showMenuButton && (
          <button
            onClick={onMenuClick}
            className="text-text-main hover:text-primary transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        )}
      </div>

      {/* Page title header */}
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wider text-[#F5F5F7] uppercase font-mono">
            {getPageMeta(pathname).title}
          </span>
          {getPageMeta(pathname).subtitle && (
            <span className="hidden lg:inline text-xs text-[#68686E] font-mono">
              — {getPageMeta(pathname).subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Right actions (no theme toggle) */}
      <div className="flex items-center gap-2.5 shrink-0">
        {displayName && (loginMethod === "OIDC" || loginMethod === "SAML") && (
          <div
            className="hidden sm:flex items-center max-w-[220px] px-2.5 py-1 border border-[#2E2E33] bg-[#141416] text-xs font-mono text-[#A1A1A6] truncate"
            title={displayName}
          >
            <span className="truncate">{displayName}</span>
            <span className="ml-2 shrink-0 border border-[#C5A880]/30 px-1 text-[9px] text-[#C5A880] uppercase">
              {loginMethod}
            </span>
          </div>
        )}
        <HeaderSearch />
        <HeaderLanguage />
        <HeaderMenu onLogout={handleLogout} />
      </div>
      <DonateModal isOpen={donateOpen} onClose={() => setDonateOpen(false)} />
    </header>
  );
}

function HeaderSearch() {
  const visible = useHeaderSearchStore((s) => s.visible);
  const query = useHeaderSearchStore((s) => s.query);
  const placeholder = useHeaderSearchStore((s) => s.placeholder);
  const setQuery = useHeaderSearchStore((s) => s.setQuery);

  if (!visible) return null;

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-48 px-2.5 py-1 text-xs border border-[#222226] bg-[#141416] text-[#F5F5F7] font-mono focus:border-[#C5A880] focus:outline-none"
      />
    </div>
  );
}

Header.propTypes = {
  onMenuClick: PropTypes.func,
  showMenuButton: PropTypes.bool,
};
