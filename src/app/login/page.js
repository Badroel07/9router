"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input } from "@/shared/components";
import { translate } from "@/i18n/runtime";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasPassword, setHasPassword] = useState(null);
  const [mustChange, setMustChange] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const [resetHint, setResetHint] = useState("");
  const [authMode, setAuthMode] = useState("password");
  const [ssoType, setSsoType] = useState(null);
  const [samlConfigured, setSamlConfigured] = useState(false);
  const [oidcConfigured, setOidcConfigured] = useState(false);
  const [samlLoginLabel, setSamlLoginLabel] = useState("Sign in with SAML SSO");
  const [oidcLoginLabel, setOidcLoginLabel] = useState("Sign in with OIDC");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/status");
      const data = await res.json();
      if (data.authenticated) {
        router.push("/dashboard");
        return;
      }
      setHasPassword(data.hasPassword);
      setAuthMode(data.authMode || "password");
      setSsoType(data.ssoType || null);
      setSamlConfigured(!!data.samlConfigured);
      setOidcConfigured(!!data.oidcConfigured);
      if (data.samlLoginLabel) setSamlLoginLabel(data.samlLoginLabel);
      if (data.oidcLoginLabel) setOidcLoginLabel(data.oidcLoginLabel);
    } catch (err) {
      console.error("Failed to check auth:", err);
      setHasPassword(true);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.mustChangePassword) {
          setMustChange(true);
        } else {
          router.push("/dashboard");
        }
      } else {
        setError(data.error || "Login failed");
        if (data.retryAfter) {
          setRetryAfter(data.retryAfter);
          const timer = setInterval(() => {
            setRetryAfter((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
        if (data.resetHint) {
          setResetHint(data.resetHint);
        }
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Failed to set password");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSamlLogin = () => {
    window.location.href = "/api/auth/saml/start";
  };

  const handleOidcLogin = () => {
    window.location.href = "/api/auth/oidc/start";
  };

  const isSsoEnabled = ["sso", "oidc", "saml", "both"].includes(authMode);
  const activeSsoType = ssoType || (authMode === "saml" ? "saml" : "oidc");

  const samlAvailable = isSsoEnabled && activeSsoType === "saml" && samlConfigured;
  const oidcAvailable = isSsoEnabled && activeSsoType === "oidc" && oidcConfigured;
  const ssoAvailable = samlAvailable || oidcAvailable;

  const passwordAvailable = authMode === "password" || authMode === "both" || !ssoAvailable;

  if (hasPassword === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-4 font-mono text-xs text-[#A1A1A6]">
        <div className="text-center">
          <p>INITIALIZING AUTHENTICATION APPARATUS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080808] p-4 relative overflow-hidden select-none">
      <div className="landing-grid absolute inset-0 pointer-events-none" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8 flex flex-col items-center">
          <img
            src="/logo.png"
            alt="67Router"
            className="w-16 h-16 rounded-xl object-cover border border-[#2E2E33] shadow-md mb-3"
          />
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#F5F5F7]">
            67Router
          </h1>
          <p className="text-xs text-[#A1A1A6] mt-1 font-mono">
            {samlAvailable
              ? "Sign in with SAML 2.0 Single Sign-On"
              : oidcAvailable
              ? "Sign in with your OIDC provider to access the dashboard"
              : "Enter root password to access the gateway"}
          </p>
        </div>

        <Card>
          {mustChange ? (
            <form onSubmit={handleSetNewPassword} className="flex flex-col gap-4 font-mono">
              <p className="text-xs text-amber-500 text-center">
                Set a new root password before accessing the gateway remotely.
              </p>
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase text-text-muted">New password</label>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoFocus
                />
                {error && <p className="text-xs text-red-500">{error}</p>}
              </div>
              <Button type="submit" variant="primary" className="w-full" loading={loading} disabled={!newPassword}>
                COMMIT CREDENTIAL
              </Button>
            </form>
          ) : (
            <div className="flex flex-col gap-4">
              {samlAvailable && (
                <Button type="button" variant="primary" className="w-full" onClick={handleSamlLogin}>
                  {samlLoginLabel}
                </Button>
              )}

              {oidcAvailable && (
                <Button type="button" variant="primary" className="w-full" onClick={handleOidcLogin}>
                  {oidcLoginLabel}
                </Button>
              )}

              {ssoAvailable && passwordAvailable && <div className="h-px bg-border/60" />}

              {passwordAvailable ? (
                <form onSubmit={handleLogin} className="flex flex-col gap-4 font-mono">
                  {isSsoEnabled && !ssoAvailable && (
                    <p className="text-xs text-amber-500 text-center">
                      SSO is enabled, but configuration is incomplete. Root password access active.
                    </p>
                  )}

                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase text-text-muted">Password</label>
                    <Input
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoFocus={!oidcAvailable}
                    />
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    {retryAfter > 0 && (
                      <p className="text-xs text-amber-500">
                        Locked. Retry in <span className="font-mono">{retryAfter}s</span>.
                      </p>
                    )}
                    {resetHint && (
                      <p className="text-[10px] text-text-muted">
                        Forgot password? Open <code className="bg-[#141416] px-1 py-0.5 border border-[#222226] text-[#C5A880]">67router</code> CLI on the host → <b>Settings</b> → <b>Reset Password</b>.
                      </p>
                    )}
                  </div>

                  <Button type="submit" variant="primary" className="w-full" loading={loading} disabled={!password}>
                    AUTHENTICATE
                  </Button>
                </form>
              ) : null}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
