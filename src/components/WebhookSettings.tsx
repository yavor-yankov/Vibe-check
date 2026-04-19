"use client";

import { useState, useEffect } from "react";
import { X, Webhook, CheckCircle, AlertCircle, Loader2, Send } from "lucide-react";

interface WebhookSettingsProps {
  onClose: () => void;
}

type Status = "idle" | "saving" | "saved" | "error" | "testing" | "test_ok" | "test_fail";

export default function WebhookSettings({ onClose }: WebhookSettingsProps) {
  const [url, setUrl] = useState("");
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/webhook")
      .then((r) => r.json())
      .then((data: { webhookUrl: string | null }) => {
        setSavedUrl(data.webhookUrl ?? null);
        setUrl(data.webhookUrl ?? "");
      })
      .catch(() => {/* ignore — just leave blank */})
      .finally(() => setLoading(false));
  }, []);

  const isDirty = url.trim() !== (savedUrl ?? "");

  async function save() {
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/settings/webhook", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: url.trim() || null }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Save failed");
      }
      const data = (await res.json()) as { webhookUrl: string | null };
      setSavedUrl(data.webhookUrl);
      setUrl(data.webhookUrl ?? "");
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Save failed");
      setStatus("error");
    }
  }

  async function testWebhook() {
    const target = url.trim() || savedUrl;
    if (!target) return;
    setStatus("testing");
    setErrorMsg("");
    try {
      const res = await fetch("/api/settings/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: target }),
      });
      const data = (await res.json()) as { delivered?: boolean; error?: string };
      if (data.error) {
        setErrorMsg(data.error);
        setStatus("test_fail");
      } else if (data.delivered) {
        setStatus("test_ok");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setErrorMsg("Webhook endpoint returned a non-2xx response.");
        setStatus("test_fail");
      }
    } catch {
      setErrorMsg("Could not reach the webhook endpoint.");
      setStatus("test_fail");
    }
  }

  const busy = status === "saving" || status === "testing";

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md mx-4 rounded-xl bg-[color:var(--card)] border border-[color:var(--border)] shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-[color:var(--accent)]/10 flex items-center justify-center text-[color:var(--accent)]">
            <Webhook size={18} />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-[color:var(--foreground)]">Webhook Integration</h2>
            <p className="text-xs text-[color:var(--muted)]">
              Receive a POST after every completed vibe check
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[color:var(--border)] transition text-[color:var(--muted)]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-[color:var(--muted)]" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* URL input */}
            <div>
              <label
                htmlFor="webhook-url"
                className="block text-sm font-medium text-[color:var(--foreground)] mb-1.5"
              >
                Endpoint URL
              </label>
              <input
                id="webhook-url"
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (status === "error" || status === "test_fail") setStatus("idle");
                }}
                placeholder="https://hooks.zapier.com/hooks/catch/…"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] text-[color:var(--foreground)] placeholder:text-[color:var(--muted)] focus:outline-none focus:border-[color:var(--accent)] focus:ring-1 focus:ring-[color:var(--accent)]/30"
                disabled={busy}
              />
              <p className="mt-1.5 text-xs text-[color:var(--muted)]">
                Must be an <code className="bg-[color:var(--border)] rounded px-1">https://</code> URL.
                Works with Zapier, Make (Integromat), n8n, or any custom endpoint.
              </p>
            </div>

            {/* Status messages */}
            {(status === "error" || status === "test_fail") && errorMsg && (
              <div className="flex items-start gap-2 text-sm text-[color:var(--bad)]">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {status === "saved" && (
              <div className="flex items-center gap-2 text-sm text-[color:var(--good)]">
                <CheckCircle size={15} />
                <span>Webhook URL saved.</span>
              </div>
            )}
            {status === "test_ok" && (
              <div className="flex items-center gap-2 text-sm text-[color:var(--good)]">
                <CheckCircle size={15} />
                <span>Test payload delivered successfully!</span>
              </div>
            )}

            {/* Payload preview */}
            <details className="group">
              <summary className="cursor-pointer text-xs text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition select-none">
                View example payload
              </summary>
              <pre className="mt-2 p-3 text-[10px] rounded-lg bg-[color:var(--background)] border border-[color:var(--border)] overflow-x-auto text-[color:var(--muted)] leading-relaxed">
{`{
  "event": "vibe_check.completed",
  "timestamp": "2025-04-19T12:00:00.000Z",
  "ideaSummary": "An AI-powered...",
  "report": {
    "verdict": "build_it",
    "verdictLabel": "Build it",
    "scores": { "overall": 8, ... },
    "summary": "...",
    "strengths": [...],
    "risks": [...],
    ...
  }
}`}
              </pre>
            </details>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={testWebhook}
                disabled={busy || (!url.trim() && !savedUrl)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:border-[color:var(--accent)] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {status === "testing" ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Send size={13} />
                )}
                {status === "testing" ? "Sending…" : "Send test"}
              </button>

              <div className="flex-1" />

              {savedUrl && url.trim() === "" && (
                <button
                  type="button"
                  onClick={() => { setUrl(""); save(); }}
                  disabled={busy}
                  className="px-3 py-2 text-sm rounded-lg border border-[color:var(--bad)]/40 text-[color:var(--bad)] hover:bg-[color:var(--bad)]/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Remove
                </button>
              )}

              <button
                type="button"
                onClick={save}
                disabled={busy || !isDirty}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-[color:var(--accent)] text-white hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {status === "saving" ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : null}
                {status === "saving" ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
