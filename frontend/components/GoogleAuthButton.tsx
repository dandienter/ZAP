"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  LogOut,
  ChevronDown,
  X,
  ShieldCheck,
  Check,
  Key,
  ExternalLink,
  Lock,
  Settings,
} from "lucide-react";

export interface ZAPUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: "google" | "chatgpt";
  tier: "standard" | "pro";
}

interface GoogleAuthButtonProps {
  onUserChange?: (user: ZAPUser | null) => void;
  className?: string;
  variant?: "default" | "sidebar-profile" | "avatar-only";
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          prompt: () => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              shape?: string;
              text?: string;
              width?: number;
              logo_alignment?: string;
            }
          ) => void;
        };
      };
    };
  }
}

// Decode Google JWT
function decodeGoogleJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.warn("Gagal mengurai JWT Google:", e);
    return null;
  }
}

export default function GoogleAuthButton({
  onUserChange,
  className = "",
  variant = "default",
}: GoogleAuthButtonProps) {
  const [user, setUser] = useState<ZAPUser | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Client ID State
  const [clientId, setClientId] = useState("");
  const [clientIdInput, setClientIdInput] = useState("");
  const [isGsiReady, setIsGsiReady] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const gsiNativeBtnRef = useRef<HTMLDivElement>(null);

  // Handle Google Credential Response (Real Google Login)
  const handleGoogleCredentialResponse = useCallback(
    (response: { credential: string }) => {
      const payload = decodeGoogleJwt(response.credential);
      if (payload) {
        const realGoogleUser: ZAPUser = {
          id: payload.sub || "usr_" + Math.random().toString(36).substring(2, 9),
          name: payload.name || "Pengguna Google",
          email: payload.email || "user@gmail.com",
          avatar: payload.picture || undefined,
          provider: "google",
          tier: "standard",
        };

        localStorage.setItem("zap_authenticated_user", JSON.stringify(realGoogleUser));
        setUser(realGoogleUser);
        onUserChange?.(realGoogleUser);
        setShowConfigModal(false);
      }
    },
    [onUserChange]
  );

  // 1. Load User & Google Client ID on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("zap_authenticated_user");
      const savedClientId =
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
        localStorage.getItem("zap_google_client_id") ||
        "";

      if (savedClientId) {
        setClientId(savedClientId);
        setClientIdInput(savedClientId);
      }

      if (savedUser) {
        const parsed: ZAPUser = JSON.parse(savedUser);
        setUser(parsed);
        onUserChange?.(parsed);
      }
    } catch (e) {
      console.warn("Failed reading auth data from localStorage:", e);
    }
  }, [onUserChange]);

  // 2. Initialize Google Identity Services (GSI) when Client ID is available
  useEffect(() => {
    if (!clientId.trim() || user) return;

    let timer: NodeJS.Timeout;

    const setupGoogleGSI = () => {
      if (typeof window !== "undefined" && window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId.trim(),
            callback: handleGoogleCredentialResponse,
            auto_select: false,
          });

          setIsGsiReady(true);

          // Render Native Google Sign-In Button directly
          if (gsiNativeBtnRef.current) {
            gsiNativeBtnRef.current.innerHTML = "";
            window.google.accounts.id.renderButton(gsiNativeBtnRef.current, {
              theme: "outline",
              size: "medium",
              shape: "pill",
              text: "signin_with",
              logo_alignment: "left",
            });
          }

          // Trigger One Tap if appropriate
          window.google.accounts.id.prompt();
        } catch (err) {
          console.warn("GSI initialization error:", err);
        }
      } else {
        timer = setTimeout(setupGoogleGSI, 300);
      }
    };

    setupGoogleGSI();

    return () => clearTimeout(timer);
  }, [clientId, user, handleGoogleCredentialResponse]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Save Client ID and activate real login
  const handleSaveClientId = () => {
    const trimmed = clientIdInput.trim();
    if (!trimmed) return;

    localStorage.setItem("zap_google_client_id", trimmed);
    setClientId(trimmed);
    setShowConfigModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("zap_authenticated_user");
    setUser(null);
    onUserChange?.(null);
    setDropdownOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {variant === "sidebar-profile" ? (
        // VARIANT A: SIDEBAR PROFILE CHIP (SESUAI GAMBAR GEMINI)
        <div className="relative w-full">
          <div
            onClick={() => (user ? setDropdownOpen(!dropdownOpen) : setShowConfigModal(true))}
            className="flex items-center justify-between w-full px-2 py-1.5 rounded-full hover:bg-[#282a2c] cursor-pointer transition group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-blue-500/30 flex-shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-medium text-xs flex-shrink-0 shadow-sm">
                  {user?.name ? user.name.charAt(0) : "W"}
                </div>
              )}
              <div className="min-w-0 text-left">
                <div className="text-xs font-medium text-[#e3e3e3] truncate">
                  {user?.name || "Wakhid Pangestu"}
                </div>
                <div className="text-[11px] text-[#8e918f] leading-none mt-0.5">
                  {user?.tier === "pro" ? "Pro" : "Plus"}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowConfigModal(true);
              }}
              title="Pengaturan Akun & Kunci API"
              className="p-1 rounded-full text-[#8e918f] group-hover:text-white hover:bg-[#333538] transition flex-shrink-0"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* User Profile Dropdown (Pops UP above sidebar bottom) */}
          {dropdownOpen && (
            <div className="absolute left-0 bottom-full mb-2 w-64 bg-[#1e1f20] border border-[#3c4043] rounded-2xl shadow-2xl p-3 z-50 text-xs text-[#e3e3e3] animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#282a2c]">
                {user?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-blue-500/30"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    {user?.name ? user.name.charAt(0) : "W"}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="font-semibold text-[#e3e3e3] truncate">
                    {user?.name || "Wakhid Pangestu"}
                  </p>
                  <p className="text-[10px] text-[#8e918f] truncate">{user?.email || "Google Account"}</p>
                </div>
              </div>

              <div className="py-2 border-b border-[#282a2c] flex items-center justify-between text-[11px] text-[#c4c7c5]">
                <span className="text-[#8e918f]">Status Akun:</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>{user ? "Google Terhubung" : "Plus Plan"}</span>
                </span>
              </div>

              <div className="pt-2 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    setShowConfigModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Pengaturan Kredensial & Kunci API</span>
                </button>
                {user && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar Akun</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : variant === "avatar-only" ? (
        // VARIANT B: TOP-RIGHT AVATAR ONLY
        <div className="relative">
          <button
            type="button"
            onClick={() => (user ? setDropdownOpen(!dropdownOpen) : setShowConfigModal(true))}
            className="w-8 h-8 rounded-full ring-2 ring-[#3c4043] hover:ring-blue-500/70 transition flex items-center justify-center overflow-hidden"
            title={user ? user.name : "Akun Google"}
          >
            {user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                {user?.name ? user.name.charAt(0) : "W"}
              </div>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-[#1e1f20] border border-[#3c4043] rounded-2xl shadow-2xl p-3 z-50 text-xs text-[#e3e3e3]">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#282a2c]">
                <div className="overflow-hidden">
                  <p className="font-semibold text-[#e3e3e3] truncate">
                    {user?.name || "Wakhid Pangestu"}
                  </p>
                  <p className="text-[10px] text-[#8e918f] truncate">{user?.email || "Google Account"}</p>
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    setShowConfigModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Pengaturan Akun & API</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : user ? (
        // VARIANT DEFAULT: STATE 1: LOGGED-IN DENGAN AKUN ASLI
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-blue-500/50 transition-all text-xs text-slate-200 shadow-sm"
          >
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={user.name}
                className="w-5 h-5 rounded-full object-cover ring-1 ring-blue-500/40"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                {user.name.charAt(0)}
              </div>
            )}
            <span className="font-medium max-w-[120px] truncate">{user.name}</span>
            <div className="flex items-center gap-1 pl-1 border-l border-slate-700">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Google</span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* User Profile Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 text-xs text-slate-300 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-800">
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-blue-500/30"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="font-semibold text-slate-100 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                </div>
              </div>

              <div className="py-2 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
                <span className="text-slate-400">Status Akun:</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Google Akun Asli</span>
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="w-full mt-2 flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar Akun</span>
              </button>
            </div>
          )}
        </div>
      ) : clientId && isGsiReady ? (
        // STATE 2: GOOGLE CLIENT ID TERPASANG — TOMBOL RESMI GOOGLE NATIVE
        <div ref={gsiNativeBtnRef} className="flex items-center min-h-[32px]" />
      ) : (
        // STATE 3: BELUM ADA CLIENT ID — TOMBOL HUBUNGKAN GOOGLE OAUTH
        <button
          onClick={() => setShowConfigModal(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs shadow-sm hover:shadow transition-all group"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Masuk dengan Akun Google Asli</span>
        </button>
      )}

      {/* MODAL SETUP GOOGLE OAUTH CLIENT ID UNTUK AKUN ASLI */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center space-y-1.5 mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white shadow-md mb-2">
                <svg className="w-7 h-7" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-100">
                Hubungkan Akun Google Asli
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Agar perambanmu dapat membuka jendela login asli Google (<code>accounts.google.com</code>), Google mewajibkan <strong>OAuth Client ID</strong> dari Google Cloud Console.
              </p>
            </div>

            {/* Form Input Client ID */}
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Google OAuth Client ID:
                </label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 text-blue-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="xxxx-yyyy.apps.googleusercontent.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Instructions on how to get it in 30 seconds */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-2">
                <div className="flex items-center justify-between font-semibold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Cara Dapat Client ID Gratis (1 Menit):</span>
                  </span>
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-0.5 underline text-[10px]"
                  >
                    <span>Buka Google Cloud</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[10px] leading-relaxed">
                  <li>Buka <strong>Google Cloud Console Credentials</strong>.</li>
                  <li>Klik <strong>Create Credentials</strong> &rarr; <strong>OAuth client ID</strong>.</li>
                  <li>Pilih <strong>Web application</strong>.</li>
                  <li>Tambahkan Authorized JavaScript origin: <code className="text-blue-300">http://localhost:3000</code>.</li>
                  <li>Salin <strong>Client ID</strong> dan tempelkan pada kolom di atas!</li>
                </ol>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleSaveClientId}
                disabled={!clientIdInput.trim()}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Aktifkan Jendela Login Google Asli</span>
              </button>

              <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Otentikasi diproses langsung oleh Google tanpa perantara pihak ketiga.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
