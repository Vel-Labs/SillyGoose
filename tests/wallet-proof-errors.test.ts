import { describe, expect, it } from "vitest";
import { describeWalletProofError } from "@/lib/wallet-proof-errors";

describe("wallet proof error descriptions", () => {
  it("keeps string errors from wallet providers", () => {
    expect(describeWalletProofError("Ledger device: UNKNOWN_ERROR", "signing the proof message in MetaMask")).toContain("Ledger device: UNKNOWN_ERROR");
  });

  it("keeps nested provider messages and codes", () => {
    const message = describeWalletProofError({
      code: -32603,
      data: {
        originalError: {
          message: "Ledger: blind signing must be enabled"
        }
      }
    }, "signing the proof message in MetaMask");

    expect(message).toContain("signing the proof message in MetaMask");
    expect(message).toContain("Ledger: blind signing must be enabled");
    expect(message).toContain("-32603");
  });

  it("turns user rejection into a recovery hint", () => {
    const message = describeWalletProofError({ code: 4001 }, "connecting to the browser wallet");

    expect(message).toContain("rejected or canceled");
    expect(message).toContain("Ledger-backed account");
  });
});
