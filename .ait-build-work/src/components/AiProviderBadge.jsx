import React from "react";

export function AiProviderBadge({ providerLabel }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-[11px] font-extrabold text-cyan-700 shadow-sm">
      <span className="h-2 w-2 rounded-full bg-cyan-500" />
      AI: {providerLabel}
    </div>
  );
}
