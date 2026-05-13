"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

export function CopyInviteButton({ invitePath, label = "Copy invite" }: { invitePath: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copyInvite() {
    const origin = window.location.origin;
    const invite = `${origin}${invitePath}`;
    try {
      await navigator.clipboard.writeText(invite);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = invite;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Button onClick={copyInvite} variant="secondary">
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : label}
    </Button>
  );
}
