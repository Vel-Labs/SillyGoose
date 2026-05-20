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

  it("clears stale per-user login challenges before starting discoverable login", async () => {
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
      store.challenges.push({
        key: "login:goose-user-1",
        value: "stale-challenge",
        userId: "goose-user-1",
        purpose: "login",
        createdAt: new Date(Date.now() - 60_000).toISOString()
      });
    });

    const request = new Request("http://localhost:3000/api/webauthn/login/options", {
      headers: { origin: "http://localhost:3000" }
    });
    await authenticationOptions(request, undefined, "login");
    const store = await readStore();

    expect(store.challenges).not.toContainEqual(expect.objectContaining({ key: "login:goose-user-1" }));
    expect(store.challenges).toHaveLength(1);
    expect(store.challenges[0]).toMatchObject({ key: "login:discoverable", purpose: "login" });
  });

  it("starts handle-scoped login with stored credential ids", async () => {
    const { updateStore, readStore } = await import("@/lib/auth/store");
    const { authenticationOptions } = await import("@/lib/auth/webauthn");

    await updateStore((store) => {
      store.users.push({
        id: "goose-user-1",
        name: "0xVel-Goose",
        handle: "0xVel-Goose",
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
    const { options, user } = await authenticationOptions(request, "0xVel-Goose", "login");
    const store = await readStore();

    expect(user?.handle).toBe("0xVel-Goose");
    expect(options.allowCredentials).toEqual([expect.objectContaining({ id: "test-credential-id" })]);
    expect(store.challenges).toContainEqual(expect.objectContaining({
      key: "login:goose-user-1",
      userId: "goose-user-1",
      purpose: "login"
    }));
  });
});
