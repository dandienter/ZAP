import React from "react";

/**
 * ChatZAP Platform Bespoke Micro-Visuals
 * Designed under Impeccable & UI-Taste principles:
 * - Anti-slop: Simple, clean, modern, pure monochrome iconography
 * - Precision drafting line weights (1.25px - 1.5px)
 * - True mathematical & cryptographic geometry matching Linear, Centaur, and x.ai
 */

export function ZeroAnswerEmblem({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      className={className}
      aria-label="Zero-Answer Policy Emblem"
    >
      {/* Outer precision compass reticle */}
      <circle cx="16" cy="16" r="14" strokeWidth="1.2" strokeOpacity="0.25" strokeDasharray="2 3" />
      <circle cx="16" cy="16" r="11" strokeWidth="1.25" strokeOpacity="0.4" />

      {/* 4 cardinal alignment ticks */}
      <line x1="16" y1="2" x2="16" y2="4.5" strokeWidth="1.25" strokeLinecap="round" />
      <line x1="16" y1="27.5" x2="16" y2="30" strokeWidth="1.25" strokeLinecap="round" />
      <line x1="2" y1="16" x2="4.5" y2="16" strokeWidth="1.25" strokeLinecap="round" />
      <line x1="27.5" y1="16" x2="30" y2="16" strokeWidth="1.25" strokeLinecap="round" />

      {/* Central Non-Equal / Anti-Leak Barrier: (= with slash) */}
      <line x1="11.5" y1="14" x2="20.5" y2="14" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11.5" y1="18" x2="20.5" y2="18" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="21" x2="20" y2="11" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
    </svg>
  );
}

export function SymPyCasEmblem({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      className={className}
      aria-label="SymPy CAS Deterministic Kernel"
    >
      {/* Logic Gate / Processor Node Outline */}
      <rect x="4" y="4" width="24" height="24" rx="5" strokeWidth="1.25" strokeOpacity="0.4" />
      <rect x="8" y="8" width="16" height="16" rx="3" strokeWidth="1.2" strokeOpacity="0.3" />

      {/* Bus node traces */}
      <line x1="16" y1="1" x2="16" y2="4" strokeWidth="1.25" />
      <line x1="16" y1="28" x2="16" y2="31" strokeWidth="1.25" />
      <line x1="1" y1="16" x2="4" y2="16" strokeWidth="1.25" />
      <line x1="28" y1="16" x2="31" y2="16" strokeWidth="1.25" />

      {/* Elegant Mathematical Integral & Derivative Gate */}
      <path
        d="M18.5 11c0-1.1-.9-2-2-2s-1.8.8-1.9 1.8l-.2 8.4c0 1.1-.9 2-2 2s-1.9-.9-1.9-2"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="20.5" cy="16" r="1.25" fill="currentColor" strokeOpacity="0.7" />
      <circle cx="11.5" cy="16" r="1.25" fill="currentColor" strokeOpacity="0.7" />
    </svg>
  );
}

export function SmartboardSpatialEmblem({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      className={className}
      aria-label="Papan Tulis Smartboard 2D & 3D"
    >
      {/* Isometric 3D Coordinate Prism Wireframe */}
      {/* Top face */}
      <polygon points="16,3 27,9.5 16,16 5,9.5" strokeWidth="1.2" strokeOpacity="0.4" />
      {/* Front left face */}
      <polygon points="5,9.5 16,16 16,28.5 5,22" strokeWidth="1.2" strokeOpacity="0.25" />
      {/* Front right face */}
      <polygon points="16,16 27,9.5 27,22 16,28.5" strokeWidth="1.2" strokeOpacity="0.5" />

      {/* Coordinate axes intersecting at center (16, 16) */}
      <line x1="16" y1="16" x2="16" y2="3.5" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="16" x2="26.5" y2="22" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="16" x2="5.5" y2="22" strokeWidth="1.5" strokeLinecap="round" />

      {/* Parametric Curve slice arc */}
      <path
        d="M9 14c3.5 2 10.5 2 14-2"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 2"
        strokeOpacity="0.7"
      />
    </svg>
  );
}

export function ScratchpadPenEmblem({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      aria-label="Scratchpad Derivasi"
    >
      {/* Drafting tablet plate */}
      <rect x="3" y="3" width="18" height="18" rx="3.5" strokeWidth="1.25" strokeOpacity="0.3" />
      <line x1="7" y1="8" x2="12" y2="8" strokeWidth="1.25" strokeLinecap="round" strokeOpacity="0.5" />
      <line x1="7" y1="12" x2="17" y2="12" strokeWidth="1.25" strokeLinecap="round" strokeOpacity="0.5" />
      <line x1="7" y1="16" x2="14" y2="16" strokeWidth="1.25" strokeLinecap="round" strokeOpacity="0.5" />
      {/* Precision stylus nib */}
      <path
        d="M17.5 4.5l2 2-7.5 7.5H10v-2l7.5-7.5z"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SocraticDialogueEmblem({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      aria-label="Tutor Sokrates Dialektika"
    >
      {/* Concentric dialectic question waves */}
      <circle cx="12" cy="12" r="9" strokeWidth="1.2" strokeOpacity="0.25" />
      <path
        d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.6-2.5 2.2-2.5 3.5"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" />
      {/* Spark resonance */}
      <line x1="12" y1="1" x2="12" y2="2.5" strokeWidth="1.25" strokeLinecap="round" strokeOpacity="0.6" />
      <line x1="22" y1="12" x2="20.5" y2="12" strokeWidth="1.25" strokeLinecap="round" strokeOpacity="0.6" />
    </svg>
  );
}

export function LocalEnclaveEmblem({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      aria-label="BYOK Local Storage Enclave"
    >
      {/* Hardware security module chip */}
      <rect x="5" y="5" width="14" height="14" rx="3" strokeWidth="1.3" strokeOpacity="0.4" />
      <line x1="9" y1="2" x2="9" y2="5" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="15" y1="2" x2="15" y2="5" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="9" y1="19" x2="9" y2="22" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="15" y1="19" x2="15" y2="22" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="2" y1="9" x2="5" y2="9" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="2" y1="15" x2="5" y2="15" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="19" y1="9" x2="22" y2="9" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="19" y1="15" x2="22" y2="15" strokeWidth="1.2" strokeLinecap="round" />
      {/* Vault Keyhole */}
      <circle cx="12" cy="10.5" r="1.75" strokeWidth="1.3" />
      <path d="M12 12.25v2.75" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function SovereignAuditEmblem({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      aria-label="Kepatuhan UU PDP Indonesia"
    >
      {/* Faceted sovereign shield */}
      <path
        d="M12 2.5l8 3.5v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10v-6l8-3.5z"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.4"
      />
      {/* Inner Verification Check */}
      <path
        d="M8.5 12.5l2.5 2.5 5-5"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
