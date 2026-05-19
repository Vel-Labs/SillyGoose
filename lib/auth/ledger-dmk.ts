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

function describeLedgerPrepareError(error: unknown) {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const tag = typeof error === "object" && error && "_tag" in error ? String((error as { _tag?: unknown })._tag) : "";

  if (tag === "DeviceLockedError" || /locked/i.test(message)) {
    return "Ledger is locked. Unlock it, keep it on the dashboard or in the Security Key app, then try again.";
  }
  if (/CLA not supported/i.test(message)) {
    return "Ledger DMK could not open the app from the current device state. If the Security Key app is already open, continue with Sign in/Register. Otherwise open Security Key manually on the Ledger, then continue.";
  }
  if (/Unknown application name|6807/i.test(message)) {
    return "The Security Key app was not found on this Ledger. Install it in Ledger Wallet/Ledger Live, open it on the device, then continue.";
  }
  return message || "Ledger preparation failed. Open the Security Key app on the signer manually, then continue.";
}

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
    const [{ DeviceActionStatus, DeviceManagementKitBuilder, OpenAppDeviceAction }, { webHidTransportFactory }] = await Promise.all([
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

    await new Promise<void>((resolve, reject) => {
      const action = new OpenAppDeviceAction({
        input: {
          appName: "Security Key",
          unlockTimeout: 30000
        }
      });
      const { observable, cancel } = (dmk as any).executeDeviceAction({ sessionId, deviceAction: action });
      const subscription = observable.subscribe({
        next: (state: any) => {
          if (state.status === DeviceActionStatus.Pending) {
            if (state.intermediateValue?.requiredUserInteraction === "unlock-device") {
              onStatus?.("Unlock the Ledger signer to continue.");
            } else if (state.intermediateValue?.requiredUserInteraction === "confirm-open-app") {
              onStatus?.("Confirm opening the Security Key app on the Ledger signer.");
            }
          }
          if (state.status === DeviceActionStatus.Completed) {
            subscription.unsubscribe();
            resolve();
          }
          if (state.status === DeviceActionStatus.Error) {
            subscription.unsubscribe();
            reject(state.error);
          }
          if (state.status === DeviceActionStatus.Stopped) {
            subscription.unsubscribe();
            reject(new Error("Ledger preparation was stopped."));
          }
        },
        error: (error: unknown) => {
          cancel?.();
          reject(error);
        }
      });
    });

    return { ok: true, message: "On-device Security Key app is open. Continue with the browser WebAuthn prompt." };
  } catch (error) {
    return {
      ok: false,
      message: describeLedgerPrepareError(error)
    };
  }
}
