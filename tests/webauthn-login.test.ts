import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalCwd = process.cwd();
let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "silly-goose-webauthn-login-"));
  process.chdir(tempDir);
  vi.resetModules();
});

afterEach(async () => {
  process.chdir(originalCwd);
  await rm(tempDir, { recursive: true, force: true });
  vi.resetModules();
});

describe("Security Key login options", () => {
  it("can start login without a goose handle so the signer identifies the profile", async () => {
    const { updateStore, readStore } = await import("@/lib/auth/store");
    const { authenticationOptions } = await import("@/lib/auth/webauthn");

    await updateStore((store) => {
      store.users.push({
        id: "goose-user-1",
        name: "0xStinky-Goose",
        handle: "0xStinky-Goose",
        createdAt: new Date().toISOString(),
        credentials: [{
          id: "test-credential-id",
          publicKey: [1, 2, 3],
          counter: 0,
          transports: ["usb"]
        }]
      });
    });

    const request = new Request("http://localhost:3000/api/webauthn/login/options", {
      headers: { origin: "http://localhost:3000" }
    });
    const { options, user } = await authenticationOptions(request, undefined, "login");
    const store = await readStore();

    expect(user).toBeNull();
    expect(options.allowCredentials).toBeUndefined();
    expect(store.challenges).toContainEqual(expect.objectContaining({
      key: "login:discoverable",
      purpose: "login"
    }));
  });
});
