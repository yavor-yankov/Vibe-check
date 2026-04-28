"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

/**
 * Client component for account deletion with confirmation modal.
 */
export default function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (res.ok) {
        // Redirect to landing after deletion.
        window.location.href = "/";
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete account");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[color:var(--bad)]/30 text-[color:var(--bad)] text-sm font-medium hover:bg-[color:var(--bad)]/10 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Delete account
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[color:var(--bad)]">Are you sure?</span>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="px-4 py-2 rounded-lg bg-[color:var(--bad)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {deleting ? "Deleting..." : "Yes, delete everything"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="px-4 py-2 rounded-lg border border-[color:var(--border)] text-sm hover:bg-[color:var(--border)] transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
