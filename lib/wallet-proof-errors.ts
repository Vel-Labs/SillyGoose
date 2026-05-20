type WalletProofErrorLike = {
  code?: unknown;
  message?: unknown;
  reason?: unknown;
  data?: unknown;
  error?: unknown;
  originalError?: unknown;
};

function isRecord(value: unknown): value is WalletProofErrorLike {
  return typeof value === "object" && value !== null;
}

function readText(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!isRecord(value)) return null;
  if (typeof value.message === "string" && value.message.trim()) return value.message.trim();
  if (typeof value.reason === "string" && value.reason.trim()) return value.reason.trim();
  return readText(value.error) ?? readText(value.data) ?? readText(value.originalError);
}

function readCode(value: unknown): string | null {
  if (!isRecord(value)) return null;
  if (typeof value.code === "number" || typeof value.code === "string") return String(value.code);
  return readCode(value.error) ?? readCode(value.data) ?? readCode(value.originalError);
}

export function describeWalletProofError(error: unknown, step?: string) {
  const code = readCode(error);
  const text = readText(error);
  const prefix = step ? `Wallet proof failed while ${step}. ` : "";

  if (code === "4001") {
    return `${prefix}The request was rejected or canceled in the browser wallet. Select the Ledger-backed account in MetaMask, keep the Ledger Ethereum app open if MetaMask asks for a signature, then try Refresh Wallet Proof again.`;
  }

  if (text) {
    const codeText = code ? ` Wallet error code: ${code}.` : "";
    return `${prefix}${text}${codeText}`;
  }

  return `${prefix}The wallet returned an unreadable failure. Open the browser console for the raw provider error, then try again with the Ledger-backed account selected in MetaMask.`;
}
