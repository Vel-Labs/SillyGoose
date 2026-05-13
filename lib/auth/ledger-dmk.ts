export type LedgerReadiness = {
  available: boolean;
  status: "ready" | "unsupported" | "needs-browser-permission" | "deferred";
  message: string;
};

export type LedgerPrepareResult = {
  ok: boolean;
  message: string;
};

let dmkInstance: unknown;

export function getLedgerReadiness(): LedgerReadiness {
  if (typeof window === "undefined") {
    return { available: false, status: "deferred", message: "Ledger DMK readiness runs in the browser only." };
  }
  if (!("hid" in navigator)) {
    return {
      available: false,
      status: "unsupported",
      message: "This browser does not expose WebHID, so the demo uses browser-native WebAuthn directly."
    };
  }
  return {
    available: true,
    status: "ready",
    message:
      "Browser supports WebHID. Prepare will ask for browser device access, then open the Security Key app on the Ledger signer before WebAuthn."
  };
}

export async function prepareLedgerSecurityKeyApp(onStatus?: (message: string) => void): Promise<LedgerPrepareResult> {
  if (typeof window === "undefined") {
    return { ok: false, message: "Ledger preparation only runs in the browser." };
  }
  if (!("hid" in navigator)) {
    return {
      ok: false,
      message:
        "This browser cannot use Ledger DMK over WebHID. Open the Security Key app on the signer manually, then use the browser WebAuthn prompt."
    };
  }

  try {
    onStatus?.("Requesting Ledger WebHID access. Choose your connected, unlocked signer in the browser prompt.");
    const [{ DeviceManagementKitBuilder, OpenAppCommand, CommandResultStatus }, { webHidTransportFactory }] = await Promise.all([
      import("@ledgerhq/device-management-kit"),
      import("@ledgerhq/device-transport-kit-web-hid")
    ]);

    const dmk =
      dmkInstance ??
      new DeviceManagementKitBuilder()
        .addTransport(webHidTransportFactory)
        .build();
    dmkInstance = dmk;

    const device = await new Promise<unknown>((resolve, reject) => {
      let subscription: { unsubscribe?: () => void } | undefined;
      const timeout = window.setTimeout(() => {
        subscription?.unsubscribe?.();
        reject(new Error("No Ledger signer was selected. Connect it over USB, unlock it, close Ledger Wallet if it is using the device, then try again."));
      }, 45000);

      subscription = (dmk as any).startDiscovering({}).subscribe({
        next: (candidate: unknown) => {
          window.clearTimeout(timeout);
          subscription?.unsubscribe?.();
          resolve(candidate);
        },
        error: (error: unknown) => {
          window.clearTimeout(timeout);
          reject(error);
        }
      });
    });

    onStatus?.("Ledger signer found. Opening the on-device Security Key app...");
    const sessionId = await (dmk as any).connect({
      device,
      sessionRefresherOptions: { isRefresherDisabled: false }
    });
    const result = await (dmk as any).sendCommand({
      sessionId,
      command: new OpenAppCommand({ appName: "Security Key" }),
      abortTimeout: 30000
    });

    if (result?.status === CommandResultStatus?.Error || result?.error) {
      throw new Error(result.error?.message || "Ledger rejected the Security Key app open request.");
    }

    return { ok: true, message: "On-device Security Key app is open. Continue with the browser WebAuthn prompt." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Ledger preparation failed. Install or open the Security Key app on the signer manually, then continue."
    };
  }
}
