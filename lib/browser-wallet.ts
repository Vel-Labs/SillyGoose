"use client";

export type EthereumProvider = {
  request<T = unknown>(args: { method: string; params?: unknown[] }): Promise<T>;
  isMetaMask?: boolean;
  isPhantom?: boolean;
  isLedgerConnect?: boolean;
  providers?: EthereumProvider[];
};

export type BrowserWalletProvider = {
  provider: EthereumProvider;
  name: string;
};

type Eip6963ProviderDetail = {
  info?: {
    name?: string;
    rdns?: string;
  };
  provider?: EthereumProvider;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

function providerName(provider: EthereumProvider, fallback = "Browser wallet") {
  if (provider.isMetaMask) return "MetaMask";
  if (provider.isLedgerConnect) return "Ledger wallet provider";
  if (provider.isPhantom) return "Phantom";
  return fallback;
}

function providerScore(wallet: BrowserWalletProvider) {
  const name = wallet.name.toLowerCase();
  if (wallet.provider.isLedgerConnect || name.includes("ledger")) return 0;
  if (wallet.provider.isMetaMask || name.includes("metamask")) return 1;
  if (wallet.provider.isPhantom || name.includes("phantom")) return 4;
  return 2;
}

export function choosePreferredBrowserWallet(candidates: BrowserWalletProvider[]) {
  return candidates.sort((a, b) => providerScore(a) - providerScore(b))[0] ?? null;
}

export async function getPreferredBrowserWallet(): Promise<BrowserWalletProvider | null> {
  if (typeof window === "undefined") return null;

  const candidates: BrowserWalletProvider[] = [];
  const seen = new Set<EthereumProvider>();
  const addProvider = (provider: EthereumProvider | undefined, name?: string) => {
    if (!provider || seen.has(provider)) return;
    seen.add(provider);
    candidates.push({ provider, name: name || providerName(provider) });
  };

  if (window.ethereum?.providers?.length) {
    for (const provider of window.ethereum.providers) addProvider(provider, providerName(provider));
  }
  addProvider(window.ethereum, providerName(window.ethereum ?? ({} as EthereumProvider)));

  await new Promise<void>((resolve) => {
    const onProvider = (event: Event) => {
      const detail = (event as CustomEvent<Eip6963ProviderDetail>).detail;
      addProvider(detail?.provider, detail?.info?.name || detail?.info?.rdns);
    };
    window.addEventListener("eip6963:announceProvider", onProvider);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    window.setTimeout(() => {
      window.removeEventListener("eip6963:announceProvider", onProvider);
      resolve();
    }, 100);
  });

  return choosePreferredBrowserWallet(candidates);
}
