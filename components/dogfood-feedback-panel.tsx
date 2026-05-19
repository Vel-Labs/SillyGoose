"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { StatusBadge } from "@/components/arcade-primitives";

export function DogfoodFeedbackPanel() {
  const [workflow, setWorkflow] = useState("overall-dogfood");
  const [severity, setSeverity] = useState("note");
  const [expected, setExpected] = useState("");
  const [actual, setActual] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitFeedback() {
    setStatus(null);
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/dogfood-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow,
          severity,
          expected,
          actual,
          route: location.pathname,
          serviceMode: location.hostname.includes("vercel.app") ? "vercel" : "local",
          viewport: `${window.innerWidth}x${window.innerHeight}`
        })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not record feedback.");
      setStatus("Feedback recorded.");
      setExpected("");
      setActual("");
    } catch (feedbackError) {
      setError(feedbackError instanceof Error ? feedbackError.message : "Feedback failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="dogfood-feedback-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="dogfood-kicker">Feedback Form</p>
          <h2>Feedback Form</h2>
        </div>
        <StatusBadge tone="ready">Local first</StatusBadge>
      </div>

      <div className="dogfood-input-grid">
        <label>
          Workflow
          <select value={workflow} onChange={(event) => setWorkflow(event.target.value)}>
            <option value="overall-dogfood">Overall feedback</option>
            <option value="wallet-proof">Wallet Proof</option>
            <option value="signed-rivalry">Signed rivalry</option>
            <option value="bread-ledger">$Bread ledger</option>
            <option value="verified-ping">Game invite</option>
            <option value="achievements">Achievements</option>
          </select>
        </label>
        <label>
          Severity
          <select value={severity} onChange={(event) => setSeverity(event.target.value)}>
            <option value="note">Note</option>
            <option value="polish">Polish</option>
            <option value="bug">Bug</option>
            <option value="blocked">Blocked</option>
          </select>
        </label>
      </div>

      <div className="dogfood-text-grid">
        <label>
          Expected
          <textarea value={expected} onChange={(event) => setExpected(event.target.value)} placeholder="What should have happened?" />
        </label>
        <label>
          Actual
          <textarea value={actual} onChange={(event) => setActual(event.target.value)} placeholder="What happened instead?" />
        </label>
      </div>

      <button type="button" className="dogfood-submit-button" onClick={submitFeedback} disabled={isSubmitting}>
        <MessageSquarePlus className="h-4 w-4" />
        {isSubmitting ? "Recording" : "Record Feedback"}
      </button>
      {status ? <p className="dogfood-message">{status}</p> : null}
      {error ? <p className="dogfood-error">{error}</p> : null}
    </div>
  );
}
