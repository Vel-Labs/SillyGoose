import { describe, expect, it } from "vitest";
import { choosePreferredBrowserWallet, type BrowserWalletProvider } from "../lib/browser-wallet";

describe("browser wallet provider selection", () => {
  it("prefers a Ledger-named provider over generic injected wallets", () => {
    const selected = choosePreferredBrowserWallet([
      wallet("Phantom", { isPhantom: true }),
      wallet("Ledger Connect"),
      wallet("MetaMask", { isMetaMask: true })
    ]);

    expect(selected?.name).toBe("Ledger Connect");
  });

  it("prefers MetaMask over Phantom when both extensions inject EVM providers", () => {
    const selected = choosePreferredBrowserWallet([
      wallet("Phantom", { isPhantom: true }),
      wallet("MetaMask", { isMetaMask: true })
    ]);

    expect(selected?.name).toBe("MetaMask");
  });
});

function wallet(name: string, flags: Partial<BrowserWalletProvider["provider"]> = {}): BrowserWalletProvider {
  return {
    name,
    provider: {
      async request() {
        return undefined;
      },
      ...flags
    }
  };
}
