import type { AuthenticatedUser } from "@pharmacy-pos/shared";

type GetAccessTokenFn = () => Promise<string | null> | string | null;
type UnauthorizedHandler = () => void;

let getAccessTokenFn: GetAccessTokenFn | null = null;
let userProfile: AuthenticatedUser | null = null;
let unauthorizedHandler: UnauthorizedHandler | null = null;

const userProfileListeners = new Set<() => void>();

export function registerGetAccessToken(fn: GetAccessTokenFn) {
  getAccessTokenFn = fn;
}

export function registerUserProfile(profile: AuthenticatedUser | null) {
  userProfile = profile;
  userProfileListeners.forEach((listener) => listener());
}

export function registerUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler;

  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
}

export function getUserProfile(): AuthenticatedUser | null {
  return userProfile;
}

export function subscribeUserProfile(listener: () => void): () => void {
  userProfileListeners.add(listener);

  return () => {
    userProfileListeners.delete(listener);
  };
}

export async function getAccessToken(): Promise<string | null> {
  if (!getAccessTokenFn) {
    return null;
  }

  try {
    return await getAccessTokenFn();
  } catch {
    return null;
  }
}

export function handleUnauthorized() {
  unauthorizedHandler?.();
}
