import type { AuthUser } from "./types";
import { resolveAvatarUrl } from "@/utils/avatar";

const PROFILE_STORAGE_KEY = "gemini_auth_user";
const PROFILE_UPDATED_EVENT = "gemini-auth-profile-updated";

const emitProfileUpdated = (profile: AuthUser | null): void => {
  window.dispatchEvent(
    new CustomEvent<AuthUser | null>(PROFILE_UPDATED_EVENT, {
      detail: profile,
    }),
  );
};

export const getCachedProfile = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.id !== "number" || typeof parsed.account !== "string") {
      return null;
    }
    return {
      ...parsed,
      avatar: resolveAvatarUrl(parsed.avatar),
    };
  } catch {
    return null;
  }
};

export const saveCachedProfile = (profile: AuthUser): void => {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  emitProfileUpdated(profile);
};

export const clearCachedProfile = (): void => {
  localStorage.removeItem(PROFILE_STORAGE_KEY);
  emitProfileUpdated(null);
};

export const subscribeProfileChanges = (
  listener: (profile: AuthUser | null) => void,
): (() => void) => {
  const handleEvent = (event: Event): void => {
    const customEvent = event as CustomEvent<AuthUser | null>;
    listener(customEvent.detail ?? null);
  };
  window.addEventListener(PROFILE_UPDATED_EVENT, handleEvent as EventListener);
  return () => {
    window.removeEventListener(
      PROFILE_UPDATED_EVENT,
      handleEvent as EventListener,
    );
  };
};
