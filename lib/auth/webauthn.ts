import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON
} from "@simplewebauthn/server";
import { formatGooseHandle } from "./goose-handle";
import { getOrCreateUser, readStore, updateStore, type DemoUser, type PasskeyCredential } from "./store";

export const rpName = "Silly Goose Entertainment";

export function getOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) return origin;
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export function getRpID(request: Request) {
  return new URL(getOrigin(request)).hostname;
}

function uint8ToArray(value: Uint8Array | ArrayBuffer | number[]) {
  if (Array.isArray(value)) return value;
  return Array.from(value instanceof Uint8Array ? value : new Uint8Array(value));
}

function arrayToUint8(value: number[]) {
  return new Uint8Array(value);
}

export async function registrationOptions(request: Request, handle: string) {
  const user = await getOrCreateUser(handle);
  const options = await generateRegistrationOptions({
    rpName,
    rpID: getRpID(request),
    userID: new TextEncoder().encode(user.id),
    userName: user.handle,
    userDisplayName: user.name,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred"
    },
    excludeCredentials: user.credentials.map((credential) => ({ id: credential.id, transports: credential.transports as any }))
  });
  await updateStore((store) => {
    store.challenges = store.challenges.filter((challenge) => challenge.key !== `register:${user.id}`);
    store.challenges.push({
      key: `register:${user.id}`,
      value: options.challenge,
      userId: user.id,
      purpose: "register",
      createdAt: new Date().toISOString()
    });
  });
  return options;
}

export async function verifyRegistration(request: Request, handle: string, response: RegistrationResponseJSON) {
  const user = await getOrCreateUser(handle);
  const store = await readStore();
  const challenge = store.challenges.find((candidate) => candidate.key === `register:${user.id}`);
  if (!challenge) throw new Error("Registration challenge expired. Start registration again.");
  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: challenge.value,
    expectedOrigin: getOrigin(request),
    expectedRPID: getRpID(request)
  });
  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("Security Key registration was not verified.");
  }
  const info = verification.registrationInfo as any;
  const credential: PasskeyCredential = {
    id: info.credential?.id ?? info.credentialID,
    publicKey: uint8ToArray(info.credential?.publicKey ?? info.credentialPublicKey),
    counter: info.credential?.counter ?? info.counter ?? 0,
    transports: response.response.transports,
    deviceType: info.credentialDeviceType,
    backedUp: info.credentialBackedUp
  };
  await updateStore((draft) => {
    const target = draft.users.find((candidate) => candidate.id === user.id) as DemoUser;
    target.credentials = target.credentials.filter((candidate) => candidate.id !== credential.id);
    target.credentials.push(credential);
    draft.challenges = draft.challenges.filter((candidate) => candidate.key !== `register:${user.id}`);
  });
  return user;
}

export async function authenticationOptions(request: Request, handle: string, purpose: "login" | "admin" | "player2" = "login") {
  const store = await readStore();
  const normalized = formatGooseHandle(handle);
  const legacy = handle.trim().toLowerCase();
  const user = store.users.find((candidate) => {
    const stored = candidate.handle.toLowerCase();
    return stored === normalized.toLowerCase() || stored === legacy;
  });
  if (!user || user.credentials.length === 0) {
    throw new Error("No registered Security Key found for that goose handle.");
  }
  const options = await generateAuthenticationOptions({
    rpID: getRpID(request),
    userVerification: "preferred",
    allowCredentials: user.credentials.map((credential) => ({ id: credential.id, transports: credential.transports as any }))
  });
  await updateStore((draft) => {
    draft.challenges = draft.challenges.filter((challenge) => challenge.key !== `${purpose}:${user.id}`);
    draft.challenges.push({
      key: `${purpose}:${user.id}`,
      value: options.challenge,
      userId: user.id,
      purpose,
      createdAt: new Date().toISOString()
    });
  });
  return { options, user };
}

export async function verifyAuthentication(
  request: Request,
  handle: string,
  response: AuthenticationResponseJSON,
  purpose: "login" | "admin" | "player2" = "login"
) {
  const store = await readStore();
  const normalized = formatGooseHandle(handle);
  const legacy = handle.trim().toLowerCase();
  const user = store.users.find((candidate) => {
    const stored = candidate.handle.toLowerCase();
    return stored === normalized.toLowerCase() || stored === legacy;
  });
  if (!user) throw new Error("No registered goose found for this handle.");
  const credential = user.credentials.find((candidate) => candidate.id === response.id);
  if (!credential) throw new Error("This Security Key is not registered for that goose.");
  const challenge = store.challenges.find((candidate) => candidate.key === `${purpose}:${user.id}`);
  if (!challenge) throw new Error("Security Key challenge expired. Start again.");
  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: challenge.value,
    expectedOrigin: getOrigin(request),
    expectedRPID: getRpID(request),
    credential: {
      id: credential.id,
      publicKey: arrayToUint8(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports
    }
  } as any);
  if (!verification.verified) throw new Error("Security Key assertion was not verified.");
  await updateStore((draft) => {
    const target = draft.users.find((candidate) => candidate.id === user.id);
    const targetCredential = target?.credentials.find((candidate) => candidate.id === credential.id);
    if (targetCredential) targetCredential.counter = verification.authenticationInfo.newCounter;
    draft.challenges = draft.challenges.filter((candidate) => candidate.key !== `${purpose}:${user.id}`);
  });
  return user;
}
